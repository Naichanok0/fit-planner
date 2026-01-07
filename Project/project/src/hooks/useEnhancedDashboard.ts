// src/hooks/useEnhancedDashboard.ts - Custom hooks for enhanced database features
import { useState, useEffect, useCallback } from 'react';
import { 
  dashboardApi, 
  workoutApi, 
  nutritionApi, 
  UserDashboard, 
  WorkoutProgress, 
  ProgressReport,
  WorkoutSession,
  NutritionLog 
} from '../lib/api-enhanced';

// Hook สำหรับ Dashboard หลัก
export function useUserDashboard(userId: number | null) {
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.getUserData(userId);
      setDashboard(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

// Hook สำหรับ Workout Progress
export function useWorkoutProgress(userId: number | null) {
  const [progress, setProgress] = useState<WorkoutProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.getProgress(userId);
      setProgress(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refetch: fetchProgress };
}

// Hook สำหรับ Current Streak
export function useCurrentStreak(userId: number | null) {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchStreak = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await dashboardApi.getStreak(userId);
      setStreak(response.data.current_streak);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streak, loading, refetch: fetchStreak };
}

// Hook สำหรับ Progress Report
export function useProgressReport(userId: number | null, days: number = 7) {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardApi.getReport(userId, days);
      setReport(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refetch: fetchReport };
}

// Hook สำหรับ Weekly Stats
export function useWeeklyStats(userId: number | null) {
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWeeklyStats = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await dashboardApi.getWeeklyStats(userId);
      setWeeklyStats(response.data);
    } catch (err) {
      console.error('Failed to fetch weekly stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  return { weeklyStats, loading, refetch: fetchWeeklyStats };
}

// Hook สำหรับจัดการ Workout Sessions
export function useWorkoutSessions(userId: number | null) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (options?: any) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await workoutApi.getAll(userId, options);
      setSessions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createSession = useCallback(async (sessionData: Partial<WorkoutSession>) => {
    if (!userId) return null;
    
    try {
      const response = await workoutApi.create({ ...sessionData, user_id: userId });
      fetchSessions(); // Refresh list
      return response.session_id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  }, [userId, fetchSessions]);

  const completeSession = useCallback(async (sessionId: number, sessionData: Partial<WorkoutSession>) => {
    try {
      await workoutApi.complete(sessionId, sessionData);
      fetchSessions(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
      return false;
    }
  }, [fetchSessions]);

  const deleteSession = useCallback(async (sessionId: number) => {
    try {
      await workoutApi.delete(sessionId);
      fetchSessions(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    completeSession,
    deleteSession,
    refetch: fetchSessions
  };
}

// Hook สำหรับ Today's Workouts
export function useTodayWorkouts(userId: number | null) {
  const [todayData, setTodayData] = useState<{ sessions: WorkoutSession[]; stats: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayWorkouts = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await workoutApi.getToday(userId);
      setTodayData(response.data);
    } catch (err) {
      console.error('Failed to fetch today workouts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodayWorkouts();
  }, [fetchTodayWorkouts]);

  return { todayData, loading, refetch: fetchTodayWorkouts };
}

// Hook สำหรับจัดการ Nutrition
export function useNutritionLogs(userId: number | null) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (options?: any) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await nutritionApi.getLogs(userId, options);
      setLogs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nutrition logs');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveLog = useCallback(async (logData: Partial<NutritionLog>) => {
    if (!userId) return false;
    
    try {
      await nutritionApi.saveLog({ ...logData, user_id: userId });
      fetchLogs(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save nutrition log');
      return false;
    }
  }, [userId, fetchLogs]);

  const completeMeal = useCallback(async (date: string, mealId: string) => {
    if (!userId) return false;
    
    try {
      await nutritionApi.completeMeal(userId, date, mealId);
      fetchLogs(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete meal');
      return false;
    }
  }, [userId, fetchLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    saveLog,
    completeMeal,
    refetch: fetchLogs
  };
}

// Hook สำหรับ Daily Nutrition
export function useDailyNutrition(userId: number | null, date?: string) {
  const [dailyData, setDailyData] = useState<{ date: string; meals: NutritionLog[]; stats: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDailyNutrition = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await nutritionApi.getDaily(userId, date);
      setDailyData(response.data);
    } catch (err) {
      console.error('Failed to fetch daily nutrition:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    fetchDailyNutrition();
  }, [fetchDailyNutrition]);

  return { dailyData, loading, refetch: fetchDailyNutrition };
}

// Hook สำหรับ Nutrition Recommendations
export function useNutritionRecommendations(userId: number | null) {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await nutritionApi.getRecommendations(userId);
      setRecommendations(response.data);
    } catch (err) {
      console.error('Failed to fetch nutrition recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, refetch: fetchRecommendations };
}

// Hook รวมสำหรับ Dashboard ครบวงจร
export function useCompleteDashboard(userId: number | null) {
  const dashboard = useUserDashboard(userId);
  const progress = useWorkoutProgress(userId);
  const streak = useCurrentStreak(userId);
  const weeklyStats = useWeeklyStats(userId);
  const todayWorkouts = useTodayWorkouts(userId);
  const dailyNutrition = useDailyNutrition(userId);

  const updateProgress = useCallback(async () => {
    if (!userId) return;
    
    try {
      await dashboardApi.updateProgress(userId);
      // Refresh all data
      dashboard.refetch();
      progress.refetch();
      streak.refetch();
      weeklyStats.refetch();
      todayWorkouts.refetch();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [userId, dashboard, progress, streak, weeklyStats, todayWorkouts]);

  const isLoading = dashboard.loading || progress.loading || streak.loading;

  return {
    dashboard: dashboard.dashboard,
    progress: progress.progress,
    streak: streak.streak,
    weeklyStats: weeklyStats.weeklyStats,
    todayWorkouts: todayWorkouts.todayData,
    dailyNutrition: dailyNutrition.dailyData,
    loading: isLoading,
    error: dashboard.error || progress.error,
    updateProgress,
    refetchAll: () => {
      dashboard.refetch();
      progress.refetch();
      streak.refetch();
      weeklyStats.refetch();
      todayWorkouts.refetch();
      dailyNutrition.refetch();
    }
  };
}