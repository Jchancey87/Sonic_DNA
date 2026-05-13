import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

export const songAPI = {
  import: (youtubeUrl) =>
    api.post('/songs/import', { youtubeUrl }),
  getAll: (filters = {}) =>
    api.get('/songs', { params: filters }),
  getById: (id) =>
    api.get(`/songs/${id}`),
  delete: (id) =>
    api.delete(`/songs/${id}`),
};

export const auditAPI = {
  generateTemplate: (songId, lenses, workflowType) =>
    api.post('/audits/generate-template', { songId, lenses, workflowType }),
  create: (songId, lensSelection, responses, bookmarks, techniques, workflowType) =>
    api.post('/audits', { songId, lensSelection, responses, bookmarks, techniques, workflowType }),
  getById: (id) =>
    api.get(`/audits/${id}`),
  getBySong: (songId) =>
    api.get(`/audits/song/${songId}`),
  getAll: () =>
    api.get('/audits'),
  update: (id, data) =>
    api.patch(`/audits/${id}`, data),
  delete: (id) =>
    api.delete(`/audits/${id}`),
};

export const techniqueAPI = {
  getAll: (filters = {}) =>
    api.get('/techniques', { params: filters }),
  getByCategory: (category) =>
    api.get(`/techniques/category/${category}`),
  add: (data) =>
    api.post('/techniques', data),
  update: (id, data) =>
    api.patch(`/techniques/${id}`, data),
  delete: (id) =>
    api.delete(`/techniques/${id}`),
};

export default api;
