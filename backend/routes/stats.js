const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [
      totalItems,
      totalOutfits,
      logsThisMonth,
      neverWorn,
      mostWorn,
      leastWorn,
      categoryBreakdown,
      wearByMonth,
      streak
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM items'),
      db.query('SELECT COUNT(*) FROM outfits'),
      db.query(`SELECT COUNT(*) FROM outfit_logs WHERE worn_date >= DATE_TRUNC('month', CURRENT_DATE)`),
      db.query(`
        SELECT i.* FROM items i
        WHERE i.id NOT IN (
          SELECT DISTINCT oi.item_id FROM outfit_items oi
          JOIN outfit_logs ol ON ol.outfit_id = oi.outfit_id
        )
      `),
      db.query(`
        SELECT i.*, COUNT(ol.id) as wear_count
        FROM items i
        JOIN outfit_items oi ON oi.item_id = i.id
        JOIN outfit_logs ol ON ol.outfit_id = oi.outfit_id
        GROUP BY i.id
        ORDER BY wear_count DESC
        LIMIT 5
      `),
      db.query(`
        SELECT i.*, COUNT(ol.id) as wear_count
        FROM items i
        JOIN outfit_items oi ON oi.item_id = i.id
        JOIN outfit_logs ol ON ol.outfit_id = oi.outfit_id
        GROUP BY i.id
        ORDER BY wear_count ASC
        LIMIT 5
      `),
      db.query(`
        SELECT category, COUNT(*) as count
        FROM items
        GROUP BY category
        ORDER BY count DESC
      `),
      db.query(`
        SELECT TO_CHAR(worn_date, 'YYYY-MM') as month, COUNT(*) as count
        FROM outfit_logs
        WHERE worn_date >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `),
      // Streak: consecutive days logged up to today
      db.query(`
        WITH dates AS (
          SELECT worn_date, ROW_NUMBER() OVER (ORDER BY worn_date DESC) as rn
          FROM outfit_logs
          WHERE worn_date <= CURRENT_DATE
          ORDER BY worn_date DESC
        ),
        streak AS (
          SELECT worn_date, rn,
            worn_date - (rn - 1) * INTERVAL '1 day' as grp
          FROM dates
        )
        SELECT COUNT(*) as streak_days
        FROM streak
        WHERE grp = (SELECT grp FROM streak ORDER BY worn_date DESC LIMIT 1)
      `)
    ]);

    res.json({
      total_items: parseInt(totalItems.rows[0].count),
      total_outfits: parseInt(totalOutfits.rows[0].count),
      logs_this_month: parseInt(logsThisMonth.rows[0].count),
      never_worn: neverWorn.rows,
      most_worn: mostWorn.rows,
      least_worn: leastWorn.rows,
      category_breakdown: categoryBreakdown.rows,
      wear_by_month: wearByMonth.rows,
      streak_days: parseInt(streak.rows[0]?.streak_days || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
