// src/lib/api.ts - Enhanced API client with database integration
export interface UserDashboard {
  id: number;
  email: string;
  full_name: string;
  goal: string;
  fitness_level: string;
  bmi: number;
  bmi_category?: string;
  body_type: string;
  weight_kg: number;
  height_cm: number;
  program_id: string;
  current_week: number;
  program_days: number;
  total_workouts: number;
  weekly_workouts: number;
  avg_form_score_30d: number;
  weekly_calories_burned: number;
}

export interface WorkoutProgress {
  user_id: number;
  email: string;
  goal: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  total_workout_minutes: number;
  total_calories_burned: number;
  avg_session_duration: number;
  last_workout_date: string;
  days_since_last_workout: number;
}

export interface WorkoutSession {
  id: number;
  user_id: number;
  program_id: string;
  day_code: string;
  session_date: string;
  duration_min: number;
  estimated_calories: number;
  completed: boolean;
  exercises_json: any;
  form_feedback_json: any;
  notes?: string;
  status: 'Completed' | 'Pending';
}

export interface NutritionLog {
  id: number;
  user_id: number;
  log_date: string;
  meal_id: string;
  planned_time?: string;
  completed: boolean;
  calories: number;
  foods_json: any;
  status: 'Completed' | 'Planned';
}

export interface BodyMeasurement {
  id: number;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmi_category: string;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  body_type?: string;
  created_at: string;
}

export interface ProgressReport {
  summary: {
    report_type: string;
    user_id: number;
    report_period_days: number;
    active_days: number;
    total_reps: number;
    total_calories: number;
    avg_form_score: number;
    max_streak: number;
    current_streak: number;
    current_bmi_category: string;
  };
  workouts: Array<{
    session_date: string;
    day_code: string;
    duration_min: number;
    estimated_calories: number;
    completed: boolean;
    status: string;
  }>;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Dashboard APIs
  async getUserDashboard(userId: number): Promise<{ success: boolean; data: UserDashboard }> {
    return this.request(`/dashboard/user/${userId}`);
  }

  async getWorkoutProgress(userId: number): Promise<{ success: boolean; data: WorkoutProgress }> {
    return this.request(`/dashboard/workout-progress/${userId}`);
  }

  async getCurrentStreak(userId: number): Promise<{ success: boolean; data: { user_id: number; current_streak: number } }> {
    return this.request(`/dashboard/streak/${userId}`);
  }

  async updateDailyProgress(userId: number, date?: string): Promise<{ success: boolean; data: any }> {
    return this.request(`/dashboard/progress/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  async getProgressReport(userId: number, days: number = 7): Promise<{ success: boolean; data: ProgressReport }> {
    return this.request(`/dashboard/report/${userId}?days=${days}`);
  }

  async getWeeklyStats(userId: number): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/dashboard/weekly-stats/${userId}`);
  }

  async getBodyMeasurements(userId: number, limit: number = 10): Promise<{ success: boolean; data: BodyMeasurement[] }> {
    return this.request(`/dashboard/body-measurements/${userId}?limit=${limit}`);
  }

  // Workout APIs
  async createWorkoutSession(session: Partial<WorkoutSession>): Promise<{ success: boolean; session_id: number }> {
    return this.request('/workout/session', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async completeWorkoutSession(sessionId: number, sessionData: Partial<WorkoutSession>): Promise<{ success: boolean; data: WorkoutSession }> {
    return this.request(`/workout/session/${sessionId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  async getWorkoutSessions(
    userId: number, 
    options: {
      limit?: number;
      offset?: number;
      program_id?: string;
      completed?: boolean;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<{ success: boolean; data: WorkoutSession[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString();
    return this.request(`/workout/sessions/${userId}${query ? '?' + query : ''}`);
  }

  async getTodayWorkouts(userId: number): Promise<{ success: boolean; data: { sessions: WorkoutSession[]; stats: any } }> {
    return this.request(`/workout/today/${userId}`);
  }

  async deleteWorkoutSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/workout/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Nutrition APIs
  async saveNutritionLog(log: Partial<NutritionLog>): Promise<{ success: boolean; message: string }> {
    return this.request('/nutrition/log', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  async completeMeal(userId: number, date: string, mealId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/nutrition/log/${userId}/${date}/${mealId}/complete`, {
      method: 'PUT',
    });
  }

  async getNutritionLogs(
    userId: number,
    options: {
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ success: boolean; data: NutritionLog[] }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString();
    return this.request(`/nutrition/logs/${userId}${query ? '?' + query : ''}`);
  }

  async getDailyNutrition(userId: number, date?: string): Promise<{ 
    success: boolean; 
    data: { 
      date: string; 
      meals: NutritionLog[]; 
      stats: any 
    } 
  }> {
    const endpoint = date 
      ? `/nutrition/daily/${userId}/${date}`
      : `/nutrition/daily/${userId}`;
    return this.request(endpoint);
  }

  async getWeeklyNutritionSummary(userId: number): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/nutrition/weekly-summary/${userId}`);
  }

  async getNutritionRecommendations(userId: number): Promise<{ 
    success: boolean; 
    data: {
      user_goal: string;
      recommended_daily_calories: number;
      meal_plan: any;
      tips: string[];
    }
  }> {
    return this.request(`/nutrition/recommendations/${userId}`);
  }

  // Body Analysis APIs (existing)
  async saveBodyAnalysis(analysisData: any): Promise<{ ok: boolean }> {
    return this.request('/analysis/save', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  // Auth APIs (existing)
  async login(email: string, password: string): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async logout(refreshToken: string): Promise<any> {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export helper functions for specific operations
export const dashboardApi = {
  getUserData: (userId: number) => apiClient.getUserDashboard(userId),
  getProgress: (userId: number) => apiClient.getWorkoutProgress(userId),
  getStreak: (userId: number) => apiClient.getCurrentStreak(userId),
  updateProgress: (userId: number, date?: string) => apiClient.updateDailyProgress(userId, date),
  getReport: (userId: number, days?: number) => apiClient.getProgressReport(userId, days),
  getWeeklyStats: (userId: number) => apiClient.getWeeklyStats(userId),
};

export const workoutApi = {
  create: (session: Partial<WorkoutSession>) => apiClient.createWorkoutSession(session),
  complete: (sessionId: number, data: Partial<WorkoutSession>) => apiClient.completeWorkoutSession(sessionId, data),
  getAll: (userId: number, options?: any) => apiClient.getWorkoutSessions(userId, options),
  getToday: (userId: number) => apiClient.getTodayWorkouts(userId),
  delete: (sessionId: number) => apiClient.deleteWorkoutSession(sessionId),
};

export const nutritionApi = {
  saveLog: (log: Partial<NutritionLog>) => apiClient.saveNutritionLog(log),
  completeMeal: (userId: number, date: string, mealId: string) => apiClient.completeMeal(userId, date, mealId),
  getLogs: (userId: number, options?: any) => apiClient.getNutritionLogs(userId, options),
  getDaily: (userId: number, date?: string) => apiClient.getDailyNutrition(userId, date),
  getWeeklySummary: (userId: number) => apiClient.getWeeklyNutritionSummary(userId),
  getRecommendations: (userId: number) => apiClient.getNutritionRecommendations(userId),
};

export default apiClient;