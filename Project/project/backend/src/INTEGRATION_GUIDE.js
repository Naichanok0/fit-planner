// ========================================
// INTEGRATION GUIDE - วิธีเพิ่ม Triggers ในโปรเจ็ค
// ========================================

/**
 * ขั้นตอนที่ 1: เพิ่มในไฟล์ server.js
 * 
 * ก่อนปัจจุบัน:
 * const authRoutes = require('./routes/auth');
 * const workoutRoutes = require('./routes/workout');
 * 
 * เพิ่มเข้าไป:
 * const triggerRoutes = require('./routes/triggers');
 * const workoutWithTriggersRoutes = require('./routes/workout-with-triggers');
 * 
 * จากนั้นเพิ่มในส่วน middleware:
 * app.use('/api/triggers', triggerRoutes);
 * app.use('/api/workouts', workoutWithTriggersRoutes);
 */

// ========================================
// ตัวอย่างในไฟล์ server.js (ส่วนที่ต้องเพิ่ม)
// ========================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Routes - ตัวอย่างของที่เพิ่มเข้าไป
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workout');
const nutritionRoutes = require('./routes/nutrition');
const dashboardRoutes = require('./routes/dashboard');
const analysisRoutes = require('./routes/analysis');

// NEW: Trigger routes
const triggerRoutes = require('./routes/triggers');
const workoutWithTriggersRoutes = require('./routes/workout-with-triggers');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutWithTriggersRoutes); // แทนที่ workoutRoutes เดิม
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analysis', analysisRoutes);

