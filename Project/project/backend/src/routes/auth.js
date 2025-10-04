// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = function buildAuthRoutes(q) {
  const router = express.Router();

  function signAccess(user) {
    return jwt.sign(
      { email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: Number(process.env.JWT_ACCESS_TTL || 900), subject: String(user.id) }
    );
  }
  function signRefresh(user) {
    const token = jwt.sign(
      { type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: Number(process.env.JWT_REFRESH_TTL || 2592000), subject: String(user.id) }
    );
    return token;
  }

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
        [email, hash, firstName, lastName, age || null, gender || null, fitnessLevel, goal || null]
      );
      const user = { id: r.insertId, email };
      const access = signAccess(user);
      const refresh = signRefresh(user);
      await q('INSERT INTO refresh_tokens (user_id, token) VALUES (?,?)', [user.id, refresh]);
      res.status(201).json({ user, access, refresh });
    } catch (e) { next(e); }
  });

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
      const access = signAccess(user);
      const refresh = signRefresh(user);
      await q('INSERT INTO refresh_tokens (user_id, token) VALUES (?,?)', [user.id, refresh]);
      res.json({ user, access, refresh });
    } catch (e) { next(e); }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const { refresh } = req.body;
      if (!refresh) return res.status(400).json({ error: 'Missing refresh token' });

      const rows = await q('SELECT user_id FROM refresh_tokens WHERE token=?', [refresh]);
      if (!rows.length) return res.status(401).json({ error: 'Refresh revoked' });

      let payload;
      try {
        payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid refresh' });
      }
      const user = { id: Number(payload.sub) };
      const access = signAccess(user);
      res.json({ access });
    } catch (e) { next(e); }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      const { refresh } = req.body;
      if (refresh) await q('DELETE FROM refresh_tokens WHERE token=?', [refresh]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
};
