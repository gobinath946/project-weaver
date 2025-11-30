import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; companyName?: string }) => 
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Projects
export const projectsApi = {
  getAll: (params?: Record<string, string>) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addTeamMember: (id: string, userId: string, role?: string) => api.post(`/projects/${id}/team`, { userId, role }),
};

// Tasks
export const tasksApi = {
  getAll: (params?: Record<string, string>) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/tasks/${id}/status`, { status }),
};

// Bugs
export const bugsApi = {
  getAll: (params?: Record<string, string>) => api.get('/bugs', { params }),
  getById: (id: string) => api.get(`/bugs/${id}`),
  create: (data: Record<string, unknown>) => api.post('/bugs', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/bugs/${id}`, data),
  delete: (id: string) => api.delete(`/bugs/${id}`),
};

// Time Logs
export const timeLogsApi = {
  getAll: (params?: Record<string, string>) => api.get('/timelogs', { params }),
  create: (data: Record<string, unknown>) => api.post('/timelogs', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/timelogs/${id}`, data),
  delete: (id: string) => api.delete(`/timelogs/${id}`),
};

// Dashboard
export const dashboardApi = {
  getData: () => api.get('/dashboard'),
  getProjectSummary: () => api.get('/dashboard/project-summary'),
  getTaskSummary: () => api.get('/dashboard/task-summary'),
  getUpcomingDeadlines: () => api.get('/dashboard/upcoming-deadlines'),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
