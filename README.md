# Kingsleys Management Dashboard

A professional, full-stack role-based access management system for Kingsleys Chicken.
Built with **React + Vite** (frontend) and **Express + MySQL** (backend).

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based login/signup with bcrypt password hashing |
| **Client-side Validation** | All forms validated before hitting the server |
| **Role-based Access** | 4 roles: Admin, Operational Manager, Store Manager, Staff |
| **Module Lock/Unlock** | Per-user module permissions — active or locked |
| **User Management** | Admin/Op.Manager CRUD, account activate/deactivate |
| **Email Notifications** | Signup → user + admin; activation, module changes |
| **Profile Management** | Edit profile, change password, avatar URL |
| **Responsive Design** | Mobile-first, collapsible sidebar |
| **SU to User**        | Admin /Op.Manager can Switch to user |
<!-- | **Rate Limiting** | Login (10/15min), Signup (5/hr) | -->

---

## 🗂️ Project Structure

```
kingslayadmin/
├── backend/
│   ├── config/
│   │   │   └── cookie.js            
│   ├── middleware/
│   │   │   └── auth.js      JWT verify, role guard
│   ├── routes/
│   │   │   ├── auth.js
|   |   |   ├── admin.js
│   │   │   └── profile.js
│   ├── .env
|   ├── db.js        MySQL pool
|   ├── emailService.js           Nodemailer templates
|   ├── init.sql         Full DB schema + seed admin
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── toolsList.js
|
├── src/
│   ├── context/
|   │   │   ├── AuthContext.jsx    Global auth state
|   │   │   └── ToastContext.jsx   Toast notifications
|   ├── components/
|   │   ├── AdminPanel.jsx
|   │   ├── ComingSoon.jsx 
|   │   ├── Dashboard.jsx 
|   │   ├── EditProfile.jsx 
|   │   ├── ForgotPassword.jsx 
|   │   ├── ImpersonationBanner.jsx 
|   │   ├── LoginPage.jsx 
|   │   ├── Maintenance.jsx 
|   │   ├── NotFound404.jsx 
|   │   ├── PrivacyPolicy.jsx     
|   │   ├── ResetPassword.jsx 
|   │   ├── SignupPage.jsx 
|   │   ├── TermsOfUse.jsx 
|   │   ├── ToolCard.jsx 
|   │   ├── UI.jsx 
|   │   ├── hooks/useAuth.jsx
|   │   ├── styles/
|   │   │   ├── auth.css
|   │   │   ├── dashboard.css      
|   |   │   ├── globals.css  
|   │   │   └── legal.css    
|   │   ├── utils/
|   │   │   ├── analytics.js
|   │   │   ├── api.js      
|   |   │   ├── authApi.js  
|   │   │   ├── rolePermissions.js
|   │   │   ├── roles.js      
|   |   │   ├── useAuth.js      
|   │   │   └── validation.js      
|   │   ├── App.jsx                Routes + protected routes
|   │   └── main.jsx     
├── index.html
|   └── package.
    
```

---

## 🚀 Quick Start

### 1. MySQL Database

```sql
-- Run the schema file
mysql -u root -p < backend/init.sql
```

This creates the `kingsleys_db` database with all tables and a default admin:
- **Email:** `kokabnaveed2002@gmail.com`
- **Password:** `Admin1234`
> ⚠️ Change the admin password after first login!

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DB credentials and email SMTP settings
npm install
npm run dev    # development (nodemon)
# npm start   # production
```

The API runs on **http://localhost:5000**

#### `.env` key variables:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kingsleys_db

JWT_SECRET=change_this_to_something_long_random

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password

ADMIN_EMAIL=admin@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

> For Gmail: use an **App Password** (Google Account → Security → 2FA → App Passwords)

---

### 3. Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** and proxies `/api` to the backend.

---

## 👥 User Roles & Permissions

| Role | CRUD Users | Assign Modules | Activate/Deactivate |
|---|---|---|---|
| **Admin** | ✅  | ✅ | ✅ |
| **Operational Manager**  | ✅ | ✅ | ✅ |
| **Store Manager**  | ❌ | ❌ | ❌ |
| **Staff** | ❌ | ❌ | ❌ |

> All roles are assigned by super admin

---

## 📧 Email Flow

| Trigger | Recipients |
|---|---|
| User signs up | User (welcome) + Admin (notification) |
| Admin activates account | User (activation confirmation) |
| Module permissions updated | User (list of enabled/disabled modules) |
| Password reset request | User (reset link, 15 min expiry) |

---

## 🔐 API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me              (requires token)
PUT  /api/auth/profile         (requires token)
PUT  /api/auth/change-password (requires token)
POST /api/auth/forgot-password
```

### Users (admin/op_manager only)
```
GET    /api/users
POST   /api/users              (admin only)
GET    /api/users/:id
PUT    /api/users/:id          (admin only)
DELETE /api/users/:id          (admin only)
PATCH  /api/users/:id/toggle-status (admin only)
GET    /api/users/:id/modules
PUT    /api/users/:id/modules
GET    /api/users/roles
GET    /api/users/modules
```

---

## 🎨 Theme

```css
--kitchen-orange: #E67E22;
--kitchen-warm:   #F39C12;
--kitchen-red:    #E74C3C;
--kitchen-brown:  #8B4513;
--kitchen-cream:  #FDF5E6;
--kitchen-dark:   #2C3E50;
```

Fonts: **Sora** (display/headings) + **DM Sans** (body)

---

## 🛠️ Production Build

```bash
# Frontend
cd frontend && npm run build    # outputs to dist/

# Backend — set NODE_ENV=production in .env
cd backend && npm start
```

Serve `frontend/dist` via Nginx or any static host. Point `/api` to the Node backend.

---

© 2026 Kingsleys Chicken. Built by TechScape Solution.
