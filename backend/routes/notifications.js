const express = require('express');
const router = express.Router();

// GET VAPID public key (needed by frontend to subscribe)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST save a push subscription
router.post('/subscribe', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { subscription } = req.body;
    await db.query(
      `INSERT INTO push_subscriptions (endpoint, subscription_json)
       VALUES ($1, $2)
       ON CONFLICT (endpoint) DO UPDATE SET subscription_json = $2, updated_at = NOW()`,
      [subscription.endpoint, JSON.stringify(subscription)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unsubscribe
router.post('/unsubscribe', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { endpoint } = req.body;
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger the daily check-in notification (called by a cron job or manually)
// Protect with the same API_SECRET header
router.post('/send-daily', async (req, res) => {
  const db = req.app.locals.db;
  const webpush = req.app.locals.webpush;
  try {
    // Only send if not already logged today
    const todayLog = await db.query(
      'SELECT id FROM outfit_logs WHERE worn_date = CURRENT_DATE'
    );
    if (todayLog.rows.length > 0) {
      return res.json({ skipped: true, reason: 'Already logged today' });
    }

    const subs = await db.query('SELECT subscription_json FROM push_subscriptions');
    const payload = JSON.stringify({
      title: '👗 What did you wear today?',
      body: 'Tap to log your outfit and keep your streak going!',
      url: '/'
    });

    let sent = 0;
    let failed = 0;
    await Promise.allSettled(
      subs.rows.map(async ({ subscription_json }) => {
        try {
          await webpush.sendNotification(JSON.parse(subscription_json), payload);
          sent++;
        } catch (err) {
          failed++;
          if (err.statusCode === 410) {
            // Subscription expired — clean up
            const sub = JSON.parse(subscription_json);
            await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
          }
        }
      })
    );

    res.json({ success: true, sent, failed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
