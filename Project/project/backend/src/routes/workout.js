// backend/src/routes/workout.js
const express = require('express');

module.exports = function buildWorkoutRoutes(q) {
  const router = express.Router();

  // POST /workout/session - บันทึก workout session
  router.post('/session', async (req, res, next) => {
    try {
      const {
        user_id,
        program_id,
        day_code,
        session_date,
        duration_min,
        estimated_calories,
        exercises_json,
        form_feedback_json,
        notes
      } = req.body;

      // บันทึก workout session
      const result = await q(`
        INSERT INTO workout_sessions 
        (user_id, program_id, day_code, session_date, duration_min, estimated_calories, 
         exercises_json, form_feedback_json, notes, completed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())
      `, [
        user_id, 
        program_id, 
        day_code, 
        session_date || new Date().toISOString().split('T')[0],
        duration_min,
        estimated_calories,
        JSON.stringify(exercises_json || {}),
        JSON.stringify(form_feedback_json || {}),
        notes
      ]);

      res.json({
        success: true,
        message: 'Workout session created successfully',
        session_id: result.insertId
      });
    } catch (e) { 
      next(e); 
    }
  });

  // PUT /workout/session/:sessionId/complete - ทำเครื่องหมายว่า workout เสร็จสิ้น
  router.put('/session/:sessionId/complete', async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { 
        duration_min, 
        estimated_calories, 
        exercises_json, 
        form_feedback_json,
        notes 
      } = req.body;

      // อัปเดต session เป็น completed = TRUE
      // Trigger tr_workout_completed จะทำงานอัตโนมัติเพื่ออัปเดต progress_daily
      await q(`
        UPDATE workout_sessions 
        SET completed = TRUE,
            duration_min = COALESCE(?, duration_min),
            estimated_calories = COALESCE(?, estimated_calories),
            exercises_json = COALESCE(?, exercises_json),
            form_feedback_json = COALESCE(?, form_feedback_json),
            notes = COALESCE(?, notes)
        WHERE id = ?
      `, [
        duration_min,
        estimated_calories, 
        exercises_json ? JSON.stringify(exercises_json) : null,
        form_feedback_json ? JSON.stringify(form_feedback_json) : null,
        notes,
        sessionId
      ]);

      // ดึงข้อมูล session ที่อัปเดตแล้ว
      const [session] = await q(
        'SELECT * FROM workout_sessions WHERE id = ?', 
        [sessionId]
      );

      if (!session) {
        return res.status(404).json({ error: 'Workout session not found' });
      }

      res.json({
        success: true,
        message: 'Workout completed successfully',
        data: session
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /workout/sessions/:userId - ดึง workout sessions ของผู้ใช้
  router.get('/sessions/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { 
        limit = 20, 
        offset = 0, 
        program_id, 
        completed,
        date_from,
        date_to 
      } = req.query;

      let whereClause = 'WHERE user_id = ?';
      let params = [userId];

      if (program_id) {
        whereClause += ' AND program_id = ?';
        params.push(program_id);
      }

      if (completed !== undefined) {
        whereClause += ' AND completed = ?';
        params.push(completed === 'true');
      }

      if (date_from) {
        whereClause += ' AND session_date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND session_date <= ?';
        params.push(date_to);
      }

      const sessions = await q(`
        SELECT 
          *,
          CASE WHEN completed THEN 'Completed' ELSE 'Pending' END as status
        FROM workout_sessions 
        ${whereClause}
        ORDER BY session_date DESC, created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);

      // นับจำนวน sessions ทั้งหมด
      const [countResult] = await q(`
        SELECT COUNT(*) as total 
        FROM workout_sessions 
        ${whereClause}
      `, params);

      res.json({
        success: true,
        data: sessions,
        pagination: {
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countResult.total > (parseInt(offset) + sessions.length)
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /workout/session/:sessionId - ดึงข้อมูล session เฉพาะ
  router.get('/session/:sessionId', async (req, res, next) => {
    try {
      const { sessionId } = req.params;

      const [session] = await q(
        'SELECT * FROM workout_sessions WHERE id = ?', 
        [sessionId]
      );

      if (!session) {
        return res.status(404).json({ error: 'Workout session not found' });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (e) { 
      next(e); 
    }
  });

  // DELETE /workout/session/:sessionId - ลบ workout session
  router.delete('/session/:sessionId', async (req, res, next) => {
    try {
      const { sessionId } = req.params;

      const result = await q(
        'DELETE FROM workout_sessions WHERE id = ?', 
        [sessionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Workout session not found' });
      }

      res.json({
        success: true,
        message: 'Workout session deleted successfully'
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /workout/today/:userId - workout วันนี้
  router.get('/today/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const todaySessions = await q(`
        SELECT * FROM workout_sessions 
        WHERE user_id = ? 
          AND DATE(session_date) = CURDATE()
        ORDER BY created_at ASC
      `, [userId]);

      // สถิติวันนี้
      const [todayStats] = await q(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_sessions,
          SUM(CASE WHEN completed = TRUE THEN duration_min ELSE 0 END) as total_minutes,
          SUM(CASE WHEN completed = TRUE THEN estimated_calories ELSE 0 END) as calories_burned
        FROM workout_sessions 
        WHERE user_id = ? 
          AND DATE(session_date) = CURDATE()
      `, [userId]);

      res.json({
        success: true,
        data: {
          sessions: todaySessions,
          stats: todayStats
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  return router;
};