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

// expose pool and jwt secrets to routes via req.app.get(...)
app.set('db', pool);
app.set('jwt.access', process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me');
app.set('jwt.refresh', process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me');

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
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

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
