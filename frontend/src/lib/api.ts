import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request/response interceptors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('forceLoggedOut', 'true'); // <-- ADD THIS LINE
          const store = require('@/store/auth.store');
          if (store.useAuthStore) {
            store.useAuthStore.getState().logout(); // Clear auth state
          }
        } catch (err) {
          // Safe catch: don't block redirect if import fails
        }
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;