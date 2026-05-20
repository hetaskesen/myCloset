const express = require('express');
const router = express.Router();

// GET all outfits with items
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const outfits = await db.query(`
      SELECT o.*, COUNT(DISTINCT ol.id) as wear_count, MAX(ol.worn_date) as last_worn
      FROM outfits o
      LEFT JOIN outfit_logs ol ON ol.outfit_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const itemsResult = await db.query(`
      SELECT oi.outfit_id, i.*
      FROM outfit_items oi
      JOIN items i ON i.id = oi.item_id
    `);

    const itemsByOutfit = {};
    itemsResult.rows.forEach(item => {
      if (!itemsByOutfit[item.outfit_id]) itemsByOutfit[item.outfit_id] = [];
      itemsByOutfit[item.outfit_id].push(item);
    });

    res.json(outfits.rows.map(o => ({ ...o, items: itemsByOutfit[o.id] || [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single outfit
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const outfit = await db.query('SELECT * FROM outfits WHERE id = $1', [req.params.id]);
    if (!outfit.rows.length) return res.status(404).json({ error: 'Not found' });
    const items = await db.query(
      'SELECT i.* FROM items i JOIN outfit_items oi ON oi.item_id = i.id WHERE oi.outfit_id = $1',
      [req.params.id]
    );
    res.json({ ...outfit.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new outfit
router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, item_ids, notes } = req.body;
    const outfit = await db.query(
      'INSERT INTO outfits (name, notes) VALUES ($1, $2) RETURNING *',
      [name, notes]
    );
    const outfitId = outfit.rows[0].id;
    if (item_ids?.length) {
      await Promise.all(item_ids.map(id =>
        db.query('INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)', [outfitId, id])
      ));
    }
    const items = await db.query(
      'SELECT i.* FROM items i JOIN outfit_items oi ON oi.item_id = i.id WHERE oi.outfit_id = $1',
      [outfitId]
    );
    res.status(201).json({ ...outfit.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update outfit
router.patch('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, item_ids, notes } = req.body;
    await db.query(
      'UPDATE outfits SET name = COALESCE($1, name), notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3',
      [name, notes, req.params.id]
    );
    if (item_ids) {
      await db.query('DELETE FROM outfit_items WHERE outfit_id = $1', [req.params.id]);
      await Promise.all(item_ids.map(id =>
        db.query('INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)', [req.params.id, id])
      ));
    }
    const outfit = await db.query('SELECT * FROM outfits WHERE id = $1', [req.params.id]);
    const items = await db.query(
      'SELECT i.* FROM items i JOIN outfit_items oi ON oi.item_id = i.id WHERE oi.outfit_id = $1',
      [req.params.id]
    );
    res.json({ ...outfit.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE outfit
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM outfits WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
