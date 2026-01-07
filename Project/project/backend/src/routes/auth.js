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
      await q(
        `INSERT INTO users (email, password_hash, first_name, last_name, age, gender, fitness_level, goal, join_date, last_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [email, hash, firstName || null, lastName || null, age || null, gender || null, fitnessLevel || null, goal || null]
      );

      // Get the newly created user
      const users = await q('SELECT id FROM users WHERE email=?', [email]);
      const user = { id: users[0].id, email };
      
      const access  = signAccess(user);
      const refresh = signRefresh(user);
      
      // Insert refresh token with expires_at (30 days from now)
      const expiresAt = new Date(Date.now() + REFRESH_TTL * 1000).toISOString().slice(0, 19).replace('T', ' ');
      await q('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, refresh, expiresAt]);

      res.json({ user: { id: user.id, email, firstName, lastName, age, gender, fitnessLevel, goal }, accessToken: access, refreshToken: refresh });
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
      
      // Insert refresh token with expires_at (30 days from now)
      const expiresAt = new Date(Date.now() + REFRESH_TTL * 1000).toISOString().slice(0, 19).replace('T', ' ');
      await q('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, refresh, expiresAt]);

      res.json({
        user: {
          id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
          age: u.age, gender: u.gender, fitnessLevel: u.fitness_level, goal: u.goal
        },
        accessToken: access, refreshToken: refresh
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

  // GET /auth/me - ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  router.get('/me', async (req, res, next) => {
    try {
      // ดึง token จาก Authorization header
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = auth.slice(7);
      let payload;
      try {
        payload = jwt.verify(token, ACCESS_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userId = Number(payload.sub);
      const rows = await q(`
        SELECT id, email, first_name, last_name, age, gender, 
               fitness_level, goal, phone, profile_picture, 
               join_date, last_login 
        FROM users WHERE id=?
      `, [userId]);

      if (!rows.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = rows[0];
      res.json({
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        age: user.age,
        gender: user.gender,
        fitnessLevel: user.fitness_level,
        goal: user.goal,
        phone: user.phone,
        profilePicture: user.profile_picture,
        joinDate: user.join_date,
        lastLogin: user.last_login
      });
    } catch (e) { 
      next(e); 
    }
  });

  // PATCH /auth/me - อัพเดทข้อมูลผู้ใช้
  router.patch('/me', async (req, res, next) => {
    try {
      // ดึง token จาก Authorization header
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = auth.slice(7);
      let payload;
      try {
        payload = jwt.verify(token, ACCESS_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userId = Number(payload.sub);
      const { firstName, lastName, age, gender, fitnessLevel, goal, phone } = req.body;

      // อัพเดทข้อมูลที่ส่งมา
      const updates = [];
      const values = [];
      
      if (firstName !== undefined) { updates.push('first_name=?'); values.push(firstName); }
      if (lastName !== undefined) { updates.push('last_name=?'); values.push(lastName); }
      if (age !== undefined) { updates.push('age=?'); values.push(age); }
      if (gender !== undefined) { updates.push('gender=?'); values.push(gender); }
      if (fitnessLevel !== undefined) { updates.push('fitness_level=?'); values.push(fitnessLevel); }
      if (goal !== undefined) { updates.push('goal=?'); values.push(goal); }
      if (phone !== undefined) { updates.push('phone=?'); values.push(phone); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(userId);
      await q(`UPDATE users SET ${updates.join(', ')} WHERE id=?`, values);

      // ส่งข้อมูลที่อัพเดทแล้วกลับ
      const rows = await q(`
        SELECT id, email, first_name, last_name, age, gender, 
               fitness_level, goal, phone, profile_picture, 
               join_date, last_login 
        FROM users WHERE id=?
      `, [userId]);

      const user = rows[0];
      res.json({
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        age: user.age,
        gender: user.gender,
        fitnessLevel: user.fitness_level,
        goal: user.goal,
        phone: user.phone,
        profilePicture: user.profile_picture,
        joinDate: user.join_date,
        lastLogin: user.last_login
      });
    } catch (e) { 
      next(e); 
    }
  });

  return router;
};
