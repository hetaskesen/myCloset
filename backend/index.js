require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3001;

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
app.locals.db = pool;

// Web Push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
app.locals.webpush = webpush;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Auth middleware — simple API secret header check
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const secret = req.headers['x-api-secret'];
  if (secret !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Routes
app.use('/items', require('./routes/items'));
app.use('/outfits', require('./routes/outfits'));
app.use('/logs', require('./routes/logs'));
app.use('/notifications', require('./routes/notifications'));
app.use('/stats', require('./routes/stats'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`My Closet API running on port ${PORT}`));
