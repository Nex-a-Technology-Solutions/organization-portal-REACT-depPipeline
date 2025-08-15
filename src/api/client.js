// api/client.js
import axios from 'axios';

// Configure your Django API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://organization-portal-deppipeline.onrender.com/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          setTokens(access, refreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Base entity class with CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async getAll(params = {}) {
    const response = await apiClient.get(this.endpoint, { params });
    return response.data;
  }

  async getById(id) {
    const response = await apiClient.get(`${this.endpoint}${id}/`);
    return response.data;
  }

  // Alias for getById to maintain compatibility
  async get(id) {
    return this.getById(id);
  }

  async patch(id, data) {
    return this.partialUpdate(id, data);
  }

  // List method with ordering support (used by frontend)
  async list(ordering = null, limit = null) {
    const params = {};
    if (ordering) params.ordering = ordering;
    if (limit) params.limit = limit;
    
    const response = await apiClient.get(this.endpoint, { params });
    return response.data.results || response.data;
  }

  // Filter method to maintain compatibility with existing code
  async filter(filterParams, limit) {
    const params = { ...filterParams };
    if (limit) params.limit = limit;
    
    const response = await apiClient.get(this.endpoint, { params });
    return response.data.results || response.data;
  }

  async create(data) {
    const response = await apiClient.post(this.endpoint, data);
    return response.data;
  }

  async update(id, data) {
    const response = await apiClient.put(`${this.endpoint}${id}/`, data);
    return response.data;
  }

  async partialUpdate(id, data) {
    const response = await apiClient.patch(`${this.endpoint}${id}/`, data);
    return response.data;
  }

  async delete(id) {
    const response = await apiClient.delete(`${this.endpoint}${id}/`);
    return response.data;
  }
}

