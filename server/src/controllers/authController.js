import User from '../models/User.js';
import { generateToken } from '../middlewares/authMiddleware.js';
import { AppError } from '../middlewares/errorMiddleware.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, studyGoals, dailyAvailableHours } = req.body;

    // Validation
    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('Email already registered', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      studyGoals: studyGoals || '',
      dailyAvailableHours: dailyAvailableHours || 4
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // User is already available in req.user from protect middleware
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, studyGoals, dailyAvailableHours, preferredBreakDuration, notificationsEnabled, theme } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update fields
    if (name) user.name = name;
    if (studyGoals !== undefined) user.studyGoals = studyGoals;
    if (dailyAvailableHours) user.dailyAvailableHours = dailyAvailableHours;
    if (preferredBreakDuration) user.preferredBreakDuration = preferredBreakDuration;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (theme) user.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};