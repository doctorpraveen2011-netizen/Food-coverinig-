import { create } from 'zustand';

export type UserRole = 'NORMAL_USER' | 'SUPERMARKET_OFFICIAL' | 'HEAD_OFFICE_ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address?: string;
  role: UserRole;
  supermarketId?: string;
  branchId?: string;
  supermarket?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  isActive: boolean;
  avatar?: string;
  creditPoints?: number;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tierBadge?: string;
  progressToNextTier?: number;
  nextTierPoints?: number;
  pointsToNextTier?: number;
  sustainabilityStats?: {
    totalPoints: number;
    donationsCount: number;
    co2SavedKg: number;
    foodSavedKg: number;
    waterSavedLiters: number;
    mealsProvided: number;
    scansCount: number;
  };
  history?: Array<{
    id: string;
    action: string;
    points: number;
    date: string;
    icon: string;
  }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (partialUser: Partial<User>) => void;
}

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('fc_auth_token'),
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  login: async (email, password) => {
    try {
      set({ error: null });
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Login failed' });
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('fc_auth_token', data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        error: null,
      });

      return { success: true, role: data.user.role };
    } catch (err: any) {
      const msg = err.message || 'Network error connecting to backend service';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  register: async (registerData) => {
    try {
      set({ error: null });
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Registration failed' });
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('fc_auth_token', data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Network error during registration';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    const token = get().token;
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('fc_auth_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('fc_auth_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('fc_auth_token');
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
        return;
      }

      const data = await res.json();
      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isInitializing: false,
      });
    } catch {
      set({ isInitializing: false });
    }
  },

  updateUser: (partialUser) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partialUser } });
    }
  },
}));
