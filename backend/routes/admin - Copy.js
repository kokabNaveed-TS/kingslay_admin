const router = require('express').Router();
const db     = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendAccountActivatedEmail, sendAccountDeactivatedEmail, sendToolsUpdatedEmail } = require('../emailService');
const ALL_TOOLS = require('../toolsList');

router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id,username,email,phone,role,is_active,assigned_tools,created_at FROM users ORDER BY created_at DESC');
    res.json({ users: users.map(u => {
      let assigned_tools = [];
      try { assigned_tools = JSON.parse(u.assigned_tools || '[]'); } catch {}
      return { ...u, assigned_tools };
    })});
  } catch (e) { res.status(500).json({ message: 'Failed to load users.' }); }
});

// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,username,email,role,assigned_tools FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];
    if (!['staff','user'].includes(u.role)) return res.status(403).json({ message: 'Cannot toggle this role.' });
    let tools = [];
    try { tools = JSON.parse(u.assigned_tools || '[]'); } catch {}
    if (u.role === 'staff' && tools.length === 0) {
      tools = [1,6,10,15];
      await db.query('UPDATE users SET is_active=true,assigned_tools=? WHERE id=?', [JSON.stringify(tools), req.params.id]);
    } else {
      await db.query('UPDATE users SET is_active=true WHERE id=?', [req.params.id]);
    }
    const toolNames = ALL_TOOLS.filter(t => tools.includes(t.id)).map(t => t.name);
    sendAccountActivatedEmail({ username:u.username, email:u.email, role:u.role, assignedTools:toolNames }).catch(e=>console.error(e.message));
    res.json({ message: `${u.username} activated.` });
  } catch (e) { res.status(500).json({ message: 'Failed to activate user.' }); }
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,username,email,role FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    const u = rows[0];
    if (!['staff','user'].includes(u.role)) return res.status(403).json({ message: 'Cannot toggle this role.' });
    await db.query('UPDATE users SET is_active=false WHERE id=?', [req.params.id]);
    sendAccountDeactivatedEmail({ username:u.username, email:u.email }).catch(e=>console.error(e.message));
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
    sendToolsUpdatedEmail({ username:rows[0].username, email:rows[0].email, assignedTools:names }).catch(e=>console.error(e.message));
    res.json({ message: 'Modules updated.', assignedTools: toolIds });
  } catch (e) { res.status(500).json({ message: 'Failed to update modules.' }); }
});

// ── PATCH /api/admin/users/:id/role ──────────────────────
// Change role of an already-active user
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!role || !VALID_ROLES.includes(role))
    return res.status(400).json({ message:'Valid role required.' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message:'You cannot change your own role.' });
  try {
    const [rows] = await db.query('SELECT id,username,email FROM users WHERE id=?',[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'User not found.' });
    const u = rows[0];

    // If changing to staff, assign default tools if no tools yet
    let toolUpdate = '';
    if (role === 'staff') {
      const [cur] = await db.query('SELECT assigned_tools FROM users WHERE id=?',[req.params.id]);
      let existing=[]; try{ existing=JSON.parse(cur[0].assigned_tools||'[]'); }catch{}
      if (!existing.length) toolUpdate = JSON.stringify([1,6,10,15]);
    }

    if (toolUpdate) {
      await db.query('UPDATE users SET role=?, assigned_tools=? WHERE id=?',[role,toolUpdate,req.params.id]);
    } else {
      await db.query('UPDATE users SET role=? WHERE id=?',[role,req.params.id]);
    }

    sendRoleChanged({ username:u.username, email:u.email, newRole:role }).catch(e=>console.error(e.message));
    res.json({ message:`Role updated to ${role}.` });
  } catch(e){ res.status(500).json({ message:'Failed to update role.' }); }
});

// ── PUT /api/admin/users/:id/tools ────────────────────────
router.put('/users/:id/tools', async (req, res) => {
  const { toolIds } = req.body;
  if (!Array.isArray(toolIds)) return res.status(400).json({ message:'toolIds must be an array.' });
  const valid = ALL_TOOLS.map(t=>t.id);
  const bad   = toolIds.filter(id=>!valid.includes(id));
  if (bad.length) return res.status(400).json({ message:`Invalid tool IDs: ${bad.join(', ')}` });
  try {
    const [rows] = await db.query('SELECT id,username,email,role FROM users WHERE id=?',[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'User not found.' });
    if (rows[0].role !== 'staff')
      return res.status(403).json({ message:'Tools can only be assigned to staff members.' });
    await db.query('UPDATE users SET assigned_tools=? WHERE id=?',[JSON.stringify(toolIds),req.params.id]);
    const names = ALL_TOOLS.filter(t=>toolIds.includes(t.id)).map(t=>t.name);
    sendToolsUpdated({ username:rows[0].username, email:rows[0].email, assignedTools:names })
      .catch(e=>console.error(e.message));
    res.json({ message:'Tools updated.', assignedTools:toolIds });
  } catch(e){ res.status(500).json({ message:'Failed to update tools.' }); }
});

// ── DELETE /api/admin/users/:id ───────────────────────────
router.delete('/users/:id', async (req, res) => {
  if (parseInt(req.params.id)===req.user.id)
    return res.status(400).json({ message:'Cannot delete your own account.' });
  try {
    await db.query('DELETE FROM users WHERE id=?',[req.params.id]);
    res.json({ message:'User deleted.' });
  } catch(e){ res.status(500).json({ message:'Failed to delete user.' }); }
});

module.exports = router;
