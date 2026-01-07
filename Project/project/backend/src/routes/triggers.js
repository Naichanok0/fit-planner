// ========================================
// routes/triggers.js - Trigger Management Routes
// ========================================

const express = require('express');

module.exports = (q) => {
  const router = express.Router();

  /**
   * @route   GET /api/triggers/activities
   * @desc    Get user activities
   * @access  Public
   */
  router.get('/activities', async (req, res, next) => {
    try {
      const userId = req.query.user_id || 1;
      const limit = parseInt(req.query.limit || 20);
      const offset = parseInt(req.query.offset || 0);

      const activities = await q(
        `SELECT 
          id, user_id, activity_type, description, points, created_at
         FROM user_activity_triggers
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      res.json({
        ok: true,
        activities: activities || []
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   POST /api/triggers/activities
   * @desc    Log new activity
   * @access  Public
   */
  router.post('/activities', async (req, res, next) => {
    try {
      const { user_id = 1, activity_type, description, points = 0 } = req.body;

      await q(
        `INSERT INTO user_activity_triggers (user_id, activity_type, description, points, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [user_id, activity_type, description, points]
      );

      res.json({
        ok: true,
        message: 'Activity logged'
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   GET /api/triggers/notifications
   * @desc    Get user notifications
   * @access  Public
   */
  router.get('/notifications', async (req, res, next) => {
    try {
      const userId = req.query.user_id || 1;

      const notifications = await q(
        `SELECT id, user_id, title, message, type, read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        ok: true,
        notifications: notifications || []
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   POST /api/triggers/notifications/:id/read
   * @desc    Mark notification as read
   * @access  Public
   */
  router.post('/notifications/:id/read', async (req, res, next) => {
    try {
      const { id } = req.params;

      await q(
        `UPDATE notifications SET read = 1 WHERE id = ?`,
        [id]
      );

      res.json({
        ok: true,
        message: 'Notification marked as read'
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   GET /api/triggers/achievements
   * @desc    Get user achievements
   * @access  Public
   */
  router.get('/achievements', async (req, res, next) => {
    try {
      const userId = req.query.user_id || 1;

      const achievements = await q(
        `SELECT ua.id, ua.user_id, a.badge_name, a.description, a.points, ua.unlocked_at
         FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = ?
         ORDER BY ua.unlocked_at DESC`,
        [userId]
      );

      res.json({
        ok: true,
        achievements: achievements || []
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   GET /api/triggers/stats
   * @desc    Get user statistics
   * @access  Public
   */
  router.get('/stats', async (req, res, next) => {
    try {
      const userId = req.query.user_id || 1;

      // Get basic stats
      const stats = await q(
        `SELECT 
          COUNT(DISTINCT DATE(ws.date)) as workouts_done,
          SUM(ws.duration_minutes) as total_minutes,
          COUNT(DISTINCT nl.id) as meals_logged,
          COUNT(DISTINCT ua.id) as achievements_unlocked
         FROM users u
         LEFT JOIN workout_sessions ws ON u.id = ws.user_id
         LEFT JOIN nutrition_logs nl ON u.id = nl.user_id
         LEFT JOIN user_achievements ua ON u.id = ua.user_id
         WHERE u.id = ?`,
        [userId]
      );

      res.json({
        ok: true,
        stats: stats[0] || {
          workouts_done: 0,
          total_minutes: 0,
          meals_logged: 0,
          achievements_unlocked: 0
        }
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @route   GET /api/triggers/leaderboard
   * @desc    Get global leaderboard
   * @access  Public
   */
  router.get('/leaderboard', async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || 10);

      const leaderboard = await q(
        `SELECT 
          u.id, u.name,
          COUNT(DISTINCT ua.id) as total_points,
          COUNT(DISTINCT DATE(ws.date)) as workouts,
          COUNT(DISTINCT ua.achievement_id) as achievements
         FROM users u
         LEFT JOIN user_achievements ua ON u.id = ua.user_id
         LEFT JOIN workout_sessions ws ON u.id = ws.user_id
         GROUP BY u.id, u.name
         ORDER BY total_points DESC, workouts DESC
         LIMIT ?`,
        [limit]
      );

      res.json({
        ok: true,
        leaderboard: leaderboard || []
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
