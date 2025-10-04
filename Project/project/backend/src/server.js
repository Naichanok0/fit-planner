// backend/src/server.js
// --- Robust dotenv loader: รองรับ UTF-8/UTF-16LE และอักขระเพี้ยน ---
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, 'mysql.env');
let result = dotenv.config({ path: envPath });
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
// ---------------------------------------------------------------------

const express = require('express');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

/* Middlewares */
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ✅ อนุญาต frontend ที่พอร์ต 3000 (แก้ได้ผ่าน ENV ถ้าต้องการ)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

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

/* Health */
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

/* Auth routes */
const authRoutes = require('./routes/auth'); // export: (q) => router
app.use('/auth', authRoutes(q));

/* ตัวอย่าง route เพิ่มเติม (optional) */
let authRequired;
try {
  ({ authRequired } = require('./middleware/auth'));
} catch {
  authRequired = (_req, _res, next) => next();
}

/* Error handler */
app.use((err, _req, res, _next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Internal Server Error' });
});

/* Start
   ✅ ตั้งค่า default เป็น 3001 (กันชนกับเว็บ 3000 เสมอ)
   สามารถ override ได้ด้วย ENV: PORT=4000 node server.js
*/
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () =>
  console.log(`✅ FitLife Planner API running on http://localhost:${PORT}`)
);
