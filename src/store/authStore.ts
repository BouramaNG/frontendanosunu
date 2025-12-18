import { create } from 'zustand';
import type { User } from '../types';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pinReminderVisible: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  hydrateSession: (payload: { user: User; token: string; recordLoginAt?: boolean }) => void;
  initializePinReminder: () => void;
  remindPinLater: () => void;
  cancelPinReminder: () => void;
}

interface RegisterData {
  username: string;
  password: string;
  password_confirmation: string;
  gender: 'male' | 'female';
}

// Auto-logout after 4 hours (in ms)
const AUTO_LOGOUT_MS = 4 * 60 * 60 * 1000;
const KEYCHAIN_REMINDER_DELAY_MS = 60 * 1000;
const KEYCHAIN_REMINDER_STORAGE_KEY = 'keychain_pin_reminder_at';

// Timer reference kept in module scope
let autoLogoutTimer: number | null = null;
let keychainReminderTimer: number | null = null;

function clearAutoLogoutTimer() {
  if (autoLogoutTimer !== null) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
  }
}

function clearKeychainReminderTimer() {
  if (keychainReminderTimer !== null) {
    clearTimeout(keychainReminderTimer);
    keychainReminderTimer = null;
  }
}

function pickRandomCountry(): string {
  const COUNTRIES = [
    'France','Belgique','Suisse','Canada','Brésil','Japon','Maroc','Algérie','Tunisie','Sénégal','Côte d’Ivoire','Mali','Burkina Faso','Niger','Cameroun','Congo','Rwanda','Kenya','Tanzanie','Ouganda','Afrique du Sud','Allemagne','Italie','Espagne','Portugal','Argentine','Chili','Mexique','États-Unis','Inde','Indonésie','Philippines','Australie'
  ];
  const idx = Math.floor(Math.random() * COUNTRIES.length);
  return COUNTRIES[idx];
}

function scheduleAutoLogoutOrLogoutNow(get: () => AuthState, set: (partial: Partial<AuthState>) => void) {
  clearAutoLogoutTimer();
  const loginAtStr = localStorage.getItem('auth_login_at');
  const loginAt = loginAtStr ? parseInt(loginAtStr, 10) : NaN;
  const now = Date.now();
  if (!Number.isFinite(loginAt)) {
    // If no timestamp (e.g., user logged in before feature), initialize now and schedule full window
    localStorage.setItem('auth_login_at', String(now));
    autoLogoutTimer = window.setTimeout(() => {
      void get().logout();
    }, AUTO_LOGOUT_MS);
    return;
  }
  const elapsed = now - loginAt;
  const remaining = AUTO_LOGOUT_MS - elapsed;
  if (remaining <= 0) {
    void get().logout();
    return;
  }
  autoLogoutTimer = window.setTimeout(() => {
    void get().logout();
  }, remaining);
}

function cancelKeychainReminder(get: () => AuthState, set: (partial: Partial<AuthState>) => void) {
  clearKeychainReminderTimer();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(KEYCHAIN_REMINDER_STORAGE_KEY);
    } catch (_) {}
  }
  set({ pinReminderVisible: false });
}

function scheduleKeychainReminder(
  get: () => AuthState,
  set: (partial: Partial<AuthState>) => void,
  delayMs: number
) {
  if (typeof window === 'undefined') return;
  clearKeychainReminderTimer();
  const clampedDelay = Math.max(delayMs, 1000);
  const target = Date.now() + clampedDelay;
  try {
    localStorage.setItem(KEYCHAIN_REMINDER_STORAGE_KEY, String(target));
  } catch (_) {}
  keychainReminderTimer = window.setTimeout(() => {
    const state = get();
    if (state.user?.has_keychain_pin) {
      cancelKeychainReminder(get, set);
      return;
    }
    set({ pinReminderVisible: true });
  }, clampedDelay);
}

function restoreKeychainReminder(get: () => AuthState, set: (partial: Partial<AuthState>) => void) {
  if (typeof window === 'undefined') return;
  const state = get();
  if (state.user?.has_keychain_pin) {
    cancelKeychainReminder(get, set);
    return;
  }

  let target: number | null = null;
  try {
    const stored = localStorage.getItem(KEYCHAIN_REMINDER_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed)) {
        target = parsed;
      }
    }
  } catch (_) {}

  if (!target) {
    scheduleKeychainReminder(get, set, KEYCHAIN_REMINDER_DELAY_MS);
    return;
  }

  const remaining = target - Date.now();
  if (remaining <= 0) {
    set({ pinReminderVisible: true });
  } else {
    scheduleKeychainReminder(get, set, remaining);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pinReminderVisible: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      get().hydrateSession({ user: data.user, token: data.token, recordLoginAt: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          password_confirmation: data.password_confirmation,
          gender: data.gender,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'inscription');
      }

      set({ isLoading: false });
      return result; // Return user data for redirect
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
  const base = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
  await fetch(`${base}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearAutoLogoutTimer();
    cancelKeychainReminder(get, set);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_login_at');
    try {
      sessionStorage.removeItem('anon_country');
    } catch (_) {}
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Check React Query cache first for user data (optimization to eliminate duplicate requests)
      const cachedUser = queryClient.getQueryData(['user']);
      if (cachedUser) {
        set({ user: cachedUser as User, isAuthenticated: true, isLoading: false });
        scheduleAutoLogoutOrLogoutNow(get, set);
        if ((cachedUser as User)?.has_keychain_pin) {
          cancelKeychainReminder(get, set);
        } else {
          restoreKeychainReminder(get, set);
        }
        return;
      }

      let response;
      try {
        response = await api.get('/user');
      } catch (err: any) {
        // retry once after a short delay to avoid race/transient issues on refresh
        await new Promise((r) => setTimeout(r, 400));
        response = await api.get('/user');
      }
      set({ user: response.data, isAuthenticated: true, isLoading: false });
      // When restoring session, ensure auto-logout timer is set correctly
      scheduleAutoLogoutOrLogoutNow(get, set);
      if (response.data?.has_keychain_pin) {
        cancelKeychainReminder(get, set);
      } else {
        restoreKeychainReminder(get, set);
      }
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status;
      if (status === 401) {
        // Invalid token -> clear auth
        localStorage.removeItem('auth_token');
        cancelKeychainReminder(get, set);
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network/transient error: if token exists, assume still authenticated to avoid redirect on refresh
        const hasToken = Boolean(localStorage.getItem('auth_token'));
        if (hasToken) {
          console.warn('fetchUser transient error, keeping session:', error);
          set({ isLoading: false, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }
  },

  hydrateSession: ({ user, token, recordLoginAt = true }) => {
    try {
      localStorage.setItem('auth_token', token);
      if (recordLoginAt) {
        localStorage.setItem('auth_login_at', String(Date.now()));
      }
    } catch (_) {}

    try {
      sessionStorage.setItem('anon_country', pickRandomCountry());
    } catch (_) {}

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      pinReminderVisible: false,
    });

    scheduleAutoLogoutOrLogoutNow(get, set);

    if (user?.has_keychain_pin) {
      cancelKeychainReminder(get, set);
    } else {
      scheduleKeychainReminder(get, set, KEYCHAIN_REMINDER_DELAY_MS);
    }
  },

  initializePinReminder: () => {
    restoreKeychainReminder(get, set);
  },

  remindPinLater: () => {
    set({ pinReminderVisible: false });
    scheduleKeychainReminder(get, set, KEYCHAIN_REMINDER_DELAY_MS);
  },

  cancelPinReminder: () => {
    cancelKeychainReminder(get, set);
  },
}));
