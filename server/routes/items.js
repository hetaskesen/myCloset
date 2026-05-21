const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null;
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

async function uploadPhoto(buffer) {
  const cloudinary = getCloudinary();
  if (!cloudinary) return { url: null, public_id: null };
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'my-closet', transformation: [{ width: 800, height: 1067, crop: 'fill' }] },
      (err, result) => err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id })
    ).end(buffer);
  });
}

// GET all items
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { category, sort } = req.query;
    let where = category ? `WHERE i.category = $1` : '';
    let params = category ? [category] : [];
    const order = sort === 'wear_count' ? 'wear_count DESC' : 'i.created_at DESC';
    const result = await db.query(`
      SELECT i.*, COUNT(ol.id)::int as wear_count, MAX(ol.worn_date) as last_worn
      FROM items i
      LEFT JOIN outfit_items oi ON oi.item_id = i.id
      LEFT JOIN outfit_logs ol ON ol.outfit_id = oi.outfit_id
      ${where}
      GROUP BY i.id
      ORDER BY ${order}
    `, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single item
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT i.*, COUNT(ol.id)::int as wear_count, MAX(ol.worn_date) as last_worn
      FROM items i
      LEFT JOIN outfit_items oi ON oi.item_id = i.id
      LEFT JOIN outfit_logs ol ON ol.outfit_id = oi.outfit_id
      WHERE i.id = $1
      GROUP BY i.id
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST new item
router.post('/', upload.single('photo'), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, category, brand, color, date_acquired, notes } = req.body;
    let photo_url = null, photo_public_id = null;
    if (req.file) {
      const uploaded = await uploadPhoto(req.file.buffer);
      photo_url = uploaded.url;
      photo_public_id = uploaded.public_id;
    }
    const result = await db.query(
      `INSERT INTO items (name, category, brand, color, date_acquired, notes, photo_url, photo_public_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, category, brand || null, color || null, date_acquired || null, notes || null, photo_url, photo_public_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update item
router.patch('/:id', upload.single('photo'), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, category, brand, color, date_acquired, notes } = req.body;
    let extra = {};
    if (req.file) {
      const existing = await db.query('SELECT photo_public_id FROM items WHERE id=$1', [req.params.id]);
      const cloudinary = getCloudinary();
      if (cloudinary && existing.rows[0]?.photo_public_id) {
        await cloudinary.uploader.destroy(existing.rows[0].photo_public_id);
      }
      const uploaded = await uploadPhoto(req.file.buffer);
      extra.photo_url = uploaded.url;
      extra.photo_public_id = uploaded.public_id;
    }
    const fields = { name, category, brand, color, date_acquired, notes, ...extra };
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    const set = entries.map(([k], i) => `${k}=$${i + 1}`).join(', ');
    const vals = entries.map(([, v]) => v);
    vals.push(req.params.id);
    const result = await db.query(
      `UPDATE items SET ${set}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`, vals
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE item
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const item = await db.query('SELECT photo_public_id FROM items WHERE id=$1', [req.params.id]);
    const cloudinary = getCloudinary();
    if (cloudinary && item.rows[0]?.photo_public_id) {
      await cloudinary.uploader.destroy(item.rows[0].photo_public_id);
    }
    await db.query('DELETE FROM items WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
