const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

// ── Shared HTML layout ────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${process.env.APP_NAME}</title></head>
  <body style="margin:0;padding:0;background:#F1F5F9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr><td style="background:#E67E22;padding:28px 40px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">KINGSLEYS</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Management Dashboard</div>
    </td></tr>
    <tr><td style="padding:36px 40px;">${content}</td></tr>
    <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">© 2026 Kingsleys Chicken ·
        <a href="${process.env.APP_URL}" style="color:#2563EB;text-decoration:none;">${process.env.APP_NAME}</a>
        · <a href="https://www.techscapesolution.com" style="color:#2563EB;text-decoration:none;">TechScape Solution</a></p>
      <p style="font-size:11px;color:black;margin:6px 0 0;">Automated message — do not reply directly.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

function row(label, val) {
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
    <span style="font-size:12px;color:#94A3B8;font-weight:500;">${label}</span>
    <span style="float:right;font-size:13px;color:#0F172A;font-weight:600;">${val}</span>
  </td></tr>`;
}

function badge(active) {
  return active
    ? `<span style="background:#DCFCE7;color:#166534;font-size:12px;font-weight:700;padding:3px 12px;border-radius:99px;">● Active</span>`
    : `<span style="background:#FEF9C3;color:#854D0E;font-size:12px;font-weight:700;padding:3px 12px;border-radius:99px;">● Pending</span>`;
}

function cta(text, url) {
  return `<div style="text-align:center;margin-top:28px;">
    <a href="${url}" style="background:#E67E22;color:#fff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:10px;text-decoration:none;display:inline-block;">${text} →</a>
  </div>`;
}

// ── 1. Signup confirmation → new user ────────────────────
async function sendSignupConfirmationToUser({ username, email, role }) {
  const roleMap = { admin: 'Admin', operation_manager: 'Operation Manager', staff: 'Staff Member', user: 'User' };
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: email,
    subject: `Welcome to ${process.env.APP_NAME} — Account Created`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0 0 8px;">Welcome, ${username}! 👋</h1>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">Your account has been created on <strong>${process.env.APP_NAME}</strong>. An admin will activate your account shortly.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <p style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">Your Account Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Username', username)}${row('Email', email)}${row('Status', badge(false))}
        </table>
      </div>
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 18px;margin-top:18px;">
        <p style="font-size:13px;color:#92400E;margin:0;font-weight:500;">⏳ Your account is <strong>pending activation</strong>. You will receive another email once an admin activates it.</p>
      </div>
      ${cta('Go to Sign In', process.env.APP_URL)}
    `),
  });
}

// ── 2. Signup notification → admin ───────────────────────
async function sendSignupNotificationToAdmin({ username, email, phone, role }) {
  const roleMap = { admin: 'Admin', operation_manager: 'Operation Manager', staff: 'Staff Member', user: 'User' };
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: process.env.ADMIN_EMAIL,
    subject: `[Action Required] New Registration — ${username}`,
    html: layout(`
      <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0 0 8px;">New User Registration 🆕</h1>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">A new user registered on <strong>${process.env.APP_NAME}</strong> and is awaiting activation.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Username', username)}${row('Email', email)}${row('Status', badge(false))}${row('Registered', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }))}
        </table>
      </div>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px 18px;margin-top:18px;">
        <p style="font-size:13px;color:#1E40AF;margin:0;font-weight:500;">👉 <strong>Action required:</strong> Log in to the admin panel to activate this account and assign tools.</p>
      </div>
      ${cta('Open Admin Panel', process.env.APP_URL)}
    `),
  });
}

