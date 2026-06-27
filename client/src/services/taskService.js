import api from './api';

export const taskService = {
  // Get all tasks
  getAll: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get single task
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Complete task
  complete: async (id, actualTime) => {
    const response = await api.put(`/tasks/${id}/complete`, { actualTime });
    return response.data;
  },

  // Get overdue tasks
  getOverdue: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  // Get upcoming tasks
  getUpcoming: async (days = 7) => {
    const response = await api.get('/tasks/upcoming', { params: { days } });
    return response.data;
  },

  // Get tasks by subject
  getBySubject: async (subjectId) => {
    const response = await api.get(`/tasks/subject/${subjectId}`);
    return response.data;
  },

  // Get task statistics
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },
};