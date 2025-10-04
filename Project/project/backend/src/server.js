const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mysql.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

/* Middlewares */
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(cors({ origin: '*', credentials: true })); // ปรับ origin ตอน deploy

/* MySQL Pool */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'planner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// helper query
async function q(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

/* Utils */
function todayDowMon1(d = new Date()) { const js = d.getDay(); return ((js + 6) % 7) + 1; }
function requireParam(value, name) {
  if (value === undefined || value === null || value === '') {
    const err = new Error(`Missing required: ${name}`); err.status = 400; throw err;
  }
}

/* Health */
app.get('/health', (_req, res) => res.json({ ok: true, service: 'FitLife Planner API' }));
app.get('/db/health', async (_req, res, next) => {
  try { const [row] = await q('SELECT 1 AS ok'); res.json({ db: 'ok', ping: row.ok }); }
  catch (e) { next(e); }
});

/* Auth routes */
const authRoutes = require('./routes/auth'); // export เป็น (q) => router
app.use('/auth', authRoutes(q));

/* (ตัวอย่าง) Routes ที่ต้อง login */
let authRequired;
try { ({ authRequired } = require('./middleware/auth')); }
catch { authRequired = (_req, _res, next) => next(); } // ไม่มีไฟล์ ก็ผ่านไปก่อน

app.get('/exercises', async (_req, res, next) => {
  try {
    const rows = await q(
      `SELECT id, name, muscle_group AS muscleGroup, mets
       FROM exercises ORDER BY name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/plans/active', authRequired, async (req, res, next) => {
  try {
    const userId = req.user?.id; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await q(
      `SELECT id AS planId, title
       FROM workout_plans WHERE user_id=? AND is_active=1 LIMIT 1`, [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'No active plan' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

app.get('/workouts/today', authRequired, async (req, res, next) => {
  try {
    const userId = req.user?.id; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const dow = todayDowMon1();
    const rows = await q(
      `SELECT i.day_of_week AS dayOfWeek,i.order_no AS orderNo,e.id AS exerciseId,
              e.name,e.muscle_group AS muscleGroup,e.mets,i.sets,i.reps,i.duration_min AS durationMin
       FROM workout_plans p
       JOIN workout_plan_items i ON i.plan_id=p.id
       JOIN exercises e          ON e.id=i.exercise_id
       WHERE p.user_id=? AND p.is_active=1 AND i.day_of_week=? 
       ORDER BY i.order_no`, [userId, dow]
    );
    res.json({ dayOfWeek: dow, items: rows });
  } catch (e) { next(e); }
});

app.get('/workouts/week', authRequired, async (req, res, next) => {
  try {
    const userId = req.user?.id; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await q(
      `SELECT i.day_of_week AS dayOfWeek,i.order_no AS orderNo,e.id AS exerciseId,
              e.name,e.muscle_group AS muscleGroup,e.mets,i.sets,i.reps,i.duration_min AS durationMin
       FROM workout_plans p
       JOIN workout_plan_items i ON i.plan_id=p.id
       JOIN exercises e          ON e.id=i.exercise_id
       WHERE p.user_id=? AND p.is_active=1
       ORDER BY i.day_of_week,i.order_no`, [userId]
    );
    const byDay = {};
    for (const r of rows) {
      (byDay[r.dayOfWeek] ||= []).push({
        order: r.orderNo, exerciseId: r.exerciseId, name: r.name,
        muscle: r.muscleGroup, mets: r.mets, sets: r.sets, reps: r.reps, durationMin: r.durationMin
      });
    }
    res.json(byDay);
  } catch (e) { next(e); }
});

app.post('/sessions', authRequired, async (req, res, next) => {
  try {
    const userId = req.user?.id; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { exerciseId, sets=null, reps=null, durationMin=null, calories=null, notes=null, performedAt=null } = req.body;
    requireParam(exerciseId, 'exerciseId');
    const sql = performedAt
      ? `INSERT INTO workout_sessions (user_id,exercise_id,performed_at,sets,reps,duration_min,calories_burned,notes)
         VALUES (?,?,?,?,?,?,?,?)`
      : `INSERT INTO workout_sessions (user_id,exercise_id,performed_at,sets,reps,duration_min,calories_burned,notes)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`;
    const params = performedAt
      ? [userId, exerciseId, performedAt, sets, reps, durationMin, calories, notes]
      : [userId, exerciseId, sets, reps, durationMin, calories, notes];
    const r = await q(sql, params);
    res.status(201).json({ ok: true, sessionId: r.insertId });
  } catch (e) { next(e); }
});

app.get('/progress', authRequired, async (req, res, next) => {
  try {
    const userId = req.user?.id; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await q(
      `SELECT measure_date AS date, weight_kg AS weightKg, bmi
       FROM progress_metrics WHERE user_id=? ORDER BY measure_date`, [userId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/* Error handler */
app.use((err, _req, res, _next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Internal Server Error' });
});

/* Start */
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`✅ FitLife Planner API running on http://localhost:${port}`));
