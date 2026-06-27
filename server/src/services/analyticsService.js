import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Today's overview
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySchedules = await Schedule.find({
      user: userId,
      startTime: { $gte: today, $lt: tomorrow }
    }).populate(['task', 'subject']);

    const todayCompleted = todaySchedules.filter(s => s.status === 'completed').length;
    const todayTotal = todaySchedules.length;
    const todayStudyTime = todaySchedules
      .filter(s => s.status === 'completed' && !s.isBreak)
      .reduce((sum, s) => sum + s.actualDuration, 0);

    // Overall stats
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ user: userId, status: 'pending' });
    const overdueTasks = await Task.countDocuments({
      user: userId,
      status: { $ne: 'completed' },
      deadline: { $lt: new Date() }
    });

    // Upcoming deadlines (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingTasks = await Task.find({
      user: userId,
      status: { $ne: 'completed' },
      deadline: { $gte: new Date(), $lte: nextWeek }
    })
      .populate('subject', 'name color')
      .sort({ deadline: 1 })
      .limit(5);

    // Productivity score (0-100)
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const scheduleCompletionRate = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
    const productivityScore = Math.round((completionRate * 0.6) + (scheduleCompletionRate * 0.4));

    // Subject progress
    const subjects = await Subject.find({ user: userId, isActive: true });
    const subjectProgress = await Promise.all(
      subjects.map(async (subject) => {
        const total = await Task.countDocuments({ subject: subject._id });
        const completed = await Task.countDocuments({ subject: subject._id, status: 'completed' });
        return {
          subject: subject.name,
          color: subject.color,
          total,
          completed,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
          daysUntilExam: subject.daysUntilExam
        };
      })
    );

    return {
      today: {
        date: today,
        scheduledSessions: todayTotal,
        completedSessions: todayCompleted,
        studyTime: todayStudyTime,
        completionRate: todayTotal > 0 ? ((todayCompleted / todayTotal) * 100).toFixed(1) : 0
      },
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: completionRate.toFixed(1),
        productivityScore
      },
      upcomingDeadlines: upcomingTasks,
      subjectProgress,
      todaySchedule: todaySchedules
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get weekly productivity report
 */
