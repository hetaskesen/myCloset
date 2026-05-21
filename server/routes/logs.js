const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { limit = 30, offset = 0 } = req.query;
    const logs = await db.query(`
      SELECT ol.*, o.name as outfit_name FROM outfit_logs ol
      LEFT JOIN outfits o ON o.id=ol.outfit_id
      ORDER BY ol.worn_date DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    for (const log of logs.rows) {
      if (log.outfit_id) {
        const items = await db.query(
          'SELECT i.* FROM items i JOIN outfit_items oi ON oi.item_id=i.id WHERE oi.outfit_id=$1',
          [log.outfit_id]
        );
        log.items = items.rows;
      } else { log.items = []; }
    }
    res.json(logs.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/today', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT ol.*, o.name as outfit_name FROM outfit_logs ol
      LEFT JOIN outfits o ON o.id=ol.outfit_id
      WHERE ol.worn_date=CURRENT_DATE
    `);
    res.json(result.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { outfit_id, worn_date, notes, item_ids } = req.body;
    const date = worn_date || new Date().toISOString().split('T')[0];
    await db.query('DELETE FROM outfit_logs WHERE worn_date=$1', [date]);
    let finalOutfitId = outfit_id;
    if (!outfit_id && item_ids?.length) {
      const outfit = await db.query(
        'INSERT INTO outfits (name, notes) VALUES ($1,$2) RETURNING *',
        [`Ad-hoc ${date}`, notes]
      );
      finalOutfitId = outfit.rows[0].id;
      await Promise.all(item_ids.map(id =>
        db.query('INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1,$2)', [finalOutfitId, id])
      ));
    }
    const result = await db.query(
      'INSERT INTO outfit_logs (outfit_id, worn_date, notes) VALUES ($1,$2,$3) RETURNING *',
      [finalOutfitId, date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM outfit_logs WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