// NEW: Trigger management routes
app.use('/api/triggers', triggerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========================================
// ตัวอย่าง Frontend Integration (React)
// ========================================

/**
 * ไฟล์: src/lib/api-triggers.ts
 */

export async function completeWorkout(
  sessionId: number,
  duration_min: number,
  estimated_calories: number,
  notes?: string
) {
  const response = await fetch(`/api/workouts/sessions/${sessionId}/complete`, {
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
  });

  return response.json();
}

export async function getNotifications(userId: number, unreadOnly: boolean = false) {
  const url = new URL('/api/triggers/notifications/' + userId, window.location.origin);
  if (unreadOnly) {
    url.searchParams.append('unread', 'true');
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  return response.json();
}

export async function getActivities(userId: number, limit: number = 20, offset: number = 0) {
  const response = await fetch(
    `/api/triggers/activities/${userId}?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  return response.json();
}

export async function getAchievements(userId: number) {
  const response = await fetch(`/api/triggers/achievements/${userId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  return response.json();
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await fetch(
    `/api/triggers/notifications/${notificationId}/mark-read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  return response.json();
}

export async function getUserStats(userId: number) {
  const response = await fetch(`/api/triggers/user-stats/${userId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  return response.json();
}

export async function getLeaderboard(type: 'streak' | 'workouts' | 'achievements' = 'streak') {
  const response = await fetch(`/api/triggers/leaderboard?type=${type}`);
  return response.json();
}

// ========================================
// ตัวอย่าง React Component
// ========================================

/**
 * ไฟล์: src/components/WorkoutComplete.tsx
 */

import React, { useState } from 'react';
import { completeWorkout, getNotifications } from '../lib/api-triggers';

interface WorkoutCompleteProps {
  sessionId: number;
  userId: number;
  onComplete?: () => void;
}

export const WorkoutComplete: React.FC<WorkoutCompleteProps> = ({
  sessionId,
  userId,
  onComplete
}) => {
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState(200);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleComplete = async () => {
    setLoading(true);

    try {
      const result = await completeWorkout(sessionId, duration, calories, notes);

      if (result.status === 'success') {
        // แสดง notifications ใหม่
        setNotifications(result.data.new_notifications);

        // แสดง achievements ใหม่
        if (result.data.new_achievements.length > 0) {
          result.data.new_achievements.forEach((achievement) => {
            showAchievementNotification(achievement);
          });
        }

        // เรียก callback
        onComplete?.();

        // ปิด dialog หลังจาก 2 วินาที
        setTimeout(() => {
          setNotifications([]);
        }, 5000);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAchievementNotification = (achievement: any) => {
    // ใช้ toast notification หรือ modal
    console.log(`🎉 ${achievement.title} unlocked!`);
  };

  return (
    <div className="workout-complete-dialog">
      <h2>บันทึกการออกกำลังกาย</h2>

      <div className="form-group">
        <label>ระยะเวลา (นาที)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          min="1"
        />
      </div>

      <div className="form-group">
        <label>แคลอรี่โดยประมาณ</label>
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(Number(e.target.value))}
          min="0"
        />
      </div>

      <div className="form-group">
        <label>หมายเหตุ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น เซตที่ 3 ยากนิดหน่อย"
        />
      </div>

      <button onClick={handleComplete} disabled={loading}>
        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>

      {/* แสดง Achievements ใหม่ */}
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification notification-${notif.notification_type}`}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * ไฟล์: src/components/NotificationsPanel.tsx
 */

import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead } from '../lib/api-triggers';

interface NotificationsPanelProps {
  userId: number;
  autoRefresh?: number; // milliseconds
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  userId,
  autoRefresh = 30000
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const result = await getNotifications(userId, true);
      if (result.status === 'success') {
        setNotifications(result.data);
        setUnreadCount(result.unread_count);
      }
    };

    fetchNotifications();

    // Auto-refresh
    if (autoRefresh > 0) {
      const interval = setInterval(fetchNotifications, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh]);

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
    setNotifications(notifications.filter(n => n.id !== notificationId));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  return (
    <div className="notifications-panel">
      <div className="header">
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
            <div key={notif.id} className={`notification-item notification-${notif.notification_type}`}>
              <div className="content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <small>{new Date(notif.created_at).toLocaleDateString('th-TH')}</small>
              </div>
              <button
                className="close-btn"
                onClick={() => handleMarkAsRead(notif.id)}
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

/**
 * ไฟล์: src/components/AchievementsPanel.tsx
 */

import React, { useEffect, useState } from 'react';
import { getAchievements } from '../lib/api-triggers';

interface AchievementsPanelProps {
  userId: number;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ userId }) => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [summary, setSummary] = useState({ unlocked: 0, total: 0 });

  useEffect(() => {
    const fetchAchievements = async () => {
      const result = await getAchievements(userId);
      if (result.status === 'success') {
        setAchievements(result.data);
        setSummary(result.summary);
      }
    };

    fetchAchievements();
  }, [userId]);

  return (
    <div className="achievements-panel">
      <div className="header">
        <h3>ความสำเร็จ</h3>
        <span className="progress">
          {summary.unlocked} / {summary.total}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${(summary.unlocked / summary.total) * 100}%`
          }}
        />
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement) => (
          <div
            key={achievement.achievement_id}
            className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="icon">
              {achievement.icon_url ? (
                <img src={achievement.icon_url} alt={achievement.name} />
              ) : (
                <span>{achievement.category}</span>
              )}
            </div>
            <h4>{achievement.name}</h4>
            <p>{achievement.description}</p>
            {achievement.unlocked && (
              <small className="unlock-date">
                {new Date(achievement.unlocked_at).toLocaleDateString('th-TH')}
              </small>
            )}
          </div>
        ))}
      </div>

      <div className="points-summary">
        <strong>คะแนนทั้งหมด: {summary.total_points}</strong>
      </div>
    </div>
  );
};

// ========================================
// Styles สำหรับ Notifications
// ========================================

/**
 * ไฟล์: src/styles/notifications.css
 */

.notifications-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notifications-panel .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.unread-badge {
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.notification-item {
  padding: 0.75rem;
  border-left: 4px solid #ccc;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 4px;
  background: #f9f9f9;
}

.notification-item.notification-achievement {
  border-left-color: #ffa502;
  background: #fff5e6;
}

.notification-item.notification-milestone {
  border-left-color: #2ed573;
  background: #e8f8f5;
}

.notification-item.notification-alert {
  border-left-color: #ff4757;
  background: #ffe8eb;
}

.notification-item h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
}

.notification-item p {
  margin: 0 0 0.25rem 0;
  font-size: 0.85rem;
  color: #666;
}

.notification-item small {
  color: #999;
  font-size: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  min-width: auto;
}

.close-btn:hover {
  color: #999;
}

// ========================================
// Custom Hook สำหรับใช้ Triggers
// ========================================

/**
 * ไฟล์: src/hooks/useTriggers.ts
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getNotifications,
  getActivities,
  getAchievements,
  getUserStats,
  markNotificationAsRead
} from '../lib/api-triggers';

export function useTriggers(userId: number) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    const result = await getNotifications(userId, true);
    if (result.status === 'success') {
      setNotifications(result.data);
    }
  }, [userId]);

  const refreshActivities = useCallback(async () => {
    const result = await getActivities(userId);
    if (result.status === 'success') {
      setActivities(result.data);
    }
  }, [userId]);

  const refreshAchievements = useCallback(async () => {
    const result = await getAchievements(userId);
    if (result.status === 'success') {
      setAchievements(result.data);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    const result = await getUserStats(userId);
    if (result.status === 'success') {
      setStats(result.data);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refreshNotifications(),
      refreshActivities(),
      refreshAchievements(),
      refreshStats()
    ]);
    setLoading(false);
  }, [refreshNotifications, refreshActivities, refreshAchievements, refreshStats]);

  useEffect(() => {
    refreshAll();

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [userId, refreshAll]);

  return {
    notifications,
    activities,
    achievements,
    stats,
    loading,
    refreshAll,
    markNotificationAsRead: (notifId: number) => markNotificationAsRead(notifId)
  };
}

// ========================================
// การใช้ Hook
// ========================================

/**
 * ตัวอย่างในหน้า Dashboard
 */

import { useTriggers } from '../hooks/useTriggers';

export const Dashboard = () => {
  const userId = 1; // ดึงจาก auth context
  const { notifications, achievements, stats, refreshAll } = useTriggers(userId);

  return (
    <div className="dashboard">
      <NotificationsPanel unreadCount={notifications.length} />
      <AchievementsPanel achievements={achievements} />
      {/* ... components อื่นๆ */}
    </div>
  );
};
