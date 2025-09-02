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
  },

  async googleLogin(authorizationCode) {
    try {
    console.log('Sending authorization code to backend:', authorizationCode);
    
    // CORRECT: Send 'code' to match backend expectation
    const response = await apiClient.post('/auth/google/', { 
      code: authorizationCode,
      grant_type: 'authorization_code',
      redirect_uri: window.location.origin + '/auth/google/callback' 
    });
      
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async microsoftLogin(token) {
    try {
      const response = await apiClient.post('/auth/microsoft/', { token });
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      console.error('Microsoft login error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async appleLogin(identityToken, fullName = null) {
    try {
      const response = await apiClient.post('/auth/apple/', { 
        identity_token: identityToken,
        full_name: fullName 
      });
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      console.error('Apple login error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async sendPhoneOTP(phoneNumber) {
    try {
      const response = await apiClient.post('/auth/phone/send-otp/', { 
        phone_number: phoneNumber 
      });
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async verifyPhoneOTP(phoneNumber, otp) {
    try {
      const response = await apiClient.post('/auth/phone/verify/', { 
        phone_number: phoneNumber,
        otp: otp
      });
      const { access, refresh } = response.data;
      setTokens(access, refresh);
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data);
      throw error.response?.data || error;
    }
  },
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

// Updated Notification object for client.js
export const Notification = {
  async getAll(params = {}) {
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },

  async markAsRead(id) {
    const response = await apiClient.patch(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  async markAllRead() {
    const response = await apiClient.patch('/notifications/mark_all_read/');
    return response.data;
  },

  async clearAll() {
    const response = await apiClient.delete('/notifications/clear_all/');
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread_count/');
    return response.data;
  },

  async getSummary() {
    const response = await apiClient.get('/notifications/summary/');
    return response.data;
  },

  // Updated list method that properly handles ordering and filters
  async list(ordering = null, limit = null, filters = {}) {
    const params = { ...filters };
    if (ordering) {
      // Convert ordering format (remove leading dash, add to ordering param)
      const orderField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
      const orderDirection = ordering.startsWith('-') ? 'desc' : 'asc';
      params.ordering = ordering; // Django REST framework handles -field format
    }
    if (limit) params.limit = limit;
    
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },

  // Updated filter method to properly handle parameters
  async filter(filterParams = {}, ordering = null, limit = null) {
    const params = { ...filterParams };
    if (ordering) params.ordering = ordering;
    if (limit) params.limit = limit;
    
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },

  // Standard CRUD methods for consistency
  async create(data) {
    const response = await apiClient.post('/notifications/', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.patch(`/notifications/${id}/`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/notifications/${id}/`);
    return response.data;
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

// Add to your api/client.js or wherever you handle API calls
// Replace your existing PublicProposal in client.js with this debug version
export const PublicProposal = {
  async validate(proposalId, email) {
    try {
      console.log('Validating proposal:', { proposalId, email });
      
      const response = await axios.get(`${API_BASE_URL}/validate-proposal/?proposalId=${proposalId}&email=${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Proposal validation error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  async accept(proposalId, email) {
    try {
      console.log('=== DEBUGGING PROPOSAL ACCEPTANCE ===');
      console.log('Accepting proposal with data:', { proposalId, email });
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}/accept-proposal/`);
      
      const requestData = {
        proposalId: proposalId,
        email: email
      };
      
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      console.log('Request data:', requestData);
      console.log('Request config:', requestConfig);
      
      const response = await axios.patch(`${API_BASE_URL}/accept-proposal/`, requestData, requestConfig);
      
      console.log('✅ Accept response successful:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ PROPOSAL ACCEPTANCE FAILED');
      console.error('Error object:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response statusText:', error.response.statusText);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
        
        // Log the raw response for debugging
        console.error('Raw response:', {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          config: error.response.config
        });
        
        // Try to parse the error message
        let errorMessage = 'Unknown error occurred';
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        console.error('Parsed error message:', errorMessage);
        
        // Throw a more detailed error
        const detailedError = {
          message: errorMessage,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        throw detailedError;
        
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw { message: 'No response from server', type: 'network' };
      } else {
        console.error('Request setup error:', error.message);
        throw { message: error.message, type: 'setup' };
      }
    }
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