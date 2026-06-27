import Subject from '../models/Subject.js';
import Task from '../models/Task.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
export const createSubject = async (req, res, next) => {
  try {
    const { name, description, color, difficulty, priority, examDate } = req.body;

    // Validation
    if (!name) {
      return next(new AppError('Please provide a subject name', 400));
    }

    // Create subject
    const subject = await Subject.create({
      user: req.user._id,
      name,
      description: description || '',
      color: color || '#3B82F6',
      difficulty: difficulty || 'medium',
      priority: priority || 5,
      examDate: examDate || null
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subjects for logged in user
// @route   GET /api/subjects
// @access  Private
export const getSubjects = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    // Build query
    const query = { user: req.user._id };
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subjects = await Subject.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: { subjects }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
export const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check if subject belongs to user
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this subject', 403));
    }

    res.status(200).json({
      success: true,
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
export const updateSubject = async (req, res, next) => {
  try {
    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check if subject belongs to user
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this subject', 403));
    }

    const { name, description, color, difficulty, priority, examDate, isActive } = req.body;

    // Update fields
    if (name !== undefined) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (color !== undefined) subject.color = color;
    if (difficulty !== undefined) subject.difficulty = difficulty;
    if (priority !== undefined) subject.priority = priority;
    if (examDate !== undefined) subject.examDate = examDate;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check if subject belongs to user
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this subject', 403));
    }

    // Check if there are any tasks associated with this subject
    const taskCount = await Task.countDocuments({ subject: subject._id });

    if (taskCount > 0) {
      return next(new AppError(
        `Cannot delete subject. ${taskCount} task(s) are associated with it. Please delete or reassign tasks first.`,
        400
      ));
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subject statistics
// @route   GET /api/subjects/:id/stats
// @access  Private
export const getSubjectStats = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check if subject belongs to user
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this subject', 403));
    }

    // Get task statistics for this subject
    const totalTasks = await Task.countDocuments({ subject: subject._id });
    const completedTasks = await Task.countDocuments({ subject: subject._id, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ subject: subject._id, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ subject: subject._id, status: 'in-progress' });

    // Calculate total estimated and actual time
    const tasks = await Task.find({ subject: subject._id });
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const totalActualTime = tasks.reduce((sum, task) => sum + task.actualTime, 0);

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
      totalEstimatedTime, // in minutes
      totalActualTime, // in minutes
      totalStudyHours: subject.totalStudyHours,
      daysUntilExam: subject.daysUntilExam
    };

    res.status(200).json({
      success: true,
      data: {
        subject: subject.name,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update total study hours for subject
// @route   PUT /api/subjects/:id/study-hours
// @access  Private
export const updateStudyHours = async (req, res, next) => {
  try {
    const { hours } = req.body;

    if (hours === undefined || hours < 0) {
      return next(new AppError('Please provide valid study hours', 400));
    }

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check if subject belongs to user
    if (subject.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this subject', 403));
    }

    subject.totalStudyHours += hours;
    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Study hours updated successfully',
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
};