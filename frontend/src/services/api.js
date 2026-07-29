import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const citizenToken = localStorage.getItem('civic_citizen_token');
  const adminToken = localStorage.getItem('civic_admin_token');
  const token = adminToken || citizenToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const citizenRegister = async (userData) => {
  const response = await api.post('/api/auth/citizen/register', userData);
  return response.data;
};

export const citizenLogin = async (email, password) => {
  const response = await api.post('/api/auth/citizen/login', { email, password });
  return response.data;
};

export const adminLogin = async (admin_id, password) => {
  const response = await api.post('/api/auth/admin/login', { admin_id, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const createComplaint = async (formData) => {
  const response = await api.post('/api/complaints', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getComplaint = async (incidentId) => {
  const response = await api.get(`/api/complaints/${incidentId}`);
  return response.data;
};

export const getComplaintEvents = async (incidentId) => {
  const response = await api.get(`/api/complaints/${incidentId}/events`);
  return response.data;
};

export const listComplaints = async (statusFilter = null, filters = {}) => {
  const params = {
    ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...filters
  };
  const response = await api.get('/api/complaints', { params });
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get('/api/admin/analytics');
  return response.data;
};

export const exportIncidentsCSV = () => {
  window.open(`${baseURL}/api/admin/export-csv`, '_blank');
};

export const advanceStatus = async (incidentId, newStatus) => {
  const response = await api.post(`/api/admin/complaints/${incidentId}/advance-status`, {
    new_status: newStatus
  });
  return response.data;
};

export const triggerEscalation = async (incidentId) => {
  const response = await api.post(`/api/admin/complaints/${incidentId}/trigger-escalation`);
  return response.data;
};

export default api;
