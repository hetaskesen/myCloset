const express = require('express');
const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

router.post('/subscribe', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { subscription } = req.body;
    await db.query(
      `INSERT INTO push_subscriptions (endpoint, subscription_json)
       VALUES ($1,$2) ON CONFLICT (endpoint)
       DO UPDATE SET subscription_json=$2, updated_at=NOW()`,
      [subscription.endpoint, JSON.stringify(subscription)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/unsubscribe', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [req.body.endpoint]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/send-daily', async (req, res) => {
  const db = req.app.locals.db;
  const webpush = req.app.locals.webpush;
  if (!webpush) return res.status(503).json({ error: 'Push notifications not configured' });
  try {
    const todayLog = await db.query('SELECT id FROM outfit_logs WHERE worn_date=CURRENT_DATE');
    if (todayLog.rows.length) return res.json({ skipped: true, reason: 'Already logged today' });
    const subs = await db.query('SELECT subscription_json FROM push_subscriptions');
    const payload = JSON.stringify({
      title: '👗 What did you wear today?',
      body: 'Tap to log your outfit and keep your streak going!',
      url: '/'
    });
    let sent = 0, failed = 0;
    await Promise.allSettled(subs.rows.map(async ({ subscription_json }) => {
      try {
        await webpush.sendNotification(JSON.parse(subscription_json), payload);
        sent++;
      } catch (err) {
        failed++;
        if (err.statusCode === 410) {
          const sub = JSON.parse(subscription_json);
          await db.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [sub.endpoint]);
        }
      }
    }));
    res.json({ success: true, sent, failed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
