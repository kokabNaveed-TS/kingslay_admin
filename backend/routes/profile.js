const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);

router.put('/info', async (req, res) => {
  const { username, phone } = req.body;
  if (!username?.trim()||username.trim().length<3)
    return res.status(400).json({ message:'Username must be at least 3 characters.' });
  try {
    // const [ex] = await db.query('SELECT id FROM users WHERE username=? AND id!=?',[username.trim(),req.user.id]);
    // if (ex.length) return res.status(409).json({ message:'Username already taken.' });
    await db.query('UPDATE users SET username=?,phone=? WHERE id=?',[username.trim(),phone?.trim()||'',req.user.id]);
    const [rows] = await db.query('SELECT id,username,email,phone,role,is_active,assigned_tools,created_at FROM users WHERE id=?',[req.user.id]);
    const u=rows[0]; let assignedTools=[]; try{assignedTools=JSON.parse(u.assigned_tools||'[]');}catch{}
    u.assignedTools=assignedTools;
    res.json({ message:'Profile updated.', user:u });
  } catch(e){ res.status(500).json({ message:'Update failed.' }); }
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword||!newPassword) return res.status(400).json({ message:'Both passwords required.' });
  if (newPassword.length<8||!/[A-Z]/.test(newPassword)||!/[0-9]/.test(newPassword))
    return res.status(400).json({ message:'Password: 8+ chars, uppercase, number.' });
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id=?',[req.user.id]);
    if (!await bcrypt.compare(currentPassword,rows[0].password))
      return res.status(401).json({ message:'Current password is incorrect.' });
    await db.query('UPDATE users SET password=? WHERE id=?',[await bcrypt.hash(newPassword,12),req.user.id]);
    res.json({ message:'Password changed successfully.' });
  } catch(e){ res.status(500).json({ message:'Failed to change password.' }); }
});

module.exports = router;