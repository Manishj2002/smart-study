import api from './api';

export const analyticsService = {
  // Get dashboard analytics
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  // Get weekly report
  getWeekly: async () => {
    const response = await api.get('/analytics/weekly');
    return response.data;
  },

  // Get monthly trends
  getMonthly: async () => {
    const response = await api.get('/analytics/monthly');
    return response.data;
  },

  // Get focus insights
  getFocus: async () => {
    const response = await api.get('/analytics/focus');
    return response.data;
  },
};