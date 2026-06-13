const jwt = require('jsonwebtoken');
require('dotenv').config();

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated. Please sign in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authenticated."
    });
  }

  // Real admin
  if (
    ["admin", "operation_manager"].includes(
      req.user.role
    )
  ) {
    return next();
  }

  // Impersonated user whose original account was admin
  if (
    req.user.impersonating &&
    req.user.originalUser &&
    ["admin", "operation_manager"].includes(
      req.user.originalUser.role
    )
  ) {
    return next();
  }

  return res.status(403).json({
    message:
      "Access denied. Admin or Operation Manager required."
  });
}

module.exports = { requireAuth, requireAdmin };
