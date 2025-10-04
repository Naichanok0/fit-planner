import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: 'male' | 'female';
  fitnessLevel?: 'standard' | 'beginner' | 'intermediate' | 'advanced';
  goal?: 'weight-loss' | 'muscle-gain' | 'maintenance';
  joinDate?: Date;
  lastLogin?: Date;
  profilePicture?: string;
  phone?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  fitnessLevel: 'standard' | 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => void;
  apiFetch: <T = any>(path: string, init?: RequestInit) => Promise<T>;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3000';

const LS_USER = 'fitlife-user';
const LS_AT = 'access_token';
const LS_RT = 'refresh_token';

const AuthContext = createContext<AuthContextType | null>(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { const raw = localStorage.getItem(LS_USER); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  });

  const saveUser = (u: User | null) => { if (u) localStorage.setItem(LS_USER, JSON.stringify(u)); else localStorage.removeItem(LS_USER); };
  const saveTokens = (access?: string, refresh?: string) => { if (access) localStorage.setItem(LS_AT, access); if (refresh) localStorage.setItem(LS_RT, refresh); };
  const clearTokens = () => { localStorage.removeItem(LS_AT); localStorage.removeItem(LS_RT); };

  const getAccess = () => localStorage.getItem(LS_AT) || '';
  const getRefresh = () => localStorage.getItem(LS_RT) || '';

  const apiFetch = useCallback(async <T = any>(path: string, init: RequestInit = {}) => {
    const withAuth = (token: string) => ({
      ...init,
      headers: {
        ...(init.headers || {}),
        'Content-Type': (init as any).body ? 'application/json' : (init.headers as any)?.['Content-Type'] ?? 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, withAuth(getAccess()));
    if (res.status !== 401) {
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      return (await res.json()) as T;
    }

    const refresh = getRefresh();
    if (!refresh) throw new Error('Unauthorized');

    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!r.ok) {
      clearTokens();
      setUser(null);
      saveUser(null);
      throw new Error('Session expired');
    }

    const { access } = await r.json();
    saveTokens(access);
    res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, withAuth(access));
    if (!res.ok) throw new Error((await res.text()) || res.statusText);
    return (await res.json()) as T;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      const u: User = {
        id: String(data.user.id),
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        age: data.user.age,
        gender: data.user.gender,
        fitnessLevel: data.user.fitnessLevel ?? 'standard',
        goal: data.user.goal,
        joinDate: data.user.joinDate ? new Date(data.user.joinDate) : undefined,
        lastLogin: new Date(),
      };
      setUser(u); saveUser(u); saveTokens(data.access, data.refresh);
      return true;
    } catch { return false; }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!r.ok) {
        // อ่านข้อความ error เพื่อ debug ง่ายขึ้น
        const err = await r.json().catch(() => ({}));
        console.error('register failed:', err.error || r.statusText);
        return false;
      }
      const data = await r.json();
      const u: User = {
        id: String(data.user.id),
        email: data.user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        age: userData.age,
        gender: userData.gender,
        fitnessLevel: userData.fitnessLevel,
        goal: userData.goal,
        joinDate: new Date(),
        lastLogin: new Date(),
      };
      setUser(u); saveUser(u); saveTokens(data.access, data.refresh);
      return true;
    } catch { return false; }
  };

  const logout = async () => {
    try {
      const refresh = getRefresh();
      if (refresh) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch {} finally {
      clearTokens(); setUser(null); saveUser(null);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return r.ok;
    } catch { return false; }
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      // demo: ส่ง email + password (backend mock ไว้)
      const r = await fetch(`${API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, token, password }),
      });
      return r.ok;
    } catch { return false; }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated); saveUser(updated);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    apiFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}