const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../services/jwt');

function authRoutes(q) {
  const r = Router();

  // === REGISTER ===
  // 📌 FRONTEND: POST /auth/register
  // body: {email, password, full_name, gender?, birth_date?, height_cm?}
  // success: { user:{id,email}, access, refresh }
  r.post('/register',
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').isLength({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, full_name, gender = null, birth_date = null, height_cm = null } = req.body;

      const exists = await q('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
      if (exists.length) return res.status(409).json({ error: 'Email already registered' });

      const passHash = await hashPassword(password);
      const result = await q(
        `INSERT INTO users (email, password_hash, full_name, gender, birth_date, height_cm)
         VALUES (?,?,?,?,?,?)`,
        [email, passHash, full_name, gender, birth_date, height_cm]
      );

      const user = { id: result.insertId, email };
      const access = signAccess(user);
      const refresh = signRefresh(user);

      const [rTTL] = await q('SELECT NOW() + INTERVAL ? SECOND AS exp', [Number(process.env.JWT_REFRESH_TTL || 2592000)]);
      await q(`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?,?,?)`,
        [user.id, refresh, rTTL.exp]);

      res.status(201).json({ user: { id: user.id, email }, access, refresh });
    } catch (e) { next(e); }
  });

  // === LOGIN ===
  // 📌 FRONTEND: POST /auth/login
  // body: {email, password}
  // success: { user, access, refresh }
  r.post('/login',
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const rows = await q(`SELECT id, email, password_hash FROM users WHERE email=? LIMIT 1`, [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const u = rows[0];
      const ok = await comparePassword(password, u.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const access = signAccess({ id: u.id, email: u.email });
      const refresh = signRefresh({ id: u.id });

      const [rTTL] = await q('SELECT NOW() + INTERVAL ? SECOND AS exp', [Number(process.env.JWT_REFRESH_TTL || 2592000)]);
      await q(`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?,?,?)`, [u.id, refresh, rTTL.exp]);

      res.json({ user: { id: u.id, email: u.email }, access, refresh });
    } catch (e) { next(e); }
  });

  // === REFRESH ACCESS TOKEN ===
  // 📌 FRONTEND: POST /auth/refresh
  // body: {refresh}
  // success: { access }
  r.post('/refresh', body('refresh').isString(), async (req, res, next) => {
    try {
      const { refresh } = req.body;
      // ตรวจว่ามีอยู่ใน DB และยังไม่หมดอายุ
      const rows = await q(`SELECT user_id, expires_at FROM user_tokens WHERE token=? LIMIT 1`, [refresh]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid refresh token' });
      if (new Date(rows[0].expires_at) < new Date()) {
        await q('DELETE FROM user_tokens WHERE token=?', [refresh]);
        return res.status(401).json({ error: 'Refresh token expired' });
      }
      // ตรวจลายเซ็นรีเฟรช
      let payload;
      try { payload = verifyRefresh(refresh); } catch { return res.status(401).json({ error: 'Invalid refresh token' }); }

      const access = signAccess({ id: rows[0].user_id, email: undefined });
      res.json({ access });
    } catch (e) { next(e); }
  });

  // === LOGOUT ===
  // 📌 FRONTEND: POST /auth/logout
  // body: {refresh} → server ลบ refresh, ฝั่ง client ล้าง token ทั้งหมด
  r.post('/logout', body('refresh').isString(), async (req, res, next) => {
    try {
      const { refresh } = req.body;
      await q('DELETE FROM user_tokens WHERE token=?', [refresh]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
}

module.exports = authRoutes;
