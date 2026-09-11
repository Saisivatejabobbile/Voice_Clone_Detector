// API Service Layer for VoiceShield Backend Integration
// This service handles all HTTP requests to the backend

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname || 'localhost'}:8000` : 'http://localhost:8000');
const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// Helper function to get auth token
const getAuthToken = () => {
  return (
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('voiceshield_access_token') ||
    localStorage.getItem('voiceshield_access_token') ||
    ''
  );
};

// Helper function to create headers
const createHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API call handler
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...createHeaders(options.auth !== false),
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      const error = isJson ? await response.json() : { message: response.statusText };
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return isJson ? await response.json() : null;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  // Register new user
  register: async (email, password, fullName) => {
    if (IS_MOCK_MODE) {
      // Mock registration
      return {
        id: `user-${Date.now()}`,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      };
    }

    return apiCall('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
  },

  // Login user
  login: async (email, password) => {
    if (IS_MOCK_MODE) {
      // Mock login - accept any credentials
      const mockUser = {
        id: 'mock-user-123',
        email,
        full_name: email.split('@')[0],
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      return {
        access_token: mockToken,
        token_type: 'bearer',
        user: mockUser,
      };
    }

    return apiCall('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout user
  logout: async () => {
    if (IS_MOCK_MODE) {
      return { message: 'Logged out successfully' };
    }

    return apiCall('/api/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user
  getCurrentUser: async () => {
    if (IS_MOCK_MODE) {
      const email = 'user@example.com';
      return {
        id: 'mock-user-123',
        email,
        full_name: email.split('@')[0],
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      };
    }

    return apiCall('/api/auth/me');
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const usersAPI = {
  // Get online users
  getOnlineUsers: async () => {
    if (IS_MOCK_MODE) {
      return {
        users: [
          {
            id: 'user-1',
            email: 'alice@example.com',
            full_name: 'Alice Johnson',
            status: 'online',
            last_seen: new Date().toISOString(),
          },
          {
            id: 'user-2',
            email: 'bob@example.com',
            full_name: 'Bob Smith',
            status: 'online',
            last_seen: new Date().toISOString(),
          },
        ],
      };
    }

    return apiCall('/api/users/online');
  },

  // Get user by ID
  getUserById: async (userId) => {
    if (IS_MOCK_MODE) {
      return {
        id: userId,
        email: 'user@example.com',
        full_name: 'Mock User',
        status: 'online',
        last_seen: new Date().toISOString(),
      };
    }

    return apiCall(`/api/users/${userId}`);
  },
};

// ============================================================================
// CONTACTS API
// ============================================================================

export const contactsAPI = {
  // Get all contacts
  getContacts: async () => {
    if (IS_MOCK_MODE) {
      return {
        contacts: [
          {
            id: '1',
            email: 'alice@example.com',
            full_name: 'Alice Johnson',
            status: 'online',
            last_seen: new Date().toISOString(),
          },
          {
            id: '2',
            email: 'bob@example.com',
            full_name: 'Bob Smith',
            status: 'online',
            last_seen: new Date().toISOString(),
          },
          {
            id: '3',
            email: 'charlie@example.com',
            full_name: 'Charlie Brown',
            status: 'offline',
            last_seen: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      };
    }

    return apiCall('/api/users/contacts');
  },

  // Add contact
  addContact: async (name, email) => {
    if (IS_MOCK_MODE) {
      return {
        id: Date.now().toString(),
        contact_name: name,
        contact_email: email,
        is_registered: false,
        is_online: false,
        created_at: new Date().toISOString(),
      };
    }

    return apiCall('/api/users/contacts', {
      method: 'POST',
      body: JSON.stringify({ 
        contact_name: name, 
        contact_email: email 
      }),
    });
  },

  // Remove contact
  removeContact: async (contactId) => {
    if (IS_MOCK_MODE) {
      return { message: 'Contact removed' };
    }

    return apiCall(`/api/users/contacts/${contactId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// CALLS API
// ============================================================================

export const callsAPI = {
  // Get call history
  getCallHistory: async (limit = 50, offset = 0) => {
    if (IS_MOCK_MODE) {
      return {
        calls: [
          {
            id: 'call-1',
            caller_id: 'user-1',
            receiver_id: 'mock-user-123',
            contact_name: 'Alice Johnson',
            contact_email: 'alice@example.com',
            started_at: new Date(Date.now() - 7200000).toISOString(),
            ended_at: new Date(Date.now() - 6300000).toISOString(),
            duration_seconds: 900,
            status: 'completed',
            risk_level: 'LOW',
            risk_score: 8,
            synthetic_confidence: 5,
            model_confidence: 95,
            recommendation: 'This voice appears to be human.',
          },
        ],
        total: 1,
        limit,
        offset,
      };
    }

    return apiCall(`/api/calls/history?limit=${limit}&offset=${offset}`);
  },

  // Get call session by ID
  getCallSession: async (callId) => {
    if (IS_MOCK_MODE) {
      return {
        id: callId,
        caller_id: 'user-1',
        receiver_id: 'mock-user-123',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_seconds: null,
        status: 'connected',
      };
    }

    return apiCall(`/api/calls/${callId}`);
  },
  // Save call history
  saveCallHistory: async (callData) => {
    if (IS_MOCK_MODE) {
      console.log('[MOCK] Saving call history:', callData);
      return {
        message: 'Call history saved',
        call_id: callData.call_id,
        duration_seconds: callData.duration_seconds
      };
    }

    return apiCall('/api/calls/history', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  },

  // Analyze uploaded WAV audio file
  analyzeAudioFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/calls/analyze-audio-file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Audio analysis failed' }));
      throw new Error(errorData.detail || `Analysis failed with HTTP ${response.status}`);
    }

    return await response.json();
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  check: async () => {
    if (IS_MOCK_MODE) {
      return {
        status: 'healthy',
        mode: 'mock',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };
    }

    return apiCall('/api/health', { auth: false });
  },
};


// ============================================================================
// SETTINGS API
// ============================================================================

export const settingsAPI = {
  // Update profile
  updateProfile: async (full_name, phone) => {
    if (IS_MOCK_MODE) {
      return {
        id: 'mock-user-123',
        email: 'user@example.com',
        full_name,
        phone,
        updated_at: new Date().toISOString(),
      };
    }

    const body = {};
    if (full_name) body.full_name = full_name;
    if (phone) body.phone = phone;

    return apiCall('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    if (IS_MOCK_MODE) {
      return { message: 'Password changed successfully' };
    }

    return apiCall('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },
};

// ============================================================================
// SESSIONS API
// ============================================================================

export const sessionsAPI = {
  // Get all active sessions
  getActiveSessions: async () => {
    if (IS_MOCK_MODE) {
      return [
        {
          session_id: 'current-session',
          device_info: 'Chrome on Windows',
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_current: true
        },
        {
          session_id: 'other-session-1',
          device_info: 'Firefox on Linux',
          ip_address: '192.168.1.50',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_activity: new Date(Date.now() - 7200000).toISOString(),
          is_current: false
        }
      ];
    }

    return apiCall('/api/sessions');
  },

  // Logout specific session
  logoutSession: async (sessionId) => {
    if (IS_MOCK_MODE) {
      return { message: 'Session logged out' };
    }

    return apiCall(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Logout from all devices
  logoutAllDevices: async () => {
    if (IS_MOCK_MODE) {
      return {
        message: 'Logged out from 2 device(s)',
        sessions_terminated: 2
      };
    }

    return apiCall('/api/sessions/logout-all', {
      method: 'POST',
    });
  },
};
// ============================================================================
// EXPORT ALL APIs
// ============================================================================

export default {
  auth: authAPI,
  users: usersAPI,
  contacts: contactsAPI,
  calls: callsAPI,
  health: healthAPI,
  settings: settingsAPI,
  sessions: sessionsAPI,
};


