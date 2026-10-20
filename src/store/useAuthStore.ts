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
      localStorage.setItem('fc_user_session', JSON.stringify(data.user));
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        error: null,
      });

      return { success: true, role: data.user.role };
    } catch (err: any) {
      console.warn('Backend unavailable, checking demo credentials fallback:', err);
      // Public deployment offline demo fallback
      const lower = email.toLowerCase().trim();
      let fallbackUser: User | null = null;
      if (lower.includes('admin') || lower === 'admin@foodcovering.gov') {
        fallbackUser = {
          id: 'admin-01',
          email: 'admin@foodcovering.gov',
          username: 'admin',
          fullName: 'Dr. Praveen (Administrator)',
          phone: '+91 82488 32986',
          role: 'HEAD_OFFICE_ADMIN',
          isActive: true
        };
      } else if (lower.includes('supermarket') || lower.includes('store') || lower.includes('freshmart') || lower.includes('sm')) {
        fallbackUser = {
          id: 'spm-01',
          email: 'official@freshmart.com',
          username: 'supermarket_lead',
          fullName: 'Rajesh Mehta (Store Lead)',
          phone: '+91 98222 33445',
          role: 'SUPERMARKET_OFFICIAL',
          supermarketId: 'sm-001',
          supermarket: { id: 'sm-001', name: 'FreshMart Supermarkets', code: 'FM-01' },
          isActive: true
        };
      } else {
        fallbackUser = {
          id: 'usr-01',
          email: email.includes('@') ? email : `${email}@foodcovering.org`,
          username: email.split('@')[0],
          fullName: 'Praveen Kumar (Citizen / Donor)',
          phone: '+91 82488 32986',
          role: 'NORMAL_USER',
          creditPoints: 525,
          tier: 'Silver',
          isActive: true
        };
      }

      const demoToken = 'demo-public-token-2026';
      localStorage.setItem('fc_auth_token', demoToken);
      localStorage.setItem('fc_user_session', JSON.stringify(fallbackUser));
      set({
        token: demoToken,
        user: fallbackUser,
        isAuthenticated: true,
        error: null
      });
      return { success: true, role: fallbackUser.role };
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
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('fc_auth_token', data.token);
      localStorage.setItem('fc_user_session', JSON.stringify(data.user));
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        error: null,
      });

      return { success: true };
    } catch {
      // Offline fallback: create user session locally
      const newUser: User = {
        id: 'usr-' + Date.now().toString(36),
        email: registerData.email,
        username: registerData.email.split('@')[0],
        fullName: registerData.fullName,
        phone: registerData.phone,
        address: registerData.address || 'New Delhi, India',
        role: 'NORMAL_USER',
        creditPoints: 100,
        tier: 'Bronze',
        isActive: true
      };

      const demoToken = 'demo-public-token-2026';
      localStorage.setItem('fc_auth_token', demoToken);
      localStorage.setItem('fc_user_session', JSON.stringify(newUser));
      set({
        token: demoToken,
        user: newUser,
        isAuthenticated: true,
        error: null
      });
      return { success: true };
    }
  },

  logout: () => {
    const token = get().token;
    if (token && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('fc_auth_token');
    localStorage.removeItem('fc_user_session');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('fc_auth_token');
    const savedUser = localStorage.getItem('fc_user_session');

    if (!token && !savedUser) {
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      return;
    }

    // If we have saved user from offline session, restore immediately
    let initialUser: User | null = null;
    if (savedUser) {
      try {
        initialUser = JSON.parse(savedUser);
      } catch {}
    }

    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // On static deployment (GitHub Pages), maintain restored user
      if (initialUser) {
        set({
          user: initialUser,
          token: token || 'demo-public-token-2026',
          isAuthenticated: true,
          isInitializing: false
        });
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2000)
      });

      if (!res.ok) {
        if (initialUser) {
          set({ user: initialUser, token: token || 'demo-public-token-2026', isAuthenticated: true, isInitializing: false });
          return;
        }
        localStorage.removeItem('fc_auth_token');
        localStorage.removeItem('fc_user_session');
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
        return;
      }

      const data = await res.json();
      localStorage.setItem('fc_user_session', JSON.stringify(data.user));
      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isInitializing: false,
      });
    } catch {
      if (initialUser) {
        set({
          user: initialUser,
          token: token || 'demo-public-token-2026',
          isAuthenticated: true,
          isInitializing: false
        });
      } else {
        set({ isInitializing: false });
      }
    }
  },

  updateUser: (partialUser) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partialUser };
      localStorage.setItem('fc_user_session', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
