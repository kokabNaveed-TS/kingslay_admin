const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendSignupConfirmationToUser, sendSignupNotificationToAdmin } = require('../emailService');
require('dotenv').config();

const COOKIE = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

// ── POST /api/auth/signup ─────────────────────────────────
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required.' });
  if (!['admin','operation_manager','store_manager','staff'].includes(role))
    return res.status(400).json({ message: 'Invalid role.' });
  if (username.trim().length < 3)
    return res.status(400).json({ message: 'Username must be at least 3 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Invalid email address.' });
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return res.status(400).json({ message: 'Password must be 8+ chars with uppercase and number.' });
  try {
    const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
    if (ex.length) return res.status(409).json({ message: 'Email already in use.' });
    const hash = await bcrypt.hash(password, 12);
    const [r] = await db.query(
      'INSERT INTO users (username,email,password,role,is_active) VALUES (?,?,?,?,false)',
      [username.trim(), email.toLowerCase(), hash, role]
    );
    Promise.all([
      sendSignupConfirmationToUser({ username: username.trim(), email: email.toLowerCase(), role }),
      sendSignupNotificationToAdmin({ username: username.trim(), email: email.toLowerCase(), role }),
    ]).catch(e => console.error('Email error:', e.message));
    res.status(201).json({ message: 'Account created. Awaiting admin activation.', user: { id: r.insertId, username: username.trim(), email: email.toLowerCase(), role, is_active: false } });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const [rows] = await db.query(
      'SELECT id,username,email,phone,role,password,is_active,assigned_tools,created_at FROM users WHERE email=?',
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(401).json({ message: 'No account found with this email.' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ message: 'Incorrect password.' });
    let assignedTools = [];
    try { assignedTools = JSON.parse(user.assigned_tools || '[]'); } catch {}
    const { password: _, ...safe } = user;
    safe.assignedTools = assignedTools;
    res.cookie('token', sign(safe), COOKIE);
    res.json({ user: safe });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,username,email,phone,role,is_active,assigned_tools,created_at FROM users WHERE id=?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const user = rows[0];
    let assignedTools = [];
    try { assignedTools = JSON.parse(user.assigned_tools || '[]'); } catch {}
    user.assignedTools = assignedTools;
    res.json({ user });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

module.exports = router;