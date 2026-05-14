const router   = require("express").Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../db");

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days
};

// ── Helper: sign JWT ──────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ── Helper: verify JWT from cookie ───────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

// ── POST /api/auth/signup ─────────────────────────────────
router.post("/signup", async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  // Basic server-side validation
  if (!username || !email || !phone || !password || !role)
    return res.status(400).json({ message: "All fields are required." });

  const allowed = ["admin","manager","analyst","operations","marketing"];
  if (!allowed.includes(role))
    return res.status(400).json({ message: "Invalid role." });

  try {
    // Check duplicates
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: "Email or username already in use." });

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert
    const [result] = await db.query(
      "INSERT INTO users (username, email, phone, password, role) VALUES (?,?,?,?,?)",
      [username, email, phone, hash, role]
    );

    const user = { id: result.insertId, username, email, role };
    res.cookie("token", signToken(user), COOKIE_OPTS);
    res.status(201).json({ user });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, password FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: "No account found with this email." });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Incorrect password." });

    const { password: _, ...safeUser } = user;
    res.cookie("token", signToken(safeUser), COOKIE_OPTS);
    res.json({ user: safeUser });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found." });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out." });
});

module.exports = router;
module.exports.requireAuth = requireAuth;