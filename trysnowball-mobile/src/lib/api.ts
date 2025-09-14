import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Use the same auth system as web app
const AUTH_BASE_URL = 'https://trysnowball.com/auth';
const API_BASE_URL = 'https://trysnowball.com'; // Main domain for API endpoints

// Token management - stores JWT from magic link auth
const SESSION_TOKEN_KEY = 'snowball:auth:session';

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Fallback to AsyncStorage if SecureStore unavailable
    return await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch {
    // Fallback to AsyncStorage if SecureStore unavailable
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  }
};

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      await removeToken();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints - matches web app auth flow
export const auth = {
  requestMagicLink: async (email: string) => {
    const response = await axios.post(`${AUTH_BASE_URL}/request-link`, { 
      email,
      returnUrl: 'trysnowball://auth/callback' // Deep link for mobile
    });
    return response.data;
  },
  
  verifyMagicLink: async (token: string) => {
    const response = await axios.post(`${AUTH_BASE_URL}/verify`, { token });
    
    if (response.data.jwt) {
      // Store the JWT session token
      await setToken(response.data.jwt);
    }
    
    return response.data;
  },
  
  getMe: async () => {
    const token = await getToken();
    if (!token) return null;
    
    const response = await axios.get(`${AUTH_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  logout: async () => {
    await removeToken();
    // Could also hit /auth/logout endpoint if needed
  },
};

// API client for data operations
export const apiClient = {
  // User data
  getUser: async () => {
    const response = await auth.getMe();
    return response?.user || null;
  },
  
  getEntitlement: async () => {
    const response = await api.get('/auth/entitlement');
    return response.data;
  },

  // Debt management - sync with cloud D1 database
  getDebts: async () => {
    // This would hit the same endpoint as web app
    // For now, return empty array until backend API is implemented
    console.log('[API] getDebts called - backend API not yet implemented');
    return [];
  },
  
  saveDebts: async (debts: any[]) => {
    // Bulk save all debts (matches web app pattern)
    console.log('[API] saveDebts called with', debts.length, 'debts');
    // Backend implementation would save to D1 per user
    return debts;
  },
  
  createDebt: async (debt: any) => {
    console.log('[API] createDebt called', debt);
    // Would POST to /api/debt endpoint
    return { ...debt, id: Date.now().toString() };
  },
  
  updateDebt: async (id: string, updates: any) => {
    console.log('[API] updateDebt called', id, updates);
    // Would PATCH /api/debt/:id endpoint  
    return { id, ...updates };
  },
  
  deleteDebt: async (id: string) => {
    console.log('[API] deleteDebt called', id);
    // Would DELETE /api/debt/:id endpoint
    return { success: true };
  },

  // Timeline calculation (server-side for consistency)
  getForecast: async (debts: any[]) => {
    console.log('[API] getForecast called');
    // Would calculate debt snowball timeline server-side
    // For now return mock data
    return {
      debtFreeDate: '2027-03-15',
      totalInterestSaved: 5420,
      monthlyProgress: [
        { month: 'Jan 2025', totalPaid: 2000, remaining: 18000 },
        { month: 'Feb 2025', totalPaid: 4000, remaining: 16000 },
        // ... more months
      ]
    };
  },

  // Settings sync
  getSettings: async () => {
    console.log('[API] getSettings called');
    return {
      theme: 'system',
      notifications: false,
    };
  },
  
  updateSettings: async (settings: any) => {
    console.log('[API] updateSettings called', settings);
    return settings;
  },
};

export default api;