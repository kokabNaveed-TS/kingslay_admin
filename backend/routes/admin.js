const router    = require('express').Router();
const bcrypt    = require('bcryptjs');
const db        = require('../db');
const ALL_TOOLS = require('../toolsList');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  sendAccountActivated, sendAccountDeactivated,
 sendToolsUpdated,
} = require('../emailService');

router.use(requireAuth, requireAdmin);

const VALID_ROLES = ['admin','operation_manager','store_manager','staff'];

// ── GET /api/admin/users ──────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,username,email,phone,role,is_active,assigned_tools,created_at FROM users ORDER BY created_at DESC'
    );
    res.json({
      users: rows.map(u => {
        let assigned_tools = [];
        try { assigned_tools = JSON.parse(u.assigned_tools || '[]'); } catch {}
        return { ...u, assigned_tools };
      })
    });
  } catch (e) {
    console.error('GET /users:', e.message);
    res.status(500).json({ message: 'Failed to load users.' });
  }
});

// ── POST /api/admin/users ─────────────────────────────────
// Admin creates a user directly (with role, active status)
router.post('/users', async (req, res) => {
  const { username, email, phone, password, role, is_active } = req.body;

  if (!username || !email || !password || !role)
    return res.status(400).json({ message: 'Username, email, password and role are required.' });
  if (!VALID_ROLES.includes(role))
    return res.status(400).json({ message: 'Invalid role.' });
  if (username.trim().length < 3)
    return res.status(400).json({ message: 'Username must be at least 3 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Invalid email address.' });
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return res.status(400).json({ message: 'Password: 8+ chars, uppercase, number.' });

  try {
    const [ex] = await db.query(
      'SELECT id FROM users WHERE email=?',
      [email.toLowerCase()]
    );
    if (ex.length) return res.status(409).json({ message: 'Email already in use.' });

    const hash = await bcrypt.hash(password, 12);
    const tools = role === 'staff' ? JSON.stringify([1,6,10,15]) : JSON.stringify([]);
    const active = is_active ? true : false;

    const [r] = await db.query(
      'INSERT INTO users (username,email,phone,password,role,is_active,assigned_tools) VALUES (?,?,?,?,?,?,?)',
      [username.trim(), email.toLowerCase(), phone?.trim() || '', hash, role, active, tools]
    );

    if (active) {
      const toolNames = role === 'store_manager' ? ALL_TOOLS.filter(t => [1,6,10,15].includes(t.id)).map(t => t.name) : [];
      sendAccountActivated({ username: username.trim(), email: email.toLowerCase(), role, assignedTools: toolNames })
        .catch(e => console.error('Email error:', e.message));
    }

    res.status(201).json({ message: `User ${username.trim()} created successfully.`, userId: r.insertId });
  } catch (e) {
    console.error('POST /users:', e.message);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// ── PUT /api/admin/users/:id ──────────────────────────────
// Update username / email / phone
router.patch('/users/:id', async (req, res) => {
  const { username, email, phone } = req.body;
  const id = parseInt(req.params.id);

  if (!username?.trim() || username.trim().length < 3)
    return res.status(400).json({ message: 'Username must be at least 3 characters.' });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return res.status(400).json({ message: 'Valid email is required.' });

  try {
    const [ex] = await db.query(
      'SELECT id FROM users WHERE email=? AND id!=?',
      [email.toLowerCase(), id]
    );
    if (ex.length) return res.status(409).json({ message: 'Email already in use.' });

    await db.query(
      'UPDATE users SET username=?, email=?, phone=? WHERE id=?',
      [username.trim(), email.toLowerCase(), phone?.trim() || '', id]
    );
    res.json({ message: 'User updated successfully.' });
  } catch (e) {
    console.error('PATCH /users/:id:', e.message);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// ── POST /api/admin/users/:id/activate ───────────────────
// Activate + assign role + tools in one action
router.patch('/users/:id/activate', async (req, res) => {
  const { role, toolIds } = req.body;
  const id = parseInt(req.params.id);

  if (!role || !VALID_ROLES.includes(role))
    return res.status(400).json({ message: 'A valid role is required to activate.' });

  try {
    const [rows] = await db.query('SELECT id,username,email FROM users WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];

    // Build tool list — only relevant for staff
    let tools = [];
    if (role === 'store_manager') {
      const validIds = ALL_TOOLS.map(t => t.id);
      tools = Array.isArray(toolIds) && toolIds.length
        ? toolIds.map(Number).filter(x => validIds.includes(x))
        : [1,6,10,15];
    }

    await db.query(
      'UPDATE users SET is_active=TRUE, role=?, assigned_tools=? WHERE id=?',
      [role, JSON.stringify(tools), id]
    );

    const toolNames = ALL_TOOLS.filter(t => tools.includes(t.id)).map(t => t.name);
    sendAccountActivated({ username: u.username, email: u.email, role, assignedTools: toolNames })
      .catch(e => console.error('Activation email:', e.message));

    res.json({ message: `${u.username} activated as ${role}.` });
  } catch (e) {
    console.error('PATCH /activate:', e.message);
    res.status(500).json({ message: 'Activation failed.' });
  }
});

// ── PATCH /api/admin/users/:id/deactivate ────────────────
router.patch('/users/:id/deactivate', async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id)
    return res.status(400).json({ message: 'You cannot deactivate your own account.' });

  try {
    const [rows] = await db.query('SELECT id,username,email FROM users WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];

    await db.query('UPDATE users SET is_active=FALSE WHERE id=?', [id]);
    sendAccountDeactivated({ username: u.username, email: u.email })
      .catch(e => console.error('Deactivation email:', e.message));

    res.json({ message: `${u.username} deactivated.` });
  } catch (e) {
    console.error('PATCH /deactivate:', e.message);
    res.status(500).json({ message: 'Failed to deactivate.' });
  }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────
// Change role of an existing user
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const id = parseInt(req.params.id);

  if (!role || !VALID_ROLES.includes(role))
    return res.status(400).json({ message: `Valid role required. Got: "${role}"` });
  if (id === req.user.id)
    return res.status(400).json({ message: 'You cannot change your own role.' });

  try {
    const [rows] = await db.query(
      'SELECT id,username,email,assigned_tools FROM users WHERE id=?', [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];

    let existingTools = [];
    try { existingTools = JSON.parse(u.assigned_tools || '[]'); } catch {}

    // Auto-assign defaults if switching to store_manager with no tools
    const newTools = (role === 'store_manager' && !existingTools.length)
      ? [1,6,10,15]
      : (role === 'store_manager' ? existingTools : []);

    await db.query(
      'UPDATE users SET role=?, assigned_tools=? WHERE id=?',
      [role, JSON.stringify(newTools), id]
    );

    // sendRoleChanged({ username: u.username, email: u.email, newRole: role })
    //   .catch(e => console.error('Role change email:', e.message));

    res.json({ message: `${u.username}'s role updated to ${role}.` });
  } catch (e) {
    console.error('PATCH /role:', e.message);
    res.status(500).json({ message: 'Failed to update role.' });
  }
});

// ── PUT /api/admin/users/:id/tools ───────────────────────
// Assign / update tools for a staff member
router.put('/users/:id/tools', async (req, res) => {
  const { toolIds } = req.body;
  const id = parseInt(req.params.id);

  if (!Array.isArray(toolIds))
    return res.status(400).json({ message: 'toolIds must be an array of numbers.' });

  const validIds = ALL_TOOLS.map(t => t.id);
  const parsed   = toolIds.map(Number);
  const bad      = parsed.filter(x => !validIds.includes(x));
  if (bad.length)
    return res.status(400).json({ message: `Invalid tool IDs: ${bad.join(', ')}` });

  try {
    const [rows] = await db.query(
      'SELECT id,username,email,role FROM users WHERE id=?', [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];

    if (u.role !== 'store_manager')
      return res.status(403).json({ message: 'Tools can only be assigned to store managers.' });

    await db.query('UPDATE users SET assigned_tools=? WHERE id=?', [JSON.stringify(parsed), id]);

    const names = ALL_TOOLS.filter(t => parsed.includes(t.id)).map(t => t.name);
    sendToolsUpdated({ username: u.username, email: u.email, assignedTools: names })
      .catch(e => console.error('Tools email:', e.message));

    res.json({ message: 'Tools updated successfully.', assignedTools: parsed });
  } catch (e) {
    console.error('PUT /tools:', e.message);
    res.status(500).json({ message: 'Failed to update tools.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────
router.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id)
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    await db.query('DELETE FROM users WHERE id=?', [id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (e) {
    console.error('DELETE /users/:id:', e.message);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

module.exports = router;