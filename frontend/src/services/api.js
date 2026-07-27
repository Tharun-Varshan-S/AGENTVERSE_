import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL
});

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

export const listComplaints = async (statusFilter = null) => {
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await api.get('/api/complaints', { params });
  return response.data;
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
