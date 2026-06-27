import api from './api';

export const subjectService = {
  // Get all subjects
  getAll: async (params = {}) => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  // Get single subject
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  // Create subject
  create: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data;
  },

  // Update subject
  update: async (id, data) => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  // Get subject stats
  getStats: async (id) => {
    const response = await api.get(`/subjects/${id}/stats`);
    return response.data;
  },

  // Update study hours
  updateStudyHours: async (id, hours) => {
    const response = await api.put(`/subjects/${id}/study-hours`, { hours });
    return response.data;
  },
};