import { create } from 'zustand';
import api from '@/lib/api';
import type { IUser } from '@zarmind/shared-types';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false, // Start with true to check for existing session on load
  error: null,

  login: async (emailOrUsername, password) => {
    set({ isLoading: true, error: null });
    try {
      // Determine if the identifier is an email or username
      const isEmail = emailOrUsername.includes('@');
      const payload = isEmail 
        ? { email: emailOrUsername, password } 
        : { username: emailOrUsername, password };

      const response = await api.post('/auth/login', payload);
      
      if (response.data && response.data.user) {
        set({ user: response.data.user, isLoading: false, error: null });
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errorMessage, user: null });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      // Always clear user state on the client-side
      set({ user: null, isLoading: false, error: null });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        set({ user: response.data, isLoading: false, error: null });
      }
    } catch (err) {
      // This is expected if the user is not logged in (e.g., 401 error)
      set({ user: null, isLoading: false, error: null });
    }
  },
}));