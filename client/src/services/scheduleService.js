import api from './api';

export const scheduleService = {
  // Get all schedules
  getAll: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  // Get single schedule
  getById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  // Create schedule
  create: async (data) => {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  // Update schedule
  update: async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  },

  // Delete schedule
  delete: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },

  // Complete schedule
  complete: async (id, data) => {
    const response = await api.put(`/schedules/${id}/complete`, data);
    return response.data;
  },

  // Get today's schedule
  getToday: async () => {
    const response = await api.get('/schedules/today');
    return response.data;
  },

  // Get week's schedule
  getWeek: async () => {
    const response = await api.get('/schedules/week');
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/schedules/stats');
    return response.data;
  },

  // Generate smart schedule
  generate: async (options = {}) => {
    const response = await api.post('/schedules/generate', options);
    return response.data;
  },

  // Reschedule missed sessions
  reschedule: async () => {
    const response = await api.post('/schedules/reschedule');
    return response.data;
  },

  // Balance schedule
  balance: async (days = 7) => {
    const response = await api.post('/schedules/balance', { days });
    return response.data;
  },
};