// export เป็น (q) => router
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = function buildAuthRoutes(q) {
  const router = express.Router();

  const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  const ACCESS_TTL  = Number(process.env.JWT_ACCESS_TTL  || 900);      // 15m
  const REFRESH_TTL = Number(process.env.JWT_REFRESH_TTL || 2592000);  // 30d

  const signAccess  = (user) => jwt.sign(
    { email: user.email }, ACCESS_SECRET,  { expiresIn: ACCESS_TTL,  subject: String(user.id) }
  );
  const signRefresh = (user) => jwt.sign(
    { type: 'refresh' },  REFRESH_SECRET, { expiresIn: REFRESH_TTL, subject: String(user.id) }
  );

  // POST /auth/register
  router.post('/register', async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, age, gender, fitnessLevel='standard', goal } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email/password required' });

      const exists = await q('SELECT id FROM users WHERE email=?', [email]);
      if (exists.length) return res.status(409).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      const r = await q(
        `INSERT INTO users (email, password_hash, first_name, last_name, age, gender, fitness_level, goal, join_date, last_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [email, hash, firstName || null, lastName || null, age || null, gender || null, fitnessLevel || null, goal || null]
      );

      const user = { id: r.insertId, email };
      const access  = signAccess(user);
      const refresh = signRefresh(user);
      await q('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [user.id, refresh]);

      res.json({ user: { id: user.id, email, firstName, lastName, age, gender, fitnessLevel, goal }, access, refresh });
    } catch (e) { next(e); }
  });

  // POST /auth/login
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const rows = await q('SELECT * FROM users WHERE email=?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const u = rows[0];
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      await q('UPDATE users SET last_login=NOW() WHERE id=?', [u.id]);

      const user = { id: u.id, email: u.email };
      const access  = signAccess(user);
      const refresh = signRefresh(user);
      await q('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [user.id, refresh]);

      res.json({
        user: {
          id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
          age: u.age, gender: u.gender, fitnessLevel: u.fitness_level, goal: u.goal
        },
        access, refresh
      });
    } catch (e) { next(e); }
  });

  // POST /auth/refresh
  router.post('/refresh', async (req, res, next) => {
    try {
      const { refresh } = req.body;
      if (!refresh) return res.status(400).json({ error: 'Missing refresh token' });

      const rows = await q('SELECT user_id FROM refresh_tokens WHERE token=?', [refresh]);
      if (!rows.length) return res.status(401).json({ error: 'Refresh revoked' });

      let payload;
      try { payload = jwt.verify(refresh, REFRESH_SECRET); }
      catch { return res.status(401).json({ error: 'Invalid refresh' }); }

      const user = { id: Number(payload.sub) };
      const access = signAccess({ id: user.id, email: '' });
      res.json({ access });
    } catch (e) { next(e); }
  });

  // POST /auth/logout
  router.post('/logout', async (req, res, next) => {
    try {
      const { refresh } = req.body;
      if (refresh) await q('DELETE FROM refresh_tokens WHERE token=?', [refresh]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // (เสริมให้เข้ากับ frontend เดิม) — mock ส่งเมล/รีเซ็ตรหัสผ่าน
  router.post('/forgot', async (req, res) => {
    // ปกติจะสร้าง token แล้วส่งอีเมล; ตอนนี้ตอบ ok เฉย ๆ ให้ flow เดินได้
    res.json({ ok: true });
  });

  router.post('/reset', async (req, res, next) => {
    try {
      const { email, password } = req.body; // simplified
      if (!email || !password) return res.status(400).json({ error: 'email/password required' });
      const rows = await q('SELECT id FROM users WHERE email=?', [email]);
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      const hash = await bcrypt.hash(password, 10);
      await q('UPDATE users SET password_hash=? WHERE email=?', [hash, email]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
};
