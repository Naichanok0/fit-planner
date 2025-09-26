// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// ---------- MySQL Pool ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'Planner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// helper: run query with prepared statements
async function q(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

// ---------- Utils ----------
/** map MySQL DAYOFWEEK => 1=Mon..7=Sun */
function todayDowMon1() {
  // JS: 0=Sun..6=Sat → mapให้เป็น 1=Mon..7=Sun
  const jsDay = new Date().getDay(); // 0..6
  return ((jsDay + 6) % 7) + 1; // 1..7
}

/** simple required check */
function requireParam(value, name) {
  if (value === undefined || value === null || value === '') {
    const err = new Error(`Missing required: ${name}`);
    err.status = 400;
    throw err;
  }
}

// ---------- Routes ----------

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'FitLife Planner API' });
});

// 1) Exercises (รายการท่าออกกำลังกาย)
app.get('/exercises', async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT id, name, muscle_group AS muscleGroup, mets
       FROM exercises
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 2) Active plan ของผู้ใช้ (Q1)
app.get('/plans/active', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId);
    requireParam(userId, 'userId');

    const rows = await q(
      `SELECT id AS planId, title
       FROM workout_plans
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No active plan' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// 3) ท่าออกกำลังของ "วันนี้" (Q2)
app.get('/workouts/today', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId);
    requireParam(userId, 'userId');

    // เราใช้ฝั่ง JS คำนวณ day_of_week แบบ 1=Mon..7=Sun เพื่อ cache/ทดสอบง่าย
    const dow = todayDowMon1();

    const rows = await q(
      `SELECT i.day_of_week   AS dayOfWeek,
              i.order_no      AS orderNo,
              e.id            AS exerciseId,
              e.name,
              e.muscle_group  AS muscleGroup,
              e.mets,
              i.sets,
              i.reps,
              i.duration_min  AS durationMin
       FROM workout_plans p
       JOIN workout_plan_items i ON i.plan_id = p.id
       JOIN exercises e          ON e.id = i.exercise_id
       WHERE p.user_id = ?
         AND p.is_active = 1
         AND i.day_of_week = ?
       ORDER BY i.order_no`,
      [userId, dow]
    );

    res.json({ dayOfWeek: dow, items: rows });
  } catch (err) {
    next(err);
  }
});

// 4) ดึงทั้งสัปดาห์ (เสริมจาก Q2)
app.get('/workouts/week', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId);
    requireParam(userId, 'userId');

    const rows = await q(
      `SELECT i.day_of_week   AS dayOfWeek,
              i.order_no      AS orderNo,
              e.id            AS exerciseId,
              e.name,
              e.muscle_group  AS muscleGroup,
              e.mets,
              i.sets,
              i.reps,
              i.duration_min  AS durationMin
       FROM workout_plans p
       JOIN workout_plan_items i ON i.plan_id = p.id
       JOIN exercises e          ON e.id = i.exercise_id
       WHERE p.user_id = ?
         AND p.is_active = 1
       ORDER BY i.day_of_week, i.order_no`,
      [userId]
    );

    // group by day_of_week เป็น JSON
    const byDay = {};
    for (const r of rows) {
      if (!byDay[r.dayOfWeek]) byDay[r.dayOfWeek] = [];
      byDay[r.dayOfWeek].push({
        order: r.orderNo,
        exerciseId: r.exerciseId,
        name: r.name,
        muscle: r.muscleGroup,
        mets: r.mets,
        sets: r.sets,
        reps: r.reps,
        durationMin: r.durationMin,
      });
    }
    res.json(byDay);
  } catch (err) {
    next(err);
  }
});

// 5) บันทึกผลการทำจริง (Q3)
app.post('/sessions', async (req, res, next) => {
  try {
    const {
      userId,
      exerciseId,
      sets = null,
      reps = null,
      durationMin = null,
      calories = null,
      notes = null,
      performedAt = null, // optional: YYYY-MM-DD HH:mm:ss (ถ้าไม่ส่งมา จะใช้ NOW())
    } = req.body;

    requireParam(userId, 'userId');
    requireParam(exerciseId, 'exerciseId');

    const sql = performedAt
      ? `INSERT INTO workout_sessions
            (user_id, exercise_id, performed_at, sets, reps, duration_min, calories_burned, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO workout_sessions
            (user_id, exercise_id, performed_at, sets, reps, duration_min, calories_burned, notes)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`;

    const params = performedAt
      ? [userId, exerciseId, performedAt, sets, reps, durationMin, calories, notes]
      : [userId, exerciseId, sets, reps, durationMin, calories, notes];

    const result = await q(sql, params);
    res.status(201).json({ ok: true, sessionId: result.insertId });
  } catch (err) {
    next(err);
  }
});

// 6) Progress สำหรับกราฟ (Q4)
app.get('/progress', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId);
    requireParam(userId, 'userId');

    const rows = await q(
      `SELECT measure_date AS date,
              weight_kg    AS weightKg,
              bmi
       FROM progress_metrics
       WHERE user_id = ?
       ORDER BY measure_date`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({
    error: err.message || 'Internal Server Error',
  });
});

// ---------- Start ----------
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`✅ FitLife Planner API running on http://localhost:${port}`);
});
