// ========================================
// Frontend Examples - React TypeScript
// ========================================

// ========================================
// src/lib/api-triggers.ts
// ========================================

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface Notification {
  id: number;
  user_id: number;
  notification_type: 'achievement' | 'reminder' | 'alert' | 'suggestion' | 'milestone' | 'feedback';
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: string;
  reward_points: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface Activity {
  id: number;
  user_id: number;
  trigger_type: string;
  trigger_value: string;
  description: string;
  created_at: string;
}

export interface UserStats {
  dashboard: {
    id: number;
    first_name: string;
    last_name: string;
    weight_kg: number;
    bmi: number;
    today_workouts: number;
    today_calories: number;
  };
  workout_progress: {
    days_active: number;
    total_workouts_completed: number;
    total_minutes: number;
    total_calories_burned: number;
  };
  current_streak: number;
}

// Complete Workout
export async function completeWorkout(
  sessionId: number,
  duration_min: number,
  estimated_calories: number,
  notes?: string
) {
  const response = await fetch(
    `${API_BASE}/api/workouts/sessions/${sessionId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        duration_min,
        estimated_calories,
        notes
      })
    }
  );
  
  if (!response.ok) throw new Error('Failed to complete workout');
  return response.json();
}

// Get Notifications
export async function getNotifications(
  userId: number,
  unreadOnly: boolean = false
) {
  const url = new URL(`${API_BASE}/api/triggers/notifications/${userId}`);
  if (unreadOnly) {
    url.searchParams.append('unread', 'true');
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

// Get Activities
export async function getActivities(
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  const response = await fetch(
    `${API_BASE}/api/triggers/activities/${userId}?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  if (!response.ok) throw new Error('Failed to fetch activities');
  return response.json();
}

// Get Achievements
export async function getAchievements(userId: number) {
  const response = await fetch(
    `${API_BASE}/api/triggers/achievements/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  if (!response.ok) throw new Error('Failed to fetch achievements');
  return response.json();
}

// Mark Notification as Read
export async function markNotificationAsRead(notificationId: number) {
  const response = await fetch(
    `${API_BASE}/api/triggers/notifications/${notificationId}/mark-read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
}

// Get User Stats
export async function getUserStats(userId: number): Promise<UserStats> {
  const response = await fetch(
    `${API_BASE}/api/triggers/user-stats/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  if (!response.ok) throw new Error('Failed to fetch user stats');
  const data = await response.json();
  return data.data;
}

// Get Leaderboard
export async function getLeaderboard(
  type: 'streak' | 'workouts' | 'achievements' = 'streak'
) {
  const response = await fetch(
    `${API_BASE}/api/triggers/leaderboard?type=${type}`
  );

  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

// ========================================
// src/hooks/useTriggers.ts
// ========================================

import { useEffect, useState, useCallback } from 'react';
import {
  getNotifications,
  getActivities,
  getAchievements,
  getUserStats,
  markNotificationAsRead,
  Notification,
  Achievement,
  Activity,
  UserStats
} from '../lib/api-triggers';

interface UseTriggers {
  notifications: Notification[];
  activities: Activity[];
  achievements: Achievement[];
  stats: UserStats | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  markAsRead: (notifId: number) => Promise<void>;
  unreadCount: number;
}

export function useTriggers(userId: number, autoRefreshMs: number = 30000): UseTriggers {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const result = await getNotifications(userId, true);
      if (result.status === 'success') {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  const refreshActivities = useCallback(async () => {
    try {
      const result = await getActivities(userId, 20, 0);
      if (result.status === 'success') {
        setActivities(result.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [userId]);

  const refreshAchievements = useCallback(async () => {
    try {
      const result = await getAchievements(userId);
      if (result.status === 'success') {
        setAchievements(result.data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    try {
      const data = await getUserStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshNotifications(),
        refreshActivities(),
        refreshAchievements(),
        refreshStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications, refreshActivities, refreshAchievements, refreshStats]);

  const markAsRead = useCallback(async (notifId: number) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications(notifications.filter(n => n.id !== notifId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [notifications]);

  // Auto-refresh on mount and interval
  useEffect(() => {
    refreshAll();

    if (autoRefreshMs > 0) {
      const interval = setInterval(refreshAll, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefreshMs, refreshAll]);

  return {
    notifications,
    activities,
    achievements,
    stats,
    loading,
    refreshAll,
    markAsRead,
    unreadCount: notifications.length
  };
}

// ========================================
// src/components/NotificationsPanel.tsx
// ========================================

import React from 'react';
import { Notification } from '../lib/api-triggers';
import '../styles/notifications-panel.css';

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notifId: number) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead
}) => {
  const getIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'achievement': '🏆',
      'reminder': '⏰',
      'alert': '🚨',
      'suggestion': '💡',
      'milestone': '🎯',
      'feedback': '📖'
    };
    return icons[type] || '📬';
  };

  return (
    <div className="notifications-panel">
      <div className="panel-header">
        <h3>การแจ้งเตือน</h3>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="empty-state">ไม่มีการแจ้งเตือนใหม่</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item notification-${notif.notification_type}`}
            >
              <div className="notification-icon">
                {getIcon(notif.notification_type)}
              </div>
              <div className="notification-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <small>
                  {new Date(notif.created_at).toLocaleDateString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </small>
              </div>
              <button
                className="close-btn"
                onClick={() => onMarkAsRead(notif.id)}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ========================================
// src/components/AchievementsPanel.tsx
// ========================================

import React from 'react';
import { Achievement } from '../lib/api-triggers';
import '../styles/achievements-panel.css';

interface AchievementsPanelProps {
  achievements: Achievement[];
  totalPoints?: number;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  achievements,
  totalPoints = 0
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercent = (unlockedCount / achievements.length) * 100;

  const groupedByCategory = achievements.reduce((acc, ach) => {
    const cat = ach.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="achievements-panel">
      <div className="panel-header">
        <h3>ความสำเร็จ</h3>
        <span className="achievement-count">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="progress-text">{Math.round(progressPercent)}% สำเร็จ</p>
      </div>

      <div className="achievements-content">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <div key={category} className="achievement-category">
            <h4 className="category-title">{category}</h4>
            <div className="achievements-grid">
              {items.map((achievement) => (
                <div
                  key={achievement.achievement_id}
                  className={`achievement-card ${
                    achievement.unlocked ? 'unlocked' : 'locked'
                  }`}
                >
                  <div className="achievement-icon">
                    {achievement.icon_url ? (
                      <img src={achievement.icon_url} alt={achievement.name} />
                    ) : (
                      <span className="icon-placeholder">🔒</span>
                    )}
                  </div>
                  <h5>{achievement.name}</h5>
                  <p className="achievement-desc">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <div className="unlocked-date">
                      {new Date(achievement.unlocked_at!).toLocaleDateString('th-TH')}
                    </div>
                  )}
                  <div className="reward-points">
                    +{achievement.reward_points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="points-summary">
        <strong>คะแนนรวม: {totalPoints}</strong>
      </div>
    </div>
  );
};

// ========================================
// src/components/WorkoutCompleteDialog.tsx
// ========================================

import React, { useState } from 'react';
import { completeWorkout } from '../lib/api-triggers';
import '../styles/workout-complete.css';

interface WorkoutCompleteDialogProps {
  sessionId: number;
  userId: number;
  onSuccess?: (result: any) => void;
  onClose?: () => void;
}

export const WorkoutCompleteDialog: React.FC<WorkoutCompleteDialogProps> = ({
  sessionId,
  userId,
  onSuccess,
  onClose
}) => {
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState(200);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await completeWorkout(
        sessionId,
        duration,
        calories,
        notes
      );

      if (result.status === 'success') {
        // Show achievements if any
        if (result.data.new_achievements.length > 0) {
          setAchievements(result.data.new_achievements);
          setShowAchievements(true);

          // Auto-close after 5 seconds
          setTimeout(() => {
            setShowAchievements(false);
            onSuccess?.(result);
            onClose?.();
          }, 5000);
        } else {
          onSuccess?.(result);
          onClose?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (showAchievements) {
    return (
      <div className="achievements-modal">
        <div className="modal-content">
          <h2>🎉 ปลดล็อก Achievements ใหม่!</h2>
          <div className="achievements-list">
            {achievements.map((ach) => (
              <div key={ach.id} className="achievement-unlock">
                <span className="emoji">{ach.title}</span>
                <h3>{ach.message}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-complete-dialog">
      <div className="dialog-header">
        <h2>บันทึกการออกกำลังกาย</h2>
      </div>

      <div className="dialog-content">
        <div className="form-group">
          <label htmlFor="duration">ระยะเวลา (นาที)</label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1"
            max="300"
          />
        </div>

        <div className="form-group">
          <label htmlFor="calories">แคลอรี่โดยประมาณ</label>
          <input
            id="calories"
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            min="0"
            max="2000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">หมายเหตุ</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น เซตที่ 3 ยากนิดหน่อย"
            rows={4}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="dialog-actions">
        <button
          className="btn-cancel"
          onClick={onClose}
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          className="btn-submit"
          onClick={handleComplete}
          disabled={loading}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
};

// ========================================
// src/styles/notifications-panel.css
// ========================================

.notifications-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.75rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.unread-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f9f9f9;
  margin-bottom: 0.75rem;
  border-left: 4px solid #ccc;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.notification-achievement {
  border-left-color: #ffa502;
  background: #fff8f0;
}

.notification-item.notification-milestone {
  border-left-color: #2ed573;
  background: #f0f9f6;
}

.notification-item.notification-alert {
  border-left-color: #ff4757;
  background: #ffe8eb;
}

.notification-icon {
  font-size: 1.5rem;
  min-width: 1.5rem;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #333;
}

.notification-content p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: #666;
}

.notification-content small {
  color: #999;
  font-size: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  min-width: auto;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #999;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem 1rem;
  font-style: italic;
}
