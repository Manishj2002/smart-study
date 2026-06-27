import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';

/**
 * Smart Scheduling Algorithm
 * Automatically creates optimal study schedules based on:
 * - Task priority scores
 * - User's available hours per day
 * - Break preferences
 * - Subject balance
 */

export const generateSmartSchedule = async (userId, options = {}) => {
  try {
    const {
      startDate = new Date(),
      days = 7,
      includeWeekends = true
    } = options;

    // Get user preferences
    const user = await User.findById(userId);
    const dailyHours = user.dailyAvailableHours || 4;
    const breakDuration = user.preferredBreakDuration || 15;

    // Get all pending/in-progress tasks sorted by priority score
    const tasks = await Task.find({
      user: userId,
      status: { $in: ['pending', 'in-progress'] },
      isScheduled: false
    })
      .populate('subject')
      .sort({ priorityScore: -1, deadline: 1 });

    if (tasks.length === 0) {
      return {
        success: true,
        message: 'No tasks available to schedule',
        schedules: []
      };
    }

    // Clear existing future schedules
    await Schedule.deleteMany({
      user: userId,
      startTime: { $gte: new Date() },
      status: 'scheduled'
    });

    const schedules = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(9, 0, 0, 0); // Start at 9 AM

    let taskIndex = 0;
    let currentTask = tasks[taskIndex];
    let remainingTaskTime = currentTask.estimatedTime;

    // Generate schedule for specified number of days
    for (let day = 0; day < days; day++) {
      // Skip weekends if not included
      if (!includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
        continue;
      }

      let dailyMinutesUsed = 0;
      const dailyMinutesAvailable = dailyHours * 60;

      // Schedule sessions for this day
      while (dailyMinutesUsed < dailyMinutesAvailable && taskIndex < tasks.length) {
        // Calculate session duration (max 90 minutes per session)
        const maxSessionDuration = 90;
        const sessionDuration = Math.min(
          remainingTaskTime,
          maxSessionDuration,
          dailyMinutesAvailable - dailyMinutesUsed
        );

        if (sessionDuration < 15) break; // Skip if less than 15 minutes

        // Create study session
        const sessionStart = new Date(currentDate);
        const sessionEnd = new Date(currentDate.getTime() + sessionDuration * 60000);

        const schedule = await Schedule.create({
          user: userId,
          task: currentTask._id,
          subject: currentTask.subject._id,
          startTime: sessionStart,
          endTime: sessionEnd,
          duration: sessionDuration,
          status: 'scheduled',
          isBreak: false
        });

        schedules.push(schedule);

        // Update remaining time for current task
        remainingTaskTime -= sessionDuration;
        dailyMinutesUsed += sessionDuration;

        // Move to next task if current task is fully scheduled
        if (remainingTaskTime <= 0) {
          await Task.findByIdAndUpdate(currentTask._id, { isScheduled: true });
          taskIndex++;
          if (taskIndex < tasks.length) {
            currentTask = tasks[taskIndex];
            remainingTaskTime = currentTask.estimatedTime;
          }
        }

        // Add break if not end of day
        if (dailyMinutesUsed < dailyMinutesAvailable && sessionDuration >= 45) {
          currentDate = new Date(sessionEnd.getTime() + breakDuration * 60000);
          dailyMinutesUsed += breakDuration;

          // Create break session
          const breakEnd = new Date(currentDate);
          await Schedule.create({
            user: userId,
            task: null,
            subject: null,
            startTime: sessionEnd,
            endTime: breakEnd,
            duration: breakDuration,
            status: 'scheduled',
            isBreak: true
          });
        } else {
          currentDate = sessionEnd;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }

    return {
      success: true,
      message: `Successfully scheduled ${schedules.length} study sessions`,
      scheduledTasks: taskIndex,
      totalTasks: tasks.length,
      schedules
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Reschedule missed or skipped sessions
 */
export const rescheduleMissedSessions = async (userId) => {
  try {
    const now = new Date();

    // Find all missed sessions (past time but still in scheduled status)
    const missedSchedules = await Schedule.find({
      user: userId,
      status: 'scheduled',
      endTime: { $lt: now }
    }).populate('task');

    // Mark them as skipped
    for (const schedule of missedSchedules) {
      schedule.status = 'skipped';
      await schedule.save();

      // Unschedule the task so it can be rescheduled
      if (schedule.task) {
        await Task.findByIdAndUpdate(schedule.task._id, { isScheduled: false });
      }
    }

    // Regenerate schedule for unscheduled tasks
    const result = await generateSmartSchedule(userId, { days: 7 });

    return {
      success: true,
      missedSessions: missedSchedules.length,
      ...result
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Balance subjects in schedule
 * Ensures no single subject dominates the schedule
 */
export const balanceSubjectSchedule = async (userId, days = 7) => {
  try {
    const user = await User.findById(userId);

    // Get all subjects with pending tasks
    const subjects = await Subject.find({
      user: userId,
      isActive: true
    });

    const subjectTaskCounts = {};
    for (const subject of subjects) {
      const count = await Task.countDocuments({
        subject: subject._id,
        status: { $in: ['pending', 'in-progress'] },
        isScheduled: false
      });
      subjectTaskCounts[subject._id] = count;
    }

    // Get tasks grouped by subject, sorted by priority
    const tasksBySubject = {};
    for (const subject of subjects) {
      tasksBySubject[subject._id] = await Task.find({
        subject: subject._id,
        status: { $in: ['pending', 'in-progress'] },
        isScheduled: false
      }).sort({ priorityScore: -1 });
    }

    // Round-robin scheduling to balance subjects
    const schedules = [];
    let currentDate = new Date();
    currentDate.setHours(9, 0, 0, 0);

    const dailyHours = user.dailyAvailableHours || 4;
    const dailyMinutesAvailable = dailyHours * 60;

    for (let day = 0; day < days; day++) {
      let dailyMinutesUsed = 0;
      let subjectIndex = 0;

      while (dailyMinutesUsed < dailyMinutesAvailable) {
        const subjectIds = Object.keys(tasksBySubject);
        if (subjectIds.length === 0) break;

        const subjectId = subjectIds[subjectIndex % subjectIds.length];
        const tasks = tasksBySubject[subjectId];

        if (tasks.length > 0) {
          const task = tasks[0];
          const sessionDuration = Math.min(task.estimatedTime, 60, dailyMinutesAvailable - dailyMinutesUsed);

          if (sessionDuration >= 15) {
            const sessionStart = new Date(currentDate);
            const sessionEnd = new Date(currentDate.getTime() + sessionDuration * 60000);

            await Schedule.create({
              user: userId,
              task: task._id,
              subject: subjectId,
              startTime: sessionStart,
              endTime: sessionEnd,
              duration: sessionDuration,
              status: 'scheduled'
            });

            task.estimatedTime -= sessionDuration;
            if (task.estimatedTime <= 0) {
              tasks.shift();
              await Task.findByIdAndUpdate(task._id, { isScheduled: true });
            }

            currentDate = sessionEnd;
            dailyMinutesUsed += sessionDuration;
          }
        } else {
          delete tasksBySubject[subjectId];
        }

        subjectIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }

    return {
      success: true,
      message: 'Schedule balanced across subjects',
      schedules
    };
  } catch (error) {
    throw error;
  }
};