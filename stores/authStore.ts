import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  age: number;
  reputation?: number;
  createdAt?: Date;
  isAdmin?: boolean;
  isBlocked?: boolean;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string, age: number) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isCurrentUserAdmin: () => boolean;
}

// Admin ID - this would be set from your backend
const ADMIN_ID = 'admin-zer23ko-a11y';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  register: async (email: string, password: string, age: number) => {
    set({ isLoading: true, error: null });
    try {
      // Validate age - must be 17 or older
      if (age < 17) {
        throw new Error('You must be at least 17 years old to register');
      }

      // TODO: Call backend API
      // const response = await apiClient.post('/api/auth/register', { email, password, age });
      // const user = response.data.data;

      // For now, create user locally
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        age,
        reputation: 0,
        createdAt: new Date(),
        isAdmin: email === 'admin@kerlab.com', // Example admin email
        isBlocked: false,
      };

      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Call backend API
      // const response = await apiClient.post('/api/auth/login', { email, password });
      // const user = response.data.data;

      // For now, create user locally
      const user: User = {
        id: email === 'admin@kerlab.com' ? ADMIN_ID : Math.random().toString(36).substr(2, 9),
        email,
        age: 18,
        reputation: 0,
        createdAt: new Date(),
        isAdmin: email === 'admin@kerlab.com', // Example admin email
        isBlocked: false,
      };

      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    set({ user: null, error: null });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  isCurrentUserAdmin: () => {
    const state = get();
    return state.user?.isAdmin || false;
  },
}));
