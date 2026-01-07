/**
 * FitLife Planner API Client
 * ✅ Connects to backend at http://localhost:3002
 */

// ✅ API Base URL - ชี้ไปที่ Backend Server
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002';

// 🔐 Utility: Get stored JWT tokens
function getTokens() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  return { accessToken, refreshToken };
}

// 🔄 Utility: Refresh JWT token
async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error('No refresh token found');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Token refresh failed');
  }

  const { accessToken } = await res.json();
  localStorage.setItem('accessToken', accessToken);
  return accessToken;
}

// 🛠️ Fetch wrapper with JWT + auto-refresh
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let { accessToken } = getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // 🔄 Auto-refresh if token expired
  if (res.status === 401 && accessToken) {
    try {
      accessToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (e) {
      console.error('Token refresh failed:', e);
      window.location.href = '/login';
      throw e;
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ===== 🔐 AUTH API =====

export async function signup(email: string, password: string, name: string) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  const { accessToken, refreshToken } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return { accessToken, refreshToken };
}

export async function logout() {
  const { refreshToken } = getTokens();
  if (refreshToken) {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// ===== 📊 DASHBOARD API =====

export interface BodyMeasurement {
  id?: number;
  user_id?: number;
  height: number;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bmi?: number;
  bmi_category?: string;
  analysis_date?: string;
  ai_analysis?: string;
  image_url?: string;
}

export async function getDashboard() {
  return apiFetch('/api/dashboard');
}

export async function saveBodyMeasurements(data: BodyMeasurement) {
  return apiFetch('/api/dashboard/body-measurements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== 💪 WORKOUT API =====

export interface WorkoutProgram {
  id?: number;
  user_id?: number;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number;
  created_at?: string;
}

export interface WorkoutSession {
  id?: number;
  program_id?: number;
  user_id?: number;
  date?: string;
  exercises?: string[];
  duration_minutes?: number;
  notes?: string;
  completed?: boolean;
}

export async function getWorkoutPrograms() {
  return apiFetch('/api/workout');
}

export async function createWorkoutProgram(program: WorkoutProgram) {
  return apiFetch('/api/workout', {
    method: 'POST',
    body: JSON.stringify(program),
  });
}

export async function updateWorkoutProgram(id: number, program: WorkoutProgram) {
  return apiFetch(`/api/workout/${id}`, {
    method: 'PUT',
    body: JSON.stringify(program),
  });
}

export async function deleteWorkoutProgram(id: number) {
  return apiFetch(`/api/workout/${id}`, {
    method: 'DELETE',
  });
}

// ===== 🍎 NUTRITION API =====

export interface NutritionPlan {
  id?: number;
  user_id?: number;
  name: string;
  description?: string;
  calories_target?: number;
  created_at?: string;
}

export interface NutritionLog {
  id?: number;
  plan_id?: number;
  user_id?: number;
  food_item: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  logged_at?: string;
}

export async function getNutritionPlans() {
  return apiFetch('/api/nutrition');
}

export async function createNutritionPlan(plan: NutritionPlan) {
  return apiFetch('/api/nutrition', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
}

export async function logNutrition(log: NutritionLog) {
  return apiFetch('/api/nutrition/log', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

export async function getNutritionLogs(planId?: number) {
  const query = planId ? `?plan_id=${planId}` : '';
  return apiFetch(`/api/nutrition/logs${query}`);
}

// ===== 🎯 TRIGGERS & ACTIVITIES API =====

export interface Activity {
  id?: number;
  user_id?: number;
  activity_type: string;
  description?: string;
  points?: number;
  created_at?: string;
}

export interface Notification {
  id?: number;
  user_id?: number;
  title: string;
  message: string;
  type?: 'achievement' | 'milestone' | 'reminder';
  read?: boolean;
  created_at?: string;
}

export interface Achievement {
  id?: number;
  badge_name: string;
  description?: string;
  points?: number;
  condition?: string;
}

export interface UserAchievement {
  id?: number;
  user_id?: number;
  achievement_id?: number;
  unlocked_at?: string;
  points_earned?: number;
}

export async function getActivities(userId: number) {
  return apiFetch(`/api/triggers/activities?user_id=${userId}`);
}

export async function logActivity(activity: Activity) {
  return apiFetch('/api/triggers/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
}

export async function getNotifications(userId: number) {
  return apiFetch(`/api/triggers/notifications?user_id=${userId}`);
}

export async function markNotificationAsRead(notificationId: number) {
  return apiFetch(`/api/triggers/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

export async function getAchievements(userId: number) {
  return apiFetch(`/api/triggers/achievements?user_id=${userId}`);
}

export async function getUserStats(userId: number) {
  return apiFetch(`/api/triggers/stats?user_id=${userId}`);
}

export async function getLeaderboard(limit: number = 10) {
  return apiFetch(`/api/triggers/leaderboard?limit=${limit}`);
}

// ===== 🤖 AI ANALYSIS API =====

export async function analyzeBodyImage(imageBase64: string) {
  return apiFetch('/api/analysis', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  });
}

export async function getAnalysisHistory() {
  return apiFetch('/api/analysis');
}

// ===== 🛠️ UTILITY FUNCTIONS =====

export function getAuthToken() {
  return getTokens().accessToken;
}

export function isAuthenticated() {
  return !!getTokens().accessToken;
}

export function setAuthToken(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearAuthToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const apiClient = {
  // Auth
  signup,
  login,
  logout,

  // Dashboard
  getDashboard,
  saveBodyMeasurements,

  // Workout
  getWorkoutPrograms,
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram,

  // Nutrition
  getNutritionPlans,
  createNutritionPlan,
  logNutrition,
  getNutritionLogs,

  // Triggers & Activities
  getActivities,
  logActivity,
  getNotifications,
  markNotificationAsRead,
  getAchievements,
  getUserStats,
  getLeaderboard,

  // Analysis
  analyzeBodyImage,
  getAnalysisHistory,

  // Utility
  getAuthToken,
  isAuthenticated,
  setAuthToken,
  clearAuthToken,
};

export default apiClient;
