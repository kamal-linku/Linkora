// Users API endpoints
import { api } from './api';

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getUserById: (id) => api.get(`/users/${id}`),
};
