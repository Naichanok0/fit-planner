// server.js  (DROP-IN REPLACEMENT)
// ========== BOOT ==========
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// (ถ้าต้องการให้ frontend ทดสอบข้าม origin ได้ง่าย)
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(cors({ origin: '*', credentials: true })); // ปรับ origin ตามโดเมน frontend ของคุณ

// ========== DB POOL ==========
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

// helper: prepared query
async function q(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

// ========== UTILS ==========
/** map JS 0..6(Sun..Sat) -> 1..7(Mon..Sun) */
function todayDowMon1() {
  const jsDay = new Date().getDay(); // 0..6
  return ((jsDay + 6) % 7) + 1; // 1..7
}

// ถ้าจะใช้ตรวจ param ฝั่ง body (ตอนนี้เราเลิกใช้ userId แล้ว)
function requireParam(value, name) {
  if (value === undefined || value === null || value === '') {
    const err = new Error(`Missing required: ${name}`);
    err.status = 400;
    throw err;
  }
}

// ========== AUTH ==========
const authRoutes = require('./routes/auth');        // สมัคร / ล็อกอิน / รีเฟรช / ล็อกเอาต์
const { authRequired } = require('./middleware/auth'); // middleware ตรวจ JWT

// ========== ROUTES ==========

// Health (Frontend: ใช้เช็คว่าบริการขึ้นไหม)
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'FitLife Planner API' });
});

// Auth Routes
// FRONTEND:
// - POST /auth/register  -> สมัคร, รับ {user, access, refresh}
// - POST /auth/login     -> ล็อกอิน, รับ {user, access, refresh}
// - POST /auth/refresh   -> รับ access ใหม่ เมื่อ 401
// - POST /auth/logout    -> ล็อกเอาต์ (ลบ refresh server-side)
app.use('/auth', authRoutes(q));

// ========== BUSINESS ROUTES ==========

// 1) Exercises (แคตาล็อกท่าออกกำลังกาย)
// FRONTEND: GET /exercises (public หรือจะล็อกอินก็ได้ ถ้าต้องการให้ user เฉพาะเห็น ให้ใส่ authRequired)
app.get('/exercises', async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT id, name, muscle_group AS muscleGroup, mets
       FROM exercises
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// 2) Active plan ของ "ผู้ใช้ที่ล็อกอินอยู่"
// FRONTEND: GET /plans/active  + Header: Authorization: Bearer <access>
app.get('/plans/active', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id; // << เปลี่ยนจาก ?userId= มาใช้ JWT
    const rows = await q(
      `SELECT id AS planId, title
       FROM workout_plans
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'No active plan' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// 3) ท่าออกกำลังของ "วันนี้" สำหรับผู้ใช้ที่ล็อกอิน
// FRONTEND: GET /workouts/today  + Header: Authorization: Bearer <access>
app.get('/workouts/today', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
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
  } catch (err) { next(err); }
});

// 4) ดึงทั้งสัปดาห์
// FRONTEND: GET /workouts/week  + Header: Authorization: Bearer <access>
app.get('/workouts/week', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;

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
  } catch (err) { next(err); }
});

// 5) บันทึกผลการทำจริง (Session/Workout log)
// FRONTEND: POST /sessions  + Header: Authorization: Bearer <access>
// body: { exerciseId, sets?, reps?, durationMin?, calories?, notes?, performedAt? }
app.post('/sessions', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      exerciseId,
      sets = null,
      reps = null,
      durationMin = null,
      calories = null,
      notes = null,
      performedAt = null, // 'YYYY-MM-DD HH:mm:ss' ถ้าไม่ส่ง จะใช้ NOW()
    } = req.body;

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
  } catch (err) { next(err); }
});

// 6) Progress กราฟ น้ำหนัก/BMI ของผู้ใช้ที่ล็อกอิน
// FRONTEND: GET /progress  + Header: Authorization: Bearer <access>
app.get('/progress', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
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
  } catch (err) { next(err); }
});

// ========== ERROR ==========
app.use((err, req, res, next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Internal Server Error' });
});

// ========== START ==========
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`✅ FitLife Planner API running on http://localhost:${port}`);
});