export const getWeeklyReport = async (userId) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Daily breakdown
    const dailyStats = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekAgo);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const schedules = await Schedule.find({
        user: userId,
        startTime: { $gte: dayStart, $lt: dayEnd },
        status: 'completed',
        isBreak: false
      });

      const studyTime = schedules.reduce((sum, s) => sum + s.actualDuration, 0);
      const sessions = schedules.length;
      const avgFocus = schedules.length > 0
        ? schedules.reduce((sum, s) => sum + (s.focusScore || 0), 0) / schedules.length
        : 0;

      dailyStats.push({
        date: dayStart,
        dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        studyTime, // minutes
        studyHours: (studyTime / 60).toFixed(1),
        sessions,
        avgFocusScore: avgFocus.toFixed(1)
      });
    }

    // Weekly totals
    const totalStudyTime = dailyStats.reduce((sum, day) => sum + day.studyTime, 0);
    const totalSessions = dailyStats.reduce((sum, day) => sum + day.sessions, 0);
    const avgDailyTime = totalStudyTime / 7;

    // Tasks completed this week
    const tasksCompleted = await Task.countDocuments({
      user: userId,
      status: 'completed',
      completedAt: { $gte: weekAgo, $lte: today }
    });

    // Subject breakdown
    const subjectTime = await Schedule.aggregate([
      {
        $match: {
          user: userId,
          startTime: { $gte: weekAgo, $lte: today },
          status: 'completed',
          isBreak: false
        }
      },
      {
        $group: {
          _id: '$subject',
          totalTime: { $sum: '$actualDuration' },
          sessions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      {
        $unwind: '$subjectDetails'
      },
      {
        $project: {
          subject: '$subjectDetails.name',
          color: '$subjectDetails.color',
          totalTime: 1,
          totalHours: { $divide: ['$totalTime', 60] },
          sessions: 1
        }
      }
    ]);

    return {
      period: {
        start: weekAgo,
        end: today
      },
      summary: {
        totalStudyTime, // minutes
        totalStudyHours: (totalStudyTime / 60).toFixed(1),
        totalSessions,
        tasksCompleted,
        avgDailyTime: avgDailyTime.toFixed(1),
        avgDailyHours: (avgDailyTime / 60).toFixed(1)
      },
      dailyBreakdown: dailyStats,
      subjectBreakdown: subjectTime
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get monthly trends
 */
export const getMonthlyTrends = async (userId) => {
  try {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Weekly aggregation
    const weeklyStats = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(monthAgo);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const schedules = await Schedule.find({
        user: userId,
        startTime: { $gte: weekStart, $lt: weekEnd },
        status: 'completed',
        isBreak: false
      });

      const studyTime = schedules.reduce((sum, s) => sum + s.actualDuration, 0);

      const tasks = await Task.countDocuments({
        user: userId,
        status: 'completed',
        completedAt: { $gte: weekStart, $lt: weekEnd }
      });

      weeklyStats.push({
        week: `Week ${week + 1}`,
        startDate: weekStart,
        studyHours: (studyTime / 60).toFixed(1),
        tasksCompleted: tasks
      });
    }

    // Difficulty analysis
    const difficultyStats = await Task.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $gte: monthAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' }
        }
      }
    ]);

    // Best performing subjects
    const subjectPerformance = await Task.aggregate([
      {
        $match: {
          user: userId,
          completedAt: { $gte: monthAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: '$subject',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      {
        $unwind: '$subjectDetails'
      },
      {
        $project: {
          subject: '$subjectDetails.name',
          color: '$subjectDetails.color',
          completed: 1,
          total: 1,
          completionRate: {
            $multiply: [{ $divide: ['$completed', '$total'] }, 100]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    return {
      period: {
        start: monthAgo,
        end: today
      },
      weeklyTrends: weeklyStats,
      difficultyAnalysis: difficultyStats,
      subjectPerformance
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get focus score insights
 */
export const getFocusInsights = async (userId) => {
  try {
    const schedules = await Schedule.find({
      user: userId,
      status: 'completed',
      focusScore: { $exists: true, $ne: null }
    }).populate('subject', 'name color');

    if (schedules.length === 0) {
      return {
        message: 'No focus data available yet',
        avgFocusScore: 0,
        insights: []
      };
    }

    const avgFocusScore = schedules.reduce((sum, s) => sum + s.focusScore, 0) / schedules.length;

    // Focus by subject
    const focusBySubject = {};
    schedules.forEach(s => {
      if (s.subject) {
        const subjectName = s.subject.name;
        if (!focusBySubject[subjectName]) {
          focusBySubject[subjectName] = { scores: [], color: s.subject.color };
        }
        focusBySubject[subjectName].scores.push(s.focusScore);
      }
    });

    const subjectFocus = Object.entries(focusBySubject).map(([subject, data]) => ({
      subject,
      color: data.color,
      avgFocusScore: (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)
    })).sort((a, b) => b.avgFocusScore - a.avgFocusScore);

    // Focus by time of day
    const focusByHour = {};
    schedules.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      if (!focusByHour[hour]) focusByHour[hour] = [];
      focusByHour[hour].push(s.focusScore);
    });

    const hourlyFocus = Object.entries(focusByHour).map(([hour, scores]) => ({
      hour: parseInt(hour),
      timeSlot: `${hour}:00`,
      avgFocusScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    })).sort((a, b) => a.hour - b.hour);

    return {
      avgFocusScore: avgFocusScore.toFixed(1),
      totalSessions: schedules.length,
      focusBySubject: subjectFocus,
      focusByTimeOfDay: hourlyFocus,
      bestFocusTime: hourlyFocus.reduce((best, current) =>
        parseFloat(current.avgFocusScore) > parseFloat(best.avgFocusScore) ? current : best
      )
    };
  } catch (error) {
    throw error;
  }
};