// ── 3. Account activated → user ──────────────────────────
async function sendAccountActivated({ username, email, role, assignedTools = [] }) {
  const roleMap = { admin: 'Admin', operation_manager: 'Operation Manager', store_manager: 'Store Manager', staff: 'Staff Member' };
  const toolsSection = assignedTools.length
    ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin-top:18px;">
        <p style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px;">✅ Modules Assigned (${assignedTools.length})</p>
        ${assignedTools.map(t => `<span style="background:#DCFCE7;color:#166534;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;display:inline-block;margin:2px;">${t}</span>`).join('')}
      </div>`
    : `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px 18px;margin-top:18px;"><p style="font-size:13px;color:#166534;margin:0;">✅ Your account is now active. Sign in to view your dashboard.</p></div>`;
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: email,
    subject: `Your ${process.env.APP_NAME} Account is Now Active`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0 0 8px;">Account Activated! ✅</h1>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">Great news, <strong>${username}</strong>! Your account on <strong>${process.env.APP_NAME}</strong> has been activated.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Username', username)}${row('Role', roleMap[role] || role)}${row('Status', badge(true))}${row('Activated', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }))}
        </table>
      </div>
      ${toolsSection}
      ${cta('Sign In Now', process.env.APP_URL)}
    `),
  });
}

// ── 4. Account deactivated → user ────────────────────────
async function sendAccountDeactivated({ username, email }) {
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: email,
    subject: `Your ${process.env.APP_NAME} Account Has Been Deactivated`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0 0 8px;">Account Deactivated</h1>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">Hello <strong>${username}</strong>, your account on <strong>${process.env.APP_NAME}</strong> has been deactivated by an admin.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Username', username)}${row('Status', badge(false))}${row('Date', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }))}
        </table>
      </div>
      <div style="background:#FFF1F2;border:1px solid #FECACA;border-radius:12px;padding:14px 18px;margin-top:18px;">
        <p style="font-size:13px;color:#991B1B;margin:0;font-weight:500;">🔒 You cannot sign in until your account is re-activated. Contact your admin if you believe this is an error.</p>
      </div>
    `),
  });
}

// ── 5. Tools updated → staff ─────────────────────────────
async function sendToolsUpdated({ username, email, assignedTools = [] }) {
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: email,
    subject: `Your Dashboard Modules Have Been Updated`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0 0 8px;">Dashboard Modules Updated 🔧</h1>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">Hello <strong>${username}</strong>, an admin has updated your assigned dashboard modules.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <p style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">Active Modules (${assignedTools.length})</p>
        ${assignedTools.length
        ? assignedTools.map(t => `<span style="background:#EFF6FF;color:#1D4ED8;font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px;border:1px solid #DBEAFE;display:inline-block;margin:2px;">${t}</span>`).join('')
        : '<p style="font-size:13px;color:#94A3B8;margin:0;">No modules are currently assigned.</p>'
      }
      </div>
      ${cta('View My Dashboard', process.env.APP_URL)}
    `),
  });
}


async function sendPasswordReset({ username, email, resetUrl }) {
  await transporter.sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.NO_REPLY_EMAIL || 'noreply@projectkingsleyschicken.com', // <--- Add this line

    to: email,
    subject: `Reset Your Password — ${process.env.APP_NAME}`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0 0 8px;">
        Reset Your Password 🔐
      </h1>

      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
        Hello <strong>${username}</strong>, we received a request to reset your password for
        <strong>${process.env.APP_NAME}</strong>.
      </p>

      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
        <p style="font-size:13px;color:#92400E;margin:0;font-weight:500;">
          ⏳ This link will expire in <strong>15 minutes</strong>.
          If you did not request this, you can safely ignore this email.
        </p>
      </div>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
        <p style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">
          Reset Details
        </p>

        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Email', email)}
          ${row('Requested At', new Date().toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }))}
        </table>
      </div>

      ${cta('Reset Password', resetUrl)}

      <p style="font-size:12px;color:#94A3B8;margin-top:18px;text-align:center;">
        If the button doesn’t work, copy and paste this link:<br/>
        <span style="color:#2563EB;word-break:break-all;">${resetUrl}</span>
      </p>
    `),
  });
}

module.exports = {
  sendSignupConfirmationToUser,
  sendSignupNotificationToAdmin,
  sendAccountActivated,
  sendAccountDeactivated,
  sendToolsUpdated,
  sendPasswordReset
};
