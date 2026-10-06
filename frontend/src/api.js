import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('minjuventud_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('minjuventud_token');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (password) => api.post('/api/auth/login', { password }),
};

export const statsApi = {
  getStats: () => api.get('/api/stats'),
};

export const funcionariosApi = {
  getFuncionarios: (params) => api.get('/api/funcionarios', { params }),
  getFilterOptions: () => api.get('/api/funcionarios/filters'),
  getById: (id) => api.get(`/api/funcionarios/${id}`),
  create: (data) => api.post('/api/funcionarios', data),
  update: (id, data) => api.put(`/api/funcionarios/${id}`, data),
  delete: (id) => api.delete(`/api/funcionarios/${id}`),
};

export const uploadApi = {
  uploadExcel: (formData) => api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const consultaApi = {
  consultarCedula: (cedula) => api.post('/api/consulta', { cedula }),
  actualizarDatosElectorales: (id, data) => api.put(`/api/consulta/${id}`, data),
};

export default api;
