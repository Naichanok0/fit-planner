// src/contexts/AuthProvider.tsx
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

type Gender = 'male' | 'female';
type Goal = 'weight-loss' | 'muscle-gain' | 'maintenance';
// หมายเหตุ: ใน DB ตอนนี้ enum มีแค่ 'standard' หากจะใช้ระดับอื่นๆ ต้องไปเพิ่ม enum ที่ DB/Backend ให้รองรับก่อน
type FitnessLevel = 'standard' | 'beginner' | 'intermediate' | 'advanced';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: Gender;
  fitnessLevel?: FitnessLevel;
  goal?: Goal;
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
  gender: Gender;
  fitnessLevel: FitnessLevel; // ถ้า DB รองรับแค่ 'standard' ให้ส่ง 'standard'
  goal: Goal;
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

// ✅ เปลี่ยน fallback เป็น 3001 (ไม่มี /api เพราะ server ของคุณ mount /auth/* ตรงๆ)
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3001';

const LS_USER = 'fitlife-user';
const LS_AT = 'access_token';
const LS_RT = 'refresh_token';

const AuthContext = createContext<AuthContextType | null>(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// helper: แปลง user จากรูปแบบ snake/camel ของ backend → camel สำหรับ frontend
function normalizeUser(payload: any): User {
  const u = payload?.user ?? payload;
  return {
    id: String(u.id),
    email: u.email,
    firstName: u.firstName ?? u.first_name,
    lastName: u.lastName ?? u.last_name,
    age: u.age ?? (u.age === 0 ? 0 : undefined),
    gender: u.gender,
    fitnessLevel: (u.fitnessLevel ?? u.fitness_level ?? 'standard') as FitnessLevel,
    goal: u.goal,
    joinDate: u.joinDate ? new Date(u.joinDate) : (u.join_date ? new Date(u.join_date) : undefined),
    lastLogin: new Date(),
    profilePicture: u.profilePicture ?? u.profile_picture,
    phone: u.phone,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(LS_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const saveUser = (u: User | null) => {
    if (u) localStorage.setItem(LS_USER, JSON.stringify(u));
    else localStorage.removeItem(LS_USER);
  };
  const saveTokens = (access?: string, refresh?: string) => {
    if (access) localStorage.setItem(LS_AT, access);
    if (refresh) localStorage.setItem(LS_RT, refresh);
  };
  const clearTokens = () => {
    localStorage.removeItem(LS_AT);
    localStorage.removeItem(LS_RT);
  };

  const getAccess = () => localStorage.getItem(LS_AT) || '';
  const getRefresh = () => localStorage.getItem(LS_RT) || '';

  const apiFetch = useCallback(
    async <T = any>(path: string, init: RequestInit = {}) => {
      const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

      const withAuth = (token: string): RequestInit => {
        const baseHeaders = { 'Content-Type': 'application/json', ...(init.headers || {}) } as Record<string, string>;
        if (token) baseHeaders.Authorization = `Bearer ${token}`;
        return { ...init, headers: baseHeaders };
      };

      // ยิงด้วย access token ปัจจุบันก่อน
      let res = await fetch(url, withAuth(getAccess()));
      if (res.status !== 401) {
        if (!res.ok) throw new Error((await res.text()) || res.statusText);
        return (await res.json()) as T;
      }

      // ถ้า 401 → ขอ refresh token
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
      res = await fetch(url, withAuth(access));
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      return (await res.json()) as T;
    },
    []
  );

    // On mount, if there's an access token, try to hydrate user from backend (/auth/me)
    useEffect(() => {
      const at = getAccess();
      if (!at) return;

      (async () => {
        try {
          const data = await apiFetch('/auth/me');
          const u = normalizeUser(data);
          setUser(u);
          saveUser(u);
        } catch (e) {
          // ignore, user remains null
          console.debug('hydrate user failed:', e);
        }
      })();
    }, [apiFetch]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return false;

      const data = await r.json();
      const u = normalizeUser(data);
      setUser(u);
      saveUser(u);
      saveTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // ✅ ส่งเป็น snake_case ให้ตรง schema MySQL
      const payload = {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        age: userData.age,
        gender: userData.gender,
        fitness_level: userData.fitnessLevel, // หาก DB รองรับแค่ 'standard' ให้ส่ง 'standard'
        goal: userData.goal,
      };

      const r = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => '');
        console.error('register failed:', errText || r.statusText);
        return false;
      }

      const data = await r.json();
      const u = normalizeUser(data);
      setUser(u);
      saveUser(u);
      saveTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
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
    } catch {
      // ignore
    } finally {
      clearTokens();
      setUser(null);
      saveUser(null);
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
    } catch {
      return false;
    }
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      const r = await fetch(`${API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ตัวอย่าง: ใช้ email จาก user ปัจจุบัน (เดโม่)
        body: JSON.stringify({ email: user?.email, token, password }),
      });
      return r.ok;
    } catch {
      return false;
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    saveUser(updated);
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
