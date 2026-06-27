import Schedule from '../models/Schedule.js';
import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { generateSmartSchedule, rescheduleMissedSessions, balanceSubjectSchedule } from '../services/schedulerService.js';

// @desc    Create a schedule session
// @route   POST /api/schedules
// @access  Private
export const createSchedule = async (req, res, next) => {
  try {
    const { task, startTime, endTime, duration, isBreak } = req.body;

    // Validation
    if (!startTime || !endTime) {
      return next(new AppError('Please provide start time and end time', 400));
    }

    if (!isBreak && !task) {
      return next(new AppError('Please specify a task for non-break sessions', 400));
    }

    let subject = null;

    // If not a break, validate task
    if (!isBreak) {
      const taskDoc = await Task.findById(task);
      if (!taskDoc) {
        return next(new AppError('Task not found', 404));
      }
      if (taskDoc.user.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to schedule this task', 403));
      }
      subject = taskDoc.subject;
    }

    // Calculate duration if not provided
    const calculatedDuration = duration || (new Date(endTime) - new Date(startTime)) / (1000 * 60);

    // Create schedule
    const schedule = await Schedule.create({
      user: req.user._id,
      task: task || null,
      subject: subject || null,
      startTime,
      endTime,
      duration: calculatedDuration,
      isBreak: isBreak || false
    });

    // Update task as scheduled
    if (task) {
      await Task.findByIdAndUpdate(task, { isScheduled: true });
    }

    await schedule.populate(['task', 'subject']);

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate smart schedule automatically
// @route   POST /api/schedules/generate
// @access  Private
export const generateSchedule = async (req, res, next) => {
  try {
    const { days, includeWeekends } = req.body;

    const result = await generateSmartSchedule(req.user._id, {
      days: days || 7,
      includeWeekends: includeWeekends !== false
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule missed sessions
// @route   POST /api/schedules/reschedule
// @access  Private
export const reschedule = async (req, res, next) => {
  try {
    const result = await rescheduleMissedSessions(req.user._id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Balance schedule across subjects
// @route   POST /api/schedules/balance
// @access  Private
export const balanceSchedule = async (req, res, next) => {
  try {
    const { days } = req.body;

    const result = await balanceSubjectSchedule(req.user._id, days || 7);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schedules for logged in user
// @route   GET /api/schedules
// @access  Private
export const getSchedules = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Filter by status
    if (status) query.status = status;

    // Filter by date range
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await Schedule.find(query)
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Private
export const getSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    if (schedule.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this schedule', 403));
    }

    res.status(200).json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private
export const updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    if (schedule.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    const { startTime, endTime, status, focusScore, notes, actualDuration } = req.body;

    // Update fields
    if (startTime !== undefined) schedule.startTime = startTime;
    if (endTime !== undefined) schedule.endTime = endTime;
    if (status !== undefined) {
      schedule.status = status;
      if (status === 'completed') {
        schedule.completedAt = new Date();
      }
    }
    if (focusScore !== undefined) schedule.focusScore = focusScore;
    if (notes !== undefined) schedule.notes = notes;
    if (actualDuration !== undefined) schedule.actualDuration = actualDuration;

    // Recalculate duration if times changed
    if (startTime || endTime) {
      schedule.duration = (new Date(schedule.endTime) - new Date(schedule.startTime)) / (1000 * 60);
    }

    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private
export const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    if (schedule.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this schedule', 403));
    }

    // Update task as not scheduled
    if (schedule.task) {
      await Task.findByIdAndUpdate(schedule.task, { isScheduled: false });
    }

    await schedule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a schedule session
// @route   PUT /api/schedules/:id/complete
// @access  Private
export const completeSchedule = async (req, res, next) => {
  try {
    const { actualDuration, focusScore, notes } = req.body;

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    if (schedule.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    schedule.status = 'completed';
    schedule.completedAt = new Date();
    if (actualDuration) schedule.actualDuration = actualDuration;
    if (focusScore) schedule.focusScore = focusScore;
    if (notes) schedule.notes = notes;

    await schedule.save();

    // Update task actual time
    if (schedule.task && actualDuration) {
      const task = await Task.findById(schedule.task);
      task.actualTime += actualDuration;
      await task.save();
    }

    // Update subject total study hours
    if (schedule.subject && actualDuration) {
      const subject = await Subject.findById(schedule.subject);
      subject.totalStudyHours += (actualDuration / 60); // Convert to hours
      await subject.save();
    }

    res.status(200).json({
      success: true,
      message: 'Schedule completed successfully',
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's schedule
// @route   GET /api/schedules/today
// @access  Private
export const getTodaySchedule = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await Schedule.find({
      user: req.user._id,
      startTime: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get week's schedule
// @route   GET /api/schedules/week
// @access  Private
export const getWeekSchedule = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    const schedules = await Schedule.find({
      user: req.user._id,
      startTime: {
        $gte: today,
        $lt: weekLater
      }
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get schedule statistics
// @route   GET /api/schedules/stats
// @access  Private
export const getScheduleStats = async (req, res, next) => {
  try {
    const totalSessions = await Schedule.countDocuments({ user: req.user._id });
    const completedSessions = await Schedule.countDocuments({ user: req.user._id, status: 'completed' });
    const skippedSessions = await Schedule.countDocuments({ user: req.user._id, status: 'skipped' });

    // Get total study time (completed sessions)
    const completedSchedules = await Schedule.find({ 
      user: req.user._id, 
      status: 'completed' 
    });

    const totalPlannedTime = completedSchedules.reduce((sum, s) => sum + s.duration, 0);
    const totalActualTime = completedSchedules.reduce((sum, s) => sum + s.actualDuration, 0);
    const avgFocusScore = completedSchedules
      .filter(s => s.focusScore)
      .reduce((sum, s, _, arr) => sum + s.focusScore / arr.length, 0);

    const stats = {
      totalSessions,
      completedSessions,
      skippedSessions,
      completionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(2) : 0,
      totalPlannedTime, // minutes
      totalActualTime, // minutes
      totalPlannedHours: (totalPlannedTime / 60).toFixed(2),
      totalActualHours: (totalActualTime / 60).toFixed(2),
      averageFocusScore: avgFocusScore.toFixed(2)
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};