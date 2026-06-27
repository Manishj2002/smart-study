import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import Schedule from '../models/Schedule.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const { subject, title, description, difficulty, estimatedTime, deadline, priority, notes } = req.body;

    // Validation
    if (!title) {
      return next(new AppError('Please provide a task title', 400));
    }
    if (!subject) {
      return next(new AppError('Please specify a subject', 400));
    }
    if (!deadline) {
      return next(new AppError('Please provide a deadline', 400));
    }
    if (!estimatedTime) {
      return next(new AppError('Please provide estimated time', 400));
    }

    // Check if subject exists and belongs to user
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return next(new AppError('Subject not found', 404));
    }
    if (subjectDoc.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to add tasks to this subject', 403));
    }

    // Create task
    const task = await Task.create({
      user: req.user._id,
      subject,
      title,
      description: description || '',
      difficulty: difficulty || 'medium',
      estimatedTime,
      deadline,
      priority: priority || 5,
      notes: notes || ''
    });

    // Populate subject details
    await task.populate('subject', 'name color');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { status, subject, difficulty, sortBy } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Filters
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;

    // Build sort
    let sort = {};
    if (sortBy === 'deadline') {
      sort = { deadline: 1 }; // Ascending (earliest first)
    } else if (sortBy === 'priority') {
      sort = { priorityScore: -1 }; // Descending (highest first)
    } else if (sortBy === 'difficulty') {
      sort = { difficulty: -1 };
    } else {
      sort = { createdAt: -1 }; // Default: newest first
    }

    const tasks = await Task.find(query)
      .populate('subject', 'name color difficulty')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('subject', 'name color difficulty examDate');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this task', 403));
    }

    res.status(200).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this task', 403));
    }

    const { subject, title, description, difficulty, estimatedTime, deadline, priority, status, notes, actualTime } = req.body;

    // If changing subject, verify new subject exists and belongs to user
    if (subject && subject !== task.subject.toString()) {
      const subjectDoc = await Subject.findById(subject);
      if (!subjectDoc) {
        return next(new AppError('Subject not found', 404));
      }
      if (subjectDoc.user.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to assign task to this subject', 403));
      }
      task.subject = subject;
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (difficulty !== undefined) task.difficulty = difficulty;
    if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
    if (deadline !== undefined) task.deadline = deadline;
    if (priority !== undefined) task.priority = priority;
    if (notes !== undefined) task.notes = notes;
    if (actualTime !== undefined) task.actualTime = actualTime;

    // Handle status changes
    if (status !== undefined) {
      task.status = status;
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (status !== 'completed') {
        task.completedAt = null;
      }
    }

    await task.save();
    await task.populate('subject', 'name color');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this task', 403));
    }

    // Delete associated schedules
    await Schedule.deleteMany({ task: task._id });

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task and associated schedules deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as completed
// @route   PUT /api/tasks/:id/complete
// @access  Private
export const completeTask = async (req, res, next) => {
  try {
    const { actualTime } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this task', 403));
    }

    task.status = 'completed';
    task.completedAt = new Date();
    if (actualTime) {
      task.actualTime = actualTime;
    }

    await task.save();
    await task.populate('subject', 'name color');

    res.status(200).json({
      success: true,
      message: 'Task marked as completed',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private
export const getOverdueTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
      deadline: { $lt: new Date() }
    })
      .populate('subject', 'name color')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming tasks (next 7 days)
// @route   GET /api/tasks/upcoming
// @access  Private
export const getUpcomingTasks = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
      deadline: { 
        $gte: new Date(),
        $lte: futureDate 
      }
    })
      .populate('subject', 'name color')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks by subject
// @route   GET /api/tasks/subject/:subjectId
// @access  Private
export const getTasksBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    // Verify subject exists and belongs to user
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this subject', 403));
    }

    const tasks = await Task.find({ 
      user: req.user._id,
      subject: subjectId 
    })
      .populate('subject', 'name color')
      .sort({ priorityScore: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
export const getTaskStats = async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user._id });
    const completedTasks = await Task.countDocuments({ user: req.user._id, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ user: req.user._id, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ user: req.user._id, status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({
      user: req.user._id,
      status: { $ne: 'completed' },
      deadline: { $lt: new Date() }
    });

    // Get tasks grouped by difficulty
    const tasksByDifficulty = await Task.aggregate([
      { $match: { user: req.user._id } },
      { 
        $group: { 
          _id: '$difficulty', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // Get tasks grouped by subject
    const tasksBySubject = await Task.aggregate([
      { $match: { user: req.user._id } },
      { 
        $group: { 
          _id: '$subject', 
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
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
          subjectId: '$_id',
          subjectName: '$subjectDetails.name',
          color: '$subjectDetails.color',
          totalTasks: '$count',
          completedTasks: '$completed',
          completionRate: {
            $multiply: [{ $divide: ['$completed', '$count'] }, 100]
          }
        }
      }
    ]);

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
      tasksByDifficulty,
      tasksBySubject
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};