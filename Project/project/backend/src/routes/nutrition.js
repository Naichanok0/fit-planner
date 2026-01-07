// backend/src/routes/nutrition.js
const express = require('express');

module.exports = function buildNutritionRoutes(q) {
  const router = express.Router();

  // POST /nutrition/log - บันทึกมื้ออาหาร
  router.post('/log', async (req, res, next) => {
    try {
      const {
        user_id,
        log_date,
        meal_id, // breakfast, lunch, dinner, snack_1, snack_2
        planned_time,
        calories,
        foods_json
      } = req.body;

      // บันทึกหรืออัปเดตมื้ออาหาร (ON DUPLICATE KEY UPDATE)
      await q(`
        INSERT INTO nutrition_logs 
        (user_id, log_date, meal_id, planned_time, calories, foods_json, completed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())
        ON DUPLICATE KEY UPDATE
          planned_time = VALUES(planned_time),
          calories = VALUES(calories),
          foods_json = VALUES(foods_json)
      `, [
        user_id,
        log_date || new Date().toISOString().split('T')[0],
        meal_id,
        planned_time,
        calories,
        JSON.stringify(foods_json || {})
      ]);

      res.json({
        success: true,
        message: 'Nutrition log saved successfully'
      });
    } catch (e) { 
      next(e); 
    }
  });

  // PUT /nutrition/log/:userId/:date/:mealId/complete - ทำเครื่องหมายว่ากินเสร็จแล้ว
  router.put('/log/:userId/:date/:mealId/complete', async (req, res, next) => {
    try {
      const { userId, date, mealId } = req.params;
      
      const result = await q(`
        UPDATE nutrition_logs 
        SET completed = TRUE 
        WHERE user_id = ? AND log_date = ? AND meal_id = ?
      `, [userId, date, mealId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Nutrition log not found' });
      }

      res.json({
        success: true,
        message: 'Meal marked as completed'
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /nutrition/logs/:userId - ดึงประวัติการกิน
  router.get('/logs/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { 
        date_from, 
        date_to, 
        limit = 50, 
        offset = 0 
      } = req.query;

      let whereClause = 'WHERE user_id = ?';
      let params = [userId];

      if (date_from) {
        whereClause += ' AND log_date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND log_date <= ?';
        params.push(date_to);
      }

      const logs = await q(`
        SELECT 
          *,
          CASE WHEN completed THEN 'Completed' ELSE 'Planned' END as status
        FROM nutrition_logs 
        ${whereClause}
        ORDER BY log_date DESC, 
          FIELD(meal_id, 'breakfast', 'lunch', 'dinner', 'snack_1', 'snack_2')
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        data: logs
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /nutrition/daily/:userId/:date - ข้อมูลการกินรายวัน
  router.get('/daily/:userId/:date?', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const date = req.params.date || new Date().toISOString().split('T')[0];

      // ดึงมื้ออาหารทั้งหมดในวันนั้น
      const dailyLogs = await q(`
        SELECT * FROM nutrition_logs 
        WHERE user_id = ? AND log_date = ?
        ORDER BY FIELD(meal_id, 'breakfast', 'lunch', 'dinner', 'snack_1', 'snack_2')
      `, [userId, date]);

      // สถิติรายวัน
      const [dailyStats] = await q(`
        SELECT 
          COUNT(*) as total_meals_planned,
          SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as meals_completed,
          SUM(calories) as total_calories_planned,
          SUM(CASE WHEN completed = TRUE THEN calories ELSE 0 END) as calories_consumed
        FROM nutrition_logs 
        WHERE user_id = ? AND log_date = ?
      `, [userId, date]);

      res.json({
        success: true,
        data: {
          date,
          meals: dailyLogs,
          stats: dailyStats
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /nutrition/weekly-summary/:userId - สรุปโภชนาการรายสัปดาห์
  router.get('/weekly-summary/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const weeklySummary = await q(`
        SELECT 
          log_date,
          COUNT(*) as total_meals_planned,
          SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as meals_completed,
          ROUND((SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as completion_percentage,
          SUM(calories) as calories_planned,
          SUM(CASE WHEN completed = TRUE THEN calories ELSE 0 END) as calories_consumed
        FROM nutrition_logs 
        WHERE user_id = ? 
          AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY log_date
        ORDER BY log_date ASC
      `, [userId]);

      res.json({
        success: true,
        data: weeklySummary
      });
    } catch (e) { 
      next(e); 
    }
  });

  // DELETE /nutrition/log/:userId/:date/:mealId - ลบมื้ออาหาร
  router.delete('/log/:userId/:date/:mealId', async (req, res, next) => {
    try {
      const { userId, date, mealId } = req.params;

      const result = await q(`
        DELETE FROM nutrition_logs 
        WHERE user_id = ? AND log_date = ? AND meal_id = ?
      `, [userId, date, mealId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Nutrition log not found' });
      }

      res.json({
        success: true,
        message: 'Nutrition log deleted successfully'
      });
    } catch (e) { 
      next(e); 
    }
  });

  // GET /nutrition/recommendations/:userId - คำแนะนำโภชนาการ
  router.get('/recommendations/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;

      // ดึงข้อมูลผู้ใช้และเป้าหมาย
      const [user] = await q(`
        SELECT goal, gender, age, fitness_level
        FROM users 
        WHERE id = ?
      `, [userId]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // คำนวณแคลอรี่ที่แนะนำตามเป้าหมาย
      let recommendedCalories;
      let mealPlan = {};

      switch (user.goal) {
        case 'weight-loss':
          recommendedCalories = 1500; // หรือคำนวณตาม BMR
          mealPlan = {
            breakfast: { calories: 300, description: 'โปรตีนสูง คาร์บต่ำ' },
            lunch: { calories: 500, description: 'ผักใบเขียว โปรตีนเนื้อขาว' },
            dinner: { calories: 400, description: 'ผักและโปรตีน' },
            snack_1: { calories: 150, description: 'ผลไม้หรือถั่ว' },
            snack_2: { calories: 150, description: 'โยเกิร์ตไขมันต่ำ' }
          };
          break;
        case 'muscle-gain':
          recommendedCalories = 2500;
          mealPlan = {
            breakfast: { calories: 600, description: 'โปรตีนและคาร์บซับซ้อน' },
            lunch: { calories: 700, description: 'เนื้อแดง ข้าว ผัก' },
            dinner: { calories: 600, description: 'ปลา หรือไก่ กับข้าว' },
            snack_1: { calories: 300, description: 'เวย์โปรตีน กล้วย' },
            snack_2: { calories: 300, description: 'ถั่วหรือเนื้อ' }
          };
          break;
        default: // maintenance
          recommendedCalories = 2000;
          mealPlan = {
            breakfast: { calories: 400, description: 'สมดุลโปรตีนและคาร์บ' },
            lunch: { calories: 600, description: 'มื้อหลักสมดุล' },
            dinner: { calories: 500, description: 'ผักและโปรตีน' },
            snack_1: { calories: 250, description: 'ขนมเพื่อสุขภาพ' },
            snack_2: { calories: 250, description: 'ผลไม้หรือถั่ว' }
          };
      }

      res.json({
        success: true,
        data: {
          user_goal: user.goal,
          recommended_daily_calories: recommendedCalories,
          meal_plan: mealPlan,
          tips: [
            'ดื่มน้ำ 8-10 แก้วต่อวัน',
            'กินผักผลไม้หลากหลายสี',
            'เลือกโปรตีนไขมันต่ำ',
            'หลีกเลี่ยงน้ำตาลทราย'
          ]
        }
      });
    } catch (e) { 
      next(e); 
    }
  });

  return router;
};