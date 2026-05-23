const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendAccountActivatedEmail, sendAccountDeactivatedEmail, sendToolsUpdatedEmail } = require('../emailService');
const ALL_TOOLS = require('../toolsList');

router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id,username,email,phone,role,is_active,assigned_tools,created_at FROM users ORDER BY created_at DESC');
    res.json({
      users: users.map(u => {
        let assignedTools = [];
        try { assignedTools = JSON.parse(u.assigned_tools || '[]'); } catch { }
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at,
          assignedTools: assigned_tools,
        };
      })
    });
  } catch (e) { res.status(500).json({ message: 'Failed to load users.' }); }
});
// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,username,email,role,assigned_tools FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];
    if (!['staff', 'user'].includes(u.role)) return res.status(403).json({ message: 'Cannot toggle this role.' });
    let tools = [];
    try { tools = JSON.parse(u.assigned_tools || '[]'); } catch { }
    if (u.role === 'staff' && tools.length === 0) {
      tools = [1, 6, 10, 15];
      await db.query('UPDATE users SET is_active=true,assigned_tools=? WHERE id=?', [JSON.stringify(tools), req.params.id]);
    } else {
      await db.query('UPDATE users SET is_active=true WHERE id=?', [req.params.id]);
    }
    const toolNames = ALL_TOOLS.filter(t => tools.includes(t.id)).map(t => t.name);
    sendAccountActivatedEmail({ username: u.username, email: u.email, role: u.role, assignedTools: toolNames }).catch(e => console.error(e.message));
    res.json({ message: `${u.username} activated.` });
  } catch (e) { res.status(500).json({ message: 'Failed to activate user.' }); }
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,username,email,role FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];
    if (!['staff', 'user'].includes(u.role)) return res.status(403).json({ message: 'Cannot toggle this role.' });
    await db.query('UPDATE users SET is_active=false WHERE id=?', [req.params.id]);
    sendAccountDeactivatedEmail({ username: u.username, email: u.email }).catch(e => console.error(e.message));
    res.json({ message: `${u.username} deactivated.` });
  } catch (e) { res.status(500).json({ message: 'Failed to deactivate user.' }); }
});

// PUT /api/admin/users/:id/tools
router.put('/users/:id/tools', async (req, res) => {
  const { toolIds } = req.body;
  if (!Array.isArray(toolIds)) return res.status(400).json({ message: 'toolIds must be an array.' });
  const validIds = ALL_TOOLS.map(t => t.id);
  const bad = toolIds.filter(id => !validIds.includes(id));
  if (bad.length) return res.status(400).json({ message: `Invalid tool IDs: ${bad.join(', ')}` });
  try {
    const [rows] = await db.query('SELECT id,username,email,role FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    if (rows[0].role !== 'staff') return res.status(403).json({ message: 'Modules can only be assigned to staff.' });
    await db.query('UPDATE users SET assigned_tools=? WHERE id=?', [JSON.stringify(toolIds), req.params.id]);
    const names = ALL_TOOLS.filter(t => toolIds.includes(t.id)).map(t => t.name);
    sendToolsUpdatedEmail({ username: rows[0].username, email: rows[0].email, assignedTools: names }).catch(e => console.error(e.message));
    res.json({ message: 'Modules updated.', assignedTools: toolIds });
  } catch (e) { res.status(500).json({ message: 'Failed to update modules.' }); }
});

module.exports = router;
