// ========================================
// routes/workout-with-triggers.js - Workout Routes with Trigger Integration
// ========================================

const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * @route   POST /api/workouts/sessions/:sessionId/complete
 * @desc    บันทึกว่าสำเร็จการออกกำลังกาย (จะทำให้ triggers ทำงาน)
 * @access  Private
 */
router.post('/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration_min, estimated_calories, notes } = req.body;

    // ดึงข้อมูล session
    const session = await db.query(
      `SELECT * FROM workout_sessions WHERE id = ?`,
      [sessionId]
    );

    if (!session.length) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    const userId = session[0].user_id;

    // อัปเดต session
    await db.query(
      `UPDATE workout_sessions 
       SET completed = TRUE, 
           completed_at = NOW(),
           duration_min = ?,
           estimated_calories = ?,
           notes = ?
       WHERE id = ?`,
      [duration_min || null, estimated_calories || null, notes || null, sessionId]
    );

    // Trigger tr_workout_completed จะทำงานอัตโนมัติ
    // - บันทึกใน user_activity_triggers
    // - อัปเดต progress_daily
    // - ตรวจสอบ streak achievements

    // ตรวจสอบ achievements ใหม่
    await db.query('CALL sp_check_achievements(?)', [userId]);

    // ดึง notifications ใหม่ที่สร้างในวินาที่ผ่านมา
    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)
       ORDER BY created_at DESC`,
      [userId]
    );

    // ดึง progress ที่อัปเดต
    const progress = await db.query(
      `SELECT * FROM progress_daily 
       WHERE user_id = ? AND progress_date = CURDATE()`,
      [userId]
    );

    res.json({
      status: 'success',
      message: 'Workout completed successfully',
      data: {
        session_id: sessionId,
        progress: progress[0],
        new_notifications: notifications,
        new_achievements: notifications.filter(n => n.notification_type === 'achievement')
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   GET /api/workouts/sessions/user/:userId
 * @desc    ดึง workout sessions ของผู้ใช้
 * @access  Private
 */
router.get('/sessions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { completed, date_from, date_to } = req.query;

    let query = `
      SELECT 
        id, user_id, program_id, day_code, session_date,
        duration_min, estimated_calories, exercises_json,
        form_feedback_json, notes, completed, completed_at, created_at
      FROM workout_sessions
      WHERE user_id = ?
    `;
    const params = [userId];

    if (completed !== undefined) {
      query += ` AND completed = ${completed === 'true' ? 'TRUE' : 'FALSE'}`;
    }

    if (date_from) {
      query += ` AND session_date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND session_date <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY session_date DESC`;

    const sessions = await db.query(query, params);

    res.json({
      status: 'success',
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   POST /api/workouts/create-weekly-program
 * @desc    สร้าง weekly program (จะเรียก sp_create_weekly_program)
 * @access  Private
 */
router.post('/create-weekly-program', async (req, res) => {
  try {
    const { user_id, goal, body_type } = req.body;

    if (!user_id || !goal || !body_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: user_id, goal, body_type'
      });
    }

    // เรียก procedure
    const result = await db.query(
      `CALL sp_create_weekly_program(?, ?, ?)`,
      [user_id, goal, body_type]
    );

    // ดึงข้อมูล program ที่สร้าง
    const program = await db.query(
      `SELECT * FROM workout_programs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user_id]
    );

    // ดึง sessions
    const sessions = await db.query(
      `SELECT * FROM workout_sessions 
       WHERE program_id = ?`,
      [program[0].id]
    );

    res.json({
      status: 'success',
      message: 'Weekly program created successfully',
      data: {
        program: program[0],
        sessions: sessions
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   GET /api/workouts/progress/:userId
 * @desc    ดึงความคืบหน้า workout จาก view
 * @access  Private
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const progress = await db.query(
      `SELECT * FROM v_workout_progress WHERE user_id = ?`,
      [userId]
    );

    if (!progress.length) {
      return res.json({
        status: 'success',
        data: {
          user_id: userId,
          days_active: 0,
          total_workouts_completed: 0,
          total_minutes: 0,
          total_calories_burned: 0,
          last_workout_date: null,
          weeks_active: 0
        }
      });
    }

    res.json({
      status: 'success',
      data: progress[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   GET /api/workouts/today/:userId
 * @desc    ดึง workout ของวันนี้
 * @access  Private
 */
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const todayWorkouts = await db.query(
      `SELECT * FROM workout_sessions 
       WHERE user_id = ? AND session_date = CURDATE()
       ORDER BY created_at`,
      [userId]
    );

    const todayProgress = await db.query(
      `SELECT * FROM progress_daily 
       WHERE user_id = ? AND progress_date = CURDATE()`,
      [userId]
    );

    res.json({
      status: 'success',
      data: {
        workouts: todayWorkouts,
        progress: todayProgress[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   PUT /api/workouts/sessions/:sessionId
 * @desc    อัปเดต workout session
 * @access  Private
 */
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration_min, estimated_calories, exercises_json, notes } = req.body;

    await db.query(
      `UPDATE workout_sessions 
       SET duration_min = ?, 
           estimated_calories = ?,
           exercises_json = ?,
           notes = ?
       WHERE id = ?`,
      [duration_min, estimated_calories, exercises_json, notes, sessionId]
    );

    const updated = await db.query(
      `SELECT * FROM workout_sessions WHERE id = ?`,
      [sessionId]
    );

    res.json({
      status: 'success',
      message: 'Session updated',
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   DELETE /api/workouts/sessions/:sessionId
 * @desc    ลบ workout session
 * @access  Private
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await db.query(
      `DELETE FROM workout_sessions WHERE id = ?`,
      [sessionId]
    );

    res.json({
      status: 'success',
      message: 'Session deleted'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   GET /api/workouts/weekly-stats/:userId
 * @desc    ดึงสถิติ weekly ของผู้ใช้
 * @access  Private
 */
router.get('/weekly-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const weeklyStats = await db.query(
      `SELECT 
        DATE_TRUNC('week', session_date) as week,
        COUNT(DISTINCT session_date) as days_active,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_workouts,
        SUM(CASE WHEN completed THEN duration_min ELSE 0 END) as total_minutes,
        SUM(CASE WHEN completed THEN estimated_calories ELSE 0 END) as total_calories
      FROM workout_sessions
      WHERE user_id = ? AND session_date >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY DATE_TRUNC('week', session_date)
      ORDER BY week DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      data: weeklyStats
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
