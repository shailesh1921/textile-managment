const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');

const router = express.Router();

router.get('/grey-fabric', authenticateToken, async (req, res) => {
  const { ownership } = req.query;
  try {
    let q = `SELECT g.*, p.trade_name as party_name, f.fabric_name, l.lot_no, jo.job_order_no
             FROM grey_fabric_inventory g
             JOIN parties p ON g.party_id = p.party_id AND p.tenant_id = g.tenant_id 
             JOIN fabrics f ON g.fabric_id = f.fabric_id AND f.tenant_id = g.tenant_id
             LEFT JOIN lots l ON g.lot_id = l.lot_id AND l.tenant_id = g.tenant_id 
             LEFT JOIN job_orders jo ON g.job_order_id = jo.job_order_id AND jo.tenant_id = g.tenant_id
             WHERE g.tenant_id = $1`;
    const params = [req.tenant_id];
    if (ownership) { q += ` AND g.ownership_type = $2`; params.push(ownership); }
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dye-chemicals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, d.item_name, d.item_code, d.category, d.reorder_level, p.trade_name as supplier_name
       FROM dye_chemical_stock_batches s 
       JOIN dye_chemicals d ON s.item_id = d.item_id AND d.tenant_id = s.tenant_id
       LEFT JOIN parties p ON s.supplier_id = p.party_id AND p.tenant_id = s.tenant_id 
       WHERE s.tenant_id = $1 ORDER BY s.expiry_date`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/finished-goods', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fg.*, l.lot_no, f.fabric_name, s.shade_name, jo.job_order_no, p.trade_name as party_name
       FROM finished_goods_inventory fg
       JOIN lots l ON fg.lot_id = l.lot_id AND l.tenant_id = fg.tenant_id 
       JOIN fabrics f ON fg.fabric_id = f.fabric_id AND f.tenant_id = fg.tenant_id
       LEFT JOIN shades s ON fg.shade_id = s.shade_id AND s.tenant_id = fg.tenant_id 
       JOIN job_orders jo ON fg.job_order_id = jo.job_order_id AND jo.tenant_id = fg.tenant_id
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = fg.tenant_id 
       WHERE fg.tenant_id = $1`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stock-dashboard', authenticateToken, async (req, res) => {
  try {
    const chemicals = await pool.query(
      `SELECT d.item_id, d.item_code, d.item_name, d.category, d.reorder_level, COALESCE(SUM(s.qty_on_hand),0) as current_stock
       FROM dye_chemicals d 
       LEFT JOIN dye_chemical_stock_batches s ON d.item_id = s.item_id AND s.tenant_id = d.tenant_id
       WHERE d.tenant_id = $1 GROUP BY d.item_id ORDER BY current_stock ASC`,
      [req.tenant_id]
    );
    const alerts = chemicals.rows.filter((c) => parseFloat(c.current_stock) <= parseFloat(c.reorder_level));
    const grey = await pool.query(`SELECT COUNT(*) as lots, COALESCE(SUM(qty_meters),0) as meters FROM grey_fabric_inventory WHERE tenant_id = $1`, [req.tenant_id]);
    const fg = await pool.query(`SELECT COUNT(*) as lots, COALESCE(SUM(qty_meters),0) as meters FROM finished_goods_inventory WHERE tenant_id = $1`, [req.tenant_id]);
    res.json({ chemicals: chemicals.rows, alerts, grey: grey.rows[0], finished: fg.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movements', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sm.*, u.username 
       FROM stock_movements sm 
       LEFT JOIN users u ON sm.created_by = u.user_id AND u.tenant_id = sm.tenant_id
       WHERE sm.tenant_id = $1 ORDER BY sm.movement_id DESC LIMIT 100`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/grn', authenticateToken, async (req, res) => {
  const { supplier_id, po_id, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const grnNo = await nextDocNo(req.tenant_id, 'GRN', 'grn_records', 'grn_number');
    let total = 0;
    const grn = await client.query(
      `INSERT INTO grn_records (tenant_id, grn_number, po_id, supplier_id, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.tenant_id, grnNo, po_id, supplier_id, req.user.user_id]
    );
    for (const item of items) {
      const val = parseFloat(item.qty) * parseFloat(item.unit_cost);
      total += val;
      await client.query(
        `INSERT INTO dye_chemical_stock_batches (tenant_id, item_id, batch_lot_no, qty_on_hand, unit_cost, expiry_date, supplier_id, warehouse_location)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING stock_batch_id`,
        [req.tenant_id, item.item_id, item.batch_lot_no, item.qty, item.unit_cost, item.expiry_date, supplier_id, item.location || 'Chem Store']
      );
      await client.query(
        `INSERT INTO stock_movements (tenant_id, movement_type, item_category, item_id, reference_type, reference_id, qty, unit_cost, created_by)
         VALUES ($1,'GRN_IN','DYE_CHEMICAL',$2,'GRN',$3,$4,$5,$6)`,
        [req.tenant_id, item.item_id, grn.rows[0].grn_id, item.qty, item.unit_cost, req.user.user_id]
      );
    }
    await client.query(`UPDATE grn_records SET total_amount = $1 WHERE grn_id = $2 AND tenant_id = $3`, [total, grn.rows[0].grn_id, req.tenant_id]);
    await client.query('COMMIT');
    res.status(201).json(grn.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/packing', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pm.*, COALESCE(ps.qty_on_hand,0) as qty_on_hand 
       FROM packing_materials pm
       LEFT JOIN packing_stock ps ON pm.packing_id = ps.packing_id AND ps.tenant_id = pm.tenant_id 
       WHERE pm.tenant_id = $1`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
