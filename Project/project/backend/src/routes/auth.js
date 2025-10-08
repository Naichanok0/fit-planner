// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { authRequired } = require('../middleware/auth');

// helper: query ด้วย pool จาก app
async function q(req, sql, params = []) {
  const pool = req.app.get('db');
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function signTokens(req, user) {
  const accessSecret = req.app.get('jwt.access');
  const refreshSecret = req.app.get('jwt.refresh');

  const access = jwt.sign(
    { sub: user.id, email: user.email, typ: 'access' },
    accessSecret,
    { expiresIn: '1h' }
  );
  const refresh = jwt.sign(
    { sub: user.id, email: user.email, typ: 'refresh' },
    refreshSecret,
    { expiresIn: '30d' }
  );
  return { access, refresh };
}

/**
 * POST /auth/register
 * body: {
 *   email, password,
 *   first_name / firstName,
 *   last_name / lastName,
 *   age, gender,
 *   fitness_level / fitnessLevel,
 *   goal
 * }
 */
router.post('/register', async (req, res, next) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password;

    // ✅ รองรับทั้ง snake_case และ camelCase
    const first_name    = req.body.first_name ?? req.body.firstName ?? null;
    const last_name     = req.body.last_name  ?? req.body.lastName  ?? null;
    const age           = req.body.age ?? null;
    const gender        = req.body.gender ?? null;
    const fitness_level = req.body.fitness_level ?? req.body.fitnessLevel ?? 'standard';
    const goal          = req.body.goal ?? null;

    if (!email || !password) {
      return res.status(400).json({ error: 'email/password required' });
    }

    // ตรวจซ้ำอีเมล
    const exists = await q(req, 'SELECT id FROM users WHERE email=?', [email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // เข้ารหัสรหัสผ่าน
    const hash = await bcrypt.hash(password, 10);

    // ✅ ใส่คอลัมน์ first_name / last_name และฟิลด์อื่นๆ ครบ
    const result = await q(
      req,
      `INSERT INTO users
        (email, password_hash, first_name, last_name, age, gender, fitness_level, goal, join_date, last_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [email, hash, first_name, last_name, age, gender, fitness_level, goal]
    );

    const user = { id: result.insertId, email };
    const { access, refresh } = signTokens(req, user);

    // เก็บ refresh token
    await q(req, 'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [
      user.id,
      refresh
    ]);

    // ส่งกลับ (คง snake_case ให้ตรงกับ DB/ฟรอนต์)
    res.json({
      user: {
        id: user.id,
        email,
        first_name,
        last_name,
        age,
        gender,
        fitness_level,
        goal
      },
      access,
      refresh
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password;
    if (!email || !password) {
      return res.status(400).json({ error: 'email/password required' });
    }

    const rows = await q(
      req,
      `SELECT id, email, password_hash, first_name, last_name, age, gender, fitness_level, goal
       FROM users WHERE email=?`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'invalid credentials' });

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const user = { id: u.id, email: u.email };
    const { access, refresh } = signTokens(req, user);

    await q(req, 'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [
      user.id,
      refresh
    ]);

    // อัปเดต last_login
    await q(req, 'UPDATE users SET last_login = NOW() WHERE id=?', [user.id]);

    res.json({
      user: {
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        age: u.age,
        gender: u.gender,
        fitness_level: u.fitness_level,
        goal: u.goal
      },
      access,
      refresh
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/token
 * body: { refresh }
 * ออก access token ใหม่จาก refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: 'Missing refresh token' });

    // ตรวจว่า token ยังอยู่ในตาราง refresh_tokens
    const rows = await q(req, 'SELECT user_id FROM refresh_tokens WHERE token=?', [refresh]);
    if (!rows.length) return res.status(401).json({ error: 'Refresh revoked' });

    const refreshSecret = req.app.get('jwt.refresh');
    let payload;
    try {
      payload = jwt.verify(refresh, refreshSecret);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh' });
    }

    const user = { id: Number(payload.sub), email: payload.email };
    const { access } = signTokens(req, user);
    res.json({ access });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 * คืนข้อมูลผู้ใช้จาก DB (ต้องมี Authorization header)
 */
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await q(req, 'SELECT id, email, first_name, last_name, age, gender, fitness_level, goal, phone, profile_picture, join_date, last_login FROM users WHERE id = ?', [uid]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

/**
 * POST /auth/logout
 * body: { refresh }
 */
router.post('/logout', async (req, res, next) => {
  try {
    const refresh = req.body.refresh;
    if (refresh) {
      await q(req, 'DELETE FROM refresh_tokens WHERE token=?', [refresh]);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /auth/me
 * body: partial user fields (first_name, last_name, age, gender, fitness_level, goal, phone, profile_picture)
 */
router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const allowed = ['first_name','last_name','age','gender','fitness_level','goal','phone','profile_picture'];
    const updates = [];
    const params = [];
    for (const key of allowed) {
      // accept either snake_case or camelCase in body
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (Object.prototype.hasOwnProperty.call(req.body, key) || Object.prototype.hasOwnProperty.call(req.body, camel)) {
        const val = req.body[key] ?? req.body[camel];
        updates.push(`${key} = ?`);
        params.push(val);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No updatable fields' });

    params.push(uid);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await q(req, sql, params);

    const rows = await q(req, 'SELECT id, email, first_name, last_name, age, gender, fitness_level, goal, phone, profile_picture, join_date, last_login FROM users WHERE id = ?', [uid]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// helper to convert camelCase to snake_case for request body mapping
function camelToSnake(s) {
  return s.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
}

module.exports = router;
