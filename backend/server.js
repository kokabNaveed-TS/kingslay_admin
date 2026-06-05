const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// ✅ FIX 1: TRUST TRAEFIK PROXY (CRITICAL)
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const { requireAuth, requireAdmin } = require('./middleware/auth');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/profile', requireAuth, require('./routes/profile'));
app.get('/api/health', (req, res) => res.json({ ok: true }));


app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Internal server error.' }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`✅  Server on http://localhost:${PORT}`);
  console.log(`🌍  CORS: ${process.env.CLIENT_URL}`);
});
