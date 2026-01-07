// backend/src/server.js
// ✅ Robust dotenv loader: รองรับ UTF-8 / UTF-16LE / ตรวจ env ครบ
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, 'mysql.env');
let result = dotenv.config({ path: envPath, override: true });

if (!result.parsed || Object.keys(result.parsed).length === 0) {
  try {
    const raw = fs.readFileSync(envPath, 'utf16le'); // fallback กรณีไฟล์เป็น UTF-16
    const parsed = dotenv.parse(raw);
    Object.assign(process.env, parsed);
    console.log('[env] loaded via UTF-16LE fallback:', Object.keys(parsed));
  } catch (e) {
    console.warn('[env] fallback failed:', e.message);
  }
}

// 🔍 ตรวจว่ามี env ครบ
function requireEnv(keys) {
  const miss = keys.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
  if (miss.length)
    throw new Error('❌ Missing env variable(s): ' + miss.join(', ') + ' — check mysql.env file');
}

requireEnv(['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME']);

console.log('[env] DB_HOST =', process.env.DB_HOST);
console.log('[env] DB_USER =', process.env.DB_USER);
console.log('[env] DB_NAME =', process.env.DB_NAME);
console.log('[env] DB_PASS length =', (process.env.DB_PASS || '').length);

// ---------------------------------------------------------------------

const express = require('express');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

/* 🧱 Middlewares */
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ✅ อนุญาต frontend ที่พอร์ต 3000 (แก้ได้ผ่าน ENV)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

/* 🗄️ MySQL Pool */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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

/* 🧩 Health Check */
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'FitLife Planner API' })
);

app.get('/db/health', async (_req, res, next) => {
  try {
    const [row] = await q('SELECT 1 AS ok');
    res.json({ db: 'ok', ping: row.ok });
  } catch (e) {
    next(e);
  }
});

/* 🔐 Auth Routes */
const authRoutes = require('./routes/auth'); // export: (q) => router
app.use('/auth', authRoutes(q));

/* 📊 Dashboard Routes */
try {
  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes(q));
  console.log('[routes] Dashboard routes loaded');
} catch (e) {
  console.warn('[routes] Dashboard routes not found:', e.message);
}

/* 💪 Workout Routes */
try {
  const workoutRoutes = require('./routes/workout');
  app.use('/api/workout', workoutRoutes(q));
  console.log('[routes] Workout routes loaded');
} catch (e) {
  console.warn('[routes] Workout routes not found:', e.message);
}

/* 🍎 Nutrition Routes */
try {
  const nutritionRoutes = require('./routes/nutrition');
  app.use('/api/nutrition', nutritionRoutes(q));
  console.log('[routes] Nutrition routes loaded');
} catch (e) {
  console.warn('[routes] Nutrition routes not found:', e.message);
}

/* 📈 Analysis Routes */
try {
  const analysisRoutes = require('./routes/analysis');
  app.use('/api/analysis', analysisRoutes(q));
  console.log('[routes] Analysis routes loaded');
} catch (e) {
  console.warn('[routes] Analysis routes not found:', e.message);
}

/* (Optional) Middleware ตัวอย่าง */
let authRequired;
try {
  ({ authRequired } = require('./middleware/auth'));
} catch {
  authRequired = (_req, _res, next) => next();
}

/* 🚨 Error Handler */
app.use((err, _req, res, _next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Internal Server Error' });
});

/* 🚀 Start Server — รอ DB พร้อมก่อนเปิด */
async function waitForDB() {
  for (let i = 1; i <= 15; i++) {
    try {
      const [row] = await q('SELECT 1 AS ok');
      console.log(`[db] ready: ${row.ok}`);
      return;
    } catch (e) {
      console.warn(`[db] retry ${i}/15: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('MySQL is not reachable. Check service/port/user/pass.');
}

const PORT = Number(process.env.PORT || 3001);

waitForDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`✅ FitLife Planner API running on http://localhost:${PORT}`)
    )
  )
  .catch(err => {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  });
