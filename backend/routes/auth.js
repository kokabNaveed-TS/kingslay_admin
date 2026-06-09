const router = require('express').Router();
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendSignupConfirmationToUser, sendSignupNotificationToAdmin, sendPasswordReset } = require('../emailService');
require('dotenv').config();

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

// ── POST /api/auth/signup ─────────────────────────────────
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  // if (!['admin','operation_manager','store_manager','staff'].includes(role))
  //   return res.status(400).json({ message: 'Invalid role.' });
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
      'INSERT INTO users (username,email,password,is_active) VALUES (?,?,?,false)',
      [username.trim(), email.toLowerCase(), hash]
    );
    Promise.all([
      sendSignupConfirmationToUser({ username: username.trim(), email: email.toLowerCase() }),
      sendSignupNotificationToAdmin({ username: username.trim(), email: email.toLowerCase() }),
    ]).catch(e => console.error('Email error:', e.message));
    res.status(201).json({ message: 'Account created. Awaiting admin activation.', user: { id: r.insertId, username: username.trim(), email: email.toLowerCase(), is_active: false } });
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
    try { assignedTools = JSON.parse(user.assigned_tools || '[]'); } catch { }
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
    try { assignedTools = JSON.parse(user.assigned_tools || '[]'); } catch { }
    user.assignedTools = assignedTools;
    res.json({ user });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
});

// ── POST /api/auth/forgot-password ───────────────────────
// Step 1: user submits email → receive reset link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email?.trim())
    return res.status(400).json({ message: 'Email address is required.' });

  try {
    const [rows] = await db.query(
      'SELECT id, username, email FROM users WHERE email=?',
      [email.trim().toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (!rows.length)
      return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const u = rows[0];

    // Generate a secure random token (64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store hashed token in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    // await db.query(
    //   'UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?',
    //   [tokenHash, expiry, u.id]
    // );
    await db.query(
      `UPDATE users
   SET reset_token=?, reset_token_expiry=DATE_ADD(NOW(), INTERVAL 15 MINUTE)
   WHERE id=?`,
      [tokenHash, u.id]
    );

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(u.email)}`;

    await sendPasswordReset({ username: u.username, email: u.email, resetUrl });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    console.error('Forgot password error:', e.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────
// Step 2: user clicks link → submits new password
router.post('/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword)
    return res.status(400).json({ message: 'Token, email and new password are required.' });

  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
    return res.status(400).json({ message: 'Password: 8+ chars, uppercase, number.' });

  try {
    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await db.query(
      `SELECT id, username FROM users
       WHERE email=? AND reset_token=? AND reset_token_expiry > NOW()`,
      [email.trim().toLowerCase(), tokenHash]
    );

    if (!rows.length)
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });

    const u = rows[0];
    const hash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?',
      [hash, u.id]
    );

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (e) {
    console.error('Reset password error:', e.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});


module.exports = router;