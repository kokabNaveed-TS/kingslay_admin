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
  sameSite: 'none',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

// ── POST /api/auth/signup ─────────────────────────────────
router.post('/signup', async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  if (!username || !email || !phone || !password || !role)
    return res.status(400).json({ message: 'All fields are required.' });
  if (!['admin','operation_manager','staff','user'].includes(role))
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
      'INSERT INTO users (username,email,phone,password,role,is_active) VALUES (?,?,?,?,?,false)',
      [username.trim(), email.toLowerCase(), phone.trim(), hash, role]
    );
    Promise.all([
      sendSignupConfirmationToUser({ username: username.trim(), email: email.toLowerCase(), role }),
      sendSignupNotificationToAdmin({ username: username.trim(), email: email.toLowerCase(), phone: phone.trim(), role }),
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

// const router = require("express").Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const db = require("../db");
// const {
//   sendSignupConfirmationToUser,
//   sendSignupNotificationToAdmin,
// } = require("../emailService");

// // ── Cookie config ─────────────────────────────────────
// const COOKIE_OPTS = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
// };

// // ── JWT Sign ──────────────────────────────────────────
// function signToken(user) {
//   return jwt.sign(
//     {
//       id: user.id,
//       role: user.role,
//       username: user.username,
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );
// }

// // ── AUTH MIDDLEWARE ───────────────────────────────────
// function requireAuth(req, res, next) {
//   const token = req.cookies?.token;

//   if (!token) {
//     return res.status(401).json({ message: "Not authenticated. Please Sign In." });
//   }

//   try {
//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Session expired.Please Sign In Again." });
//   }
// }


// function requireAdmin(req, res, next) {
//   if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });
//   if (!['admin', 'operation_manager'].includes(req.user.role))
//     return res.status(403).json({ message: 'Access denied. Admin or Operation Manager required.' });
//   next();
// }

// // ── LOGIN ─────────────────────────────────────────────
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: "Email and password required" });
//   }

//   try {
//     const [rows] = await db.query(
//       `SELECT id, username, email, phone, role, password, is_active 
//        FROM users WHERE email = ?`,
//       [email]
//     );

//     if (!rows.length) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     const user = rows[0];

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     // remove password
//     const { password: _, ...safeUser } = user;

//     const token = signToken(safeUser);

//     res.cookie("token", token, COOKIE_OPTS);

//     return res.json({
//       user: safeUser,
//       message: "Login successful",
//     });

//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // ── SIGNUP ─────────────────────────────────────────────
// router.post("/signup", async (req, res) => {
//   const { username, email, phone, password, role } = req.body;

//   if (!username || !email || !phone || !password || !role) {
//     return res.status(400).json({ message: "All fields required" });
//   }

//   const allowedRoles = [
//     "admin",
//     "operation_manager",
//     "staff",
//     "user",
//   ];

//   if (!allowedRoles.includes(role)) {
//     return res.status(400).json({ message: "Invalid role" });
//   }

//   try {
//     const [existing] = await db.query(
//       "SELECT id FROM users WHERE email = ? OR username = ?",
//       [email, username]
//     );

//     if (existing.length) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     const [result] = await db.query(
//       `INSERT INTO users (username, email, phone, password, role, is_active)
//        VALUES (?,?,?,?,?,?)`,
//       [username, email, phone, hash, role, false]
//     );

//     const user = {
//       id: result.insertId,
//       username,
//       email,
//       role,
//       is_active: false,
//     };

//     res.cookie("token", signToken(user), COOKIE_OPTS);

//     // ── SEND EMAILS ─────────────────────────
//     try {
//       await sendSignupConfirmationToUser({
//         username,
//         email,
//         role,
//       });

//       await sendSignupNotificationToAdmin({
//         username,
//         email,
//         phone,
//         role,
//       });
//     } catch (mailErr) {
//       console.error("Mail error:", mailErr);
//     }

//     res.status(201).json({ user });

//   } catch (err) {
//     console.error("Signup error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // ── ME (LIVE DB SYNC - FIX FOR YOUR DASHBOARD) ─────────
// router.get("/me", requireAuth, async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT id, username, email, phone, role, is_active, created_at, assigned_tools
//        FROM users WHERE id = ?`,
//       [req.user.id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const user = rows[0];

//     // ── PARSE HERE ───────────────────────────────
//     let assignedTools = [];

//     try {
//       assignedTools =
//         typeof user.assigned_tools === "string"
//           ? JSON.parse(user.assigned_tools)
//           : user.assigned_tools || [];
//     } catch (e) {
//       assignedTools = [];
//     }

//     return res.json({
//       user: {
//         ...user,
//         assignedTools, // 👈 THIS is what frontend needs
//       },
//     });

//   } catch (err) {
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // ── LOGOUT ─────────────────────────────────────────────
// router.post("/logout", (req, res) => {
//   res.clearCookie("token");
//   res.json({ message: "Logged out" });
// });

// module.exports = router;
// module.exports.requireAuth = requireAuth;
// module.exports.requireAdmin = requireAdmin;