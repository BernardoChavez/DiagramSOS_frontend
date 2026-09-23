import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api', // Usa URL de producción o localhost
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginCall = async (credentials) => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const registerCall = async (userData) => {
  return api.post('/auth/register', userData);
};

export const getProjects = async () => {
  return api.get('/projects/');
};

export const createProject = async (projectData) => {
  return api.post('/projects/', projectData);
};

export const deleteProject = async (id) => {
  return api.delete(`/projects/${id}`);
};

export const saveCanvas = async (id, canvasData) => {
  // Según nuestro backend, recibe dict en canvas_data pero se manda en el body JSON
  return api.put(`/projects/${id}/canvas`, canvasData);
};

export const exportXMICall = async (id) => {
  return api.get(`/projects/${id}/export/xmi`, { responseType: 'blob' });
};

export const importXMICall = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/projects/${id}/import/xmi`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importNewProjectFromXMICall = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/projects/import/xmi/new`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
