const { verifyAccess } = require('../services/jwt');

// 📌 FRONTEND: เวลาเรียก API ที่ต้อง login
// ต้องแนบ header: Authorization: Bearer <access_token>
function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Authorization' });

  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authRequired };
