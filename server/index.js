require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
});
app.locals.db = pool;

// Test DB connection on startup
pool.query('SELECT 1').then(() => {
  console.log('✓ Database connected');
}).catch(err => {
  console.error('✗ Database connection failed:', err.message);
});

// ─── Web Push ─────────────────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  app.locals.webpush = webpush;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Auth — all /api routes require the secret header
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const secret = req.headers['x-api-secret'];
  if (process.env.API_SECRET && secret !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/items', require('./routes/items'));
app.use('/api/outfits', require('./routes/outfits'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: isProd ? 'production' : 'development' }));

// ─── Serve React in production ────────────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  // All non-API routes → React app (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🪡 My Closet running on http://localhost:${PORT}`);
  if (!isProd) console.log(`   React dev server: http://localhost:5173`);
});
