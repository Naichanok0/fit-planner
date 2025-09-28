const jwt = require('jsonwebtoken');

function signAccess(user) {
  // payload: {sub=id, email}
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: Number(process.env.JWT_ACCESS_TTL || 900) } // seconds
  );
}

function signRefresh(user) {
  // payload: {sub=id}
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: Number(process.env.JWT_REFRESH_TTL || 2592000) }
  );
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
