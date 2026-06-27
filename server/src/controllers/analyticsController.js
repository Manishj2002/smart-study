import {
  getDashboardAnalytics,
  getWeeklyReport,
  getMonthlyTrends,
  getFocusInsights
} from '../services/analyticsService.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const analytics = await getDashboardAnalytics(req.user._id);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly report
// @route   GET /api/analytics/weekly
// @access  Private
export const getWeekly = async (req, res, next) => {
  try {
    const report = await getWeeklyReport(req.user._id);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends
// @route   GET /api/analytics/monthly
// @access  Private
export const getMonthly = async (req, res, next) => {
  try {
    const trends = await getMonthlyTrends(req.user._id);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get focus insights
// @route   GET /api/analytics/focus
// @access  Private
export const getFocus = async (req, res, next) => {
  try {
    const insights = await getFocusInsights(req.user._id);

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};