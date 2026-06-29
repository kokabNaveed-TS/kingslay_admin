# Developer Manual - Kingsleys Management Dashboard (Containerized)

## 1. Application Detail
The Kingsleys Management Dashboard is a role-based access control (RBAC) portal built with a modern stack and deployed using Docker.
- **Frontend**: React (Vite) built as a static site and served via Nginx.
- **Backend**: Node.js, Express.js.
- **Authentication**: Custom JWT (JSON Web Tokens) with `bcrypt` for password hashing.
- **Proxy/Routing**: Traefik handles reverse proxying and SSL termination.

### Folder Structure
```text
KingslayAdmin/
├── backend/                  # Node.js Express server
│   ├── config/               
│   ├── middleware/           
│   ├── routes/               
│   ├── db.js                 
│   ├── Dockerfile            # Backend container instructions (Node 22)
│   ├── emailService.js       
│   ├── init.sql              # Database schema & seed data
│   └── server.js             # Main server entrypoint
├── frontend/                 # React Frontend
│   ├── dist/                 # Compiled static UI assets
│   ├── Dockerfile            # Frontend container instructions (Nginx)
│   └── nginx.conf            # Nginx server block configuration
└── docker-compose.yml        # Orchestration for frontend and backend containers
```

### Docker Detail
The application relies heavily on `docker-compose` and is split into two primary services:

1. **Frontend Service (`kingsleys_frontend`)**:
   - Built from `frontend/Dockerfile` using `nginx:alpine`.
   - Copies the pre-built `dist/` directory into Nginx's public folder.
   - Replaces the default Nginx config with `frontend/nginx.conf` (configured for SPA fallback routes and static asset caching).
   - Routed by Traefik on port `80` using the rule: `Host(dashboard.projectkingsleys.com) && !PathPrefix(/api)`.

2. **Backend Service (`kingsleys_backend`)**:
   - Built from `backend/Dockerfile` using `node:22-alpine`.
   - Runs `server.js` on port `5000`.
   - Consumes environment variables from `backend/.env`.
   - Routed by Traefik on port `5000` using the rule: `Host(dashboard.projectkingsleys.com) && PathPrefix(/api)`.

**Traefik Integration**:
Traefik must be running on the host as an external reverse proxy. Both the frontend and backend services join an external `traefik` network and expose themselves automatically via Docker labels.

### User Detail & User Roles
Users are defined in the MySQL `users` table. The application supports four hierarchical roles:
1. **Admin**: Full system access, can manage users, roles, and assign modules.
2. **Operation Manager**: Similar to Admin, can manage staff.
3. **Store Manager**: Access only to specifically assigned modules.
4. **Staff**: Baseline access. Must be assigned tools to view anything.

### DB Detail
The database is **MySQL**. The schema can be initialized using `backend/init.sql`.
- **Table `users`**: Contains id, username, email, hashed password, role, is_active flag, and assigned_tools array.

<!-- *Note on Keycloak: While initially discussed, the implementation uses an internal MySQL JWT-based flow, avoiding the overhead of a separate Keycloak container.* -->

## 2. How to Backup / What to Backup
To safely backup the application, you must capture the database and environment configurations.

**What to backup:**
1. **Database**: The MySQL `kingsleys_db` database.
2. **Environment Files**: The `.env` file in the `backend/` directory, containing secrets (e.g., `JWT_SECRET`, DB credentials).

**How to backup MySQL:**
You can use `mysqldump` to export the database structure and data:
```bash
mysqldump -u root -p kingsleys_db > kingsleys_db_backup_$(date +%F).sql
```
It is highly recommended to run this within a cron job or scheduled pipeline.

## 3. Logs Detail
Currently, logs are output to `stdout` / `stderr`.
- Since the app is containerized, you can view logs natively via Docker:
  - Frontend: `docker logs kingsleys_frontend`
  - Backend: `docker logs kingsleys_backend`
- **For Production**: The Docker daemon can be configured to use logging drivers (like AWS CloudWatch, Splunk, or json-file with log rotation) to persist and aggregate these container logs off-server.
