// backend/src/routes/dashboard.js
const express = require('express');

module.exports = function buildDashboardRoutes(q) {
  const router = express.Router();

  // GET /api/dashboard/:userId - ข้อมูล Dashboard ของผู้ใช้
  router.get('/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ใช้ View v_user_dashboard ที่สร้างไว้ใน schema
      const dashboardData = await q(
        'SELECT * FROM v_user_dashboard WHERE id = ?', 
        [userId]
      );

      if (!dashboardData.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // เพิ่มข้อมูล BMI Category โดยใช้ Function
      const userDashboard = dashboardData[0];
      if (userDashboard.bmi) {
        const [bmiResult] = await q(
          'SELECT fn_get_bmi_category(?) as bmi_category',
          [userDashboard.bmi]
        );
        userDashboard.bmi_category = bmiResult.bmi_category;
      }

      res.json({
        success: true,
        data: userDashboard
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /api/dashboard/workout-progress/:userId - ความก้าวหน้าการออกกำลังกาย
  router.get('/workout-progress/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ใช้ View v_workout_progress
      const progressData = await q(
        'SELECT * FROM v_workout_progress WHERE user_id = ?', 
        [userId]
      );

      if (!progressData.length) {
        return res.status(404).json({ error: 'No workout data found' });
      }

      res.json({
        success: true,
        data: progressData[0]
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /api/dashboard/streak/:userId - คำนวณ streak ปัจจุบัน
  router.get('/streak/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ใช้ Function fn_calculate_streak
      const [streakResult] = await q(
        'SELECT fn_calculate_streak(?) as current_streak',
        [userId]
      );

      res.json({
        success: true,
        data: {
          user_id: userId,
          current_streak: streakResult.current_streak
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  // POST /api/dashboard/progress/:userId - อัปเดต Progress รายวัน
  router.post('/progress/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { date } = req.body;
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // ใช้ Stored Procedure sp_update_daily_progress
      const progressResult = await q(
        'CALL sp_update_daily_progress(?, ?)',
        [userId, targetDate]
      );

      res.json({
        success: true,
        message: 'Daily progress updated successfully',
        data: progressResult[0][0] // ผลลัพธ์จาก SP
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /api/dashboard/report/:userId - สร้างรายงานความก้าวหน้า
  router.get('/report/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { days = 7 } = req.query;
      
      // ใช้ Stored Procedure sp_generate_progress_report
      const reportResult = await q(
        'CALL sp_generate_progress_report(?, ?)',
        [userId, parseInt(days)]
      );

      res.json({
        success: true,
        data: {
          summary: reportResult[0][0], // รายงานสรุป
          workouts: reportResult[1]    // รายละเอียด workout
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /dashboard/weekly-stats/:userId - สถิติรายสัปดาห์
  router.get('/weekly-stats/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ข้อมูลสถิติ 7 วันย้อนหลัง
      const weeklyData = await q(`
        SELECT 
          DATE(session_date) as workout_date,
          DAYNAME(session_date) as day_name,
          COUNT(*) as total_sessions,
          SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_sessions,
          SUM(CASE WHEN completed = TRUE THEN duration_min ELSE 0 END) as total_minutes,
          SUM(CASE WHEN completed = TRUE THEN estimated_calories ELSE 0 END) as total_calories
        FROM workout_sessions 
        WHERE user_id = ? 
          AND session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(session_date), DAYNAME(session_date)
        ORDER BY workout_date ASC
      `, [userId]);

      res.json({
        success: true,
        data: weeklyData
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /dashboard/body-measurements/:userId - ประวัติการวัดร่างกาย
  router.get('/body-measurements/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;
      
      const measurements = await q(`
        SELECT 
          id,
          height_cm,
          weight_kg,
          bmi,
          fn_get_bmi_category(bmi) as bmi_category,
          body_fat_percentage,
          muscle_mass_kg,
          body_type,
          created_at
        FROM body_measurements 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [userId, parseInt(limit)]);

      res.json({
        success: true,
        data: measurements
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /api/dashboard/streak/:userId - ดึงข้อมูล streak
  router.get('/streak/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ใช้ Function fn_calculate_streak
      const [streakResult] = await q(
        'SELECT fn_calculate_streak(?) as current_streak',
        [userId]
      );

      res.json({
        success: true,
        data: {
          currentStreak: streakResult.current_streak || 0,
          userId: userId
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /api/dashboard/weekly-stats/:userId - ดึงสถิติสัปดาห์
  router.get('/weekly-stats/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // ดึงสถิติ 7 วันย้อนหลัง
      const weeklyStats = await q(`
        SELECT 
          COUNT(DISTINCT ws.session_date) as workout_days,
          COUNT(DISTINCT CASE WHEN ws.completed = TRUE THEN ws.session_date END) as completed_days,
          COALESCE(SUM(CASE WHEN ws.completed = TRUE THEN ws.estimated_calories END), 0) as total_calories,
          COALESCE(SUM(CASE WHEN ws.completed = TRUE THEN ws.duration_min END), 0) as total_minutes,
          COALESCE(AVG(CASE WHEN ws.completed = TRUE THEN ws.duration_min END), 0) as avg_duration
        FROM workout_sessions ws
        WHERE ws.user_id = ? 
          AND ws.session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `, [userId]);

      res.json({
        success: true,
        data: weeklyStats[0] || {
          workout_days: 0,
          completed_days: 0, 
          total_calories: 0,
          total_minutes: 0,
          avg_duration: 0
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  return router;
};