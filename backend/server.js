const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// routes (NO /api prefix)
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

// health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 404 handler
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` })
);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍  CORS: ${process.env.CLIENT_URL}`);
});

