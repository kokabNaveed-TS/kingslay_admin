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
  if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });
  if (!['admin','operation_manager'].includes(req.user.role))
    return res.status(403).json({ message: 'Access denied. Admin or Operation Manager required.' });
  next();
}

module.exports = { requireAuth, requireAdmin };