// Auth utilities
export const auth = {
  async register(userData) {
    try {
      // Changed from '/auth/register/' to '/auth/register/'
      const response = await apiClient.post('/auth/register/', userData);
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async login(credentials) {
    try {
      // This should now work since your Django has /api/auth/ and apiClient baseURL includes /api
      const response = await apiClient.post('/auth/login/', credentials);
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async logout() {
    clearTokens();
    // If you have a logout endpoint in Django:
    // await apiClient.post('/auth/logout/');
  },

  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Token refresh endpoint
  async refreshToken() {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      setTokens(access, refreshToken);
      return response.data;
    } catch (error) {
      clearTokens();
      throw error.response?.data || error;
    }
  },

  // Rest of your auth methods...
  async me() {
    return this.getProfile();
  },

  async getCurrentUser() {
    return this.getProfile();
  },

  async update(profileData) {
    return this.updateProfile(profileData);
  },

  async updateMyUserData(profileData) {
    return this.updateProfile(profileData);
  },

  async list() {
    try {
      const response = await apiClient.get('/auth/users/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getAll() {
    return this.list();
  },

  loginWithRedirect(redirectUrl) {
    window.location.href = '/login';
  },

  async updateProfile(profileData) {
    try {
      // Remove problematic fields
      const { username, role, access_level, is_active, ...dataToSend } = profileData;
      
      console.log('Sending profile update data:', dataToSend); // Debug log
      
      const response = await apiClient.put('/auth/profile/update/', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // In your auth object in client.js, add this method:
  async updateUser(userId, userData) {
    try {
      const response = await apiClient.patch(`/auth/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await apiClient.post('/auth/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  isAuthenticated() {
    return !!getAccessToken();
  },

  getToken() {
    return getAccessToken();
  }
};

// Entity instances matching your base44 structure
export const entities = {
  Project: new BaseEntity('/projects/'),
  Task: new BaseEntity('/tasks/'),
  TimeEntry: new BaseEntity('/time-entries/'),
  Proposal: new BaseEntity('/proposals/'),
  Invoice: new BaseEntity('/invoices/'),
  Expense: new BaseEntity('/expenses/'),
  Client: new BaseEntity('/clients/'),
  ProjectRequest: new BaseEntity('/project-requests/'),
  
  // Additional entity methods can be added here
  // For example, if you need custom endpoints:
  async getDashboardStats() {
    const response = await apiClient.get('/dashboard/stats/');
    return response.data;
  }
};

// Create the main client object that matches your base44 structure
export const djangoClient = {
  auth,
  entities,
  
  // Additional utility methods
  setBaseURL(url) {
    apiClient.defaults.baseURL = url;
  },
  
  getClient() {
    return apiClient;
  }
};

// Export individual entities to match your original structure
export const Project = entities.Project;
export const Task = entities.Task;
export const TimeEntry = entities.TimeEntry;
export const Proposal = entities.Proposal;
export const Invoice = entities.Invoice;
export const Expense = entities.Expense;
export const Client = entities.Client;
export const ProjectRequest = entities.ProjectRequest;

// For Settings and other entities that might not have ViewSets yet
export const Settings = {
  async list() {
    try {
      const response = await apiClient.get('/settings/');
      return response.data; // This will be an array from your backend
    } catch (error) {
      console.error('Settings list error:', error);
      throw error.response?.data || error;
    }
  },

  async get() {
    try {
      const response = await apiClient.get('/settings/');
      return response.data[0]; // Return first item since backend returns array
    } catch (error) {
      console.error('Settings get error:', error);
      throw error.response?.data || error;
    }
  },

  async create(data) {
    try {
      const response = await apiClient.put('/settings/', data);
      return response.data;
    } catch (error) {
      console.error('Settings create error:', error);
      throw error.response?.data || error;
    }
  },

  async update(id, data) {
    try {
      // For settings, we always use PUT since there's typically only one settings record
      const response = await apiClient.put('/settings/', data);
      return response.data;
    } catch (error) {
      console.error('Settings update error:', error);
      throw error.response?.data || error;
    }
  },

  async patch(id, data) {
    try {
      const response = await apiClient.patch('/settings/', data);
      return response.data;
    } catch (error) {
      console.error('Settings patch error:', error);
      throw error.response?.data || error;
    }
  }
};

export const Notification = {
  async getAll(params = {}) {
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },
  async markAsRead(id) {
    const response = await apiClient.patch(`/notifications/${id}/`, { is_read: true });
    return response.data;
  },
  // Add list method for compatibility
  async list(ordering = null, limit = null) {
    const params = {};
    if (ordering) params.ordering = ordering;
    if (limit) params.limit = limit;
    
    const response = await apiClient.get('/notifications/', { params });
    return response.data.results || response.data;
  }
};

export const UserInvitation = {
  async getAll(params = {}) {
    const response = await apiClient.get('/user-invitations/', { params });
    return response.data;
  },
  // Alias method to maintain compatibility with existing code
  async filter(filterParams, limit) {
    const response = await apiClient.get('/user-invitations/', { 
      params: { ...filterParams, limit } 
    });
    return response.data.results || response.data;
  },
  async send(data) {
    const response = await apiClient.post('/user-invitations/', data);
    return response.data;
  },
  async update(id, data) {
    const response = await apiClient.patch(`/user-invitations/${id}/`, data);
    return response.data;
  },
  async accept(token) {
    const response = await apiClient.post(`/user-invitations/accept/${token}/`);
    return response.data;
  },
  // Add list method for compatibility
  async list(ordering = null, limit = null) {
    const params = {};
    if (ordering) params.ordering = ordering;
    if (limit) params.limit = limit;
    
    const response = await apiClient.get('/user-invitations/', { params });
    return response.data.results || response.data;
  }
};

// Add this to your API client file (wherever UserInvitation is defined)
export const PublicInvitation = {
  async validate(email) {
    try {
      const response = await apiClient.get('/validate-invitation/', {
        params: { email }
      });
      return response.data;
    } catch (error) {
      // axios errors structure
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Failed to validate invitation');
      }
      throw new Error('Failed to validate invitation');
    }
  },

  async updateStatus(email, status) {
    try {
      const response = await apiClient.patch('/update-invitation-status/', {
        email,
        status,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.error || 'Failed to update invitation status');
      }
      throw new Error('Failed to update invitation status');
    }
  }
};

// Export auth as User to match your original structure
export const User = auth;

export default djangoClient;