const express = require('express');
const { pool } = require('../db');
const { authenticateToken, auditLog } = require('../middleware');
const { nextDocNo, metersToKg, copyProcessStagesFromTemplate } = require('../utils/helpers');

const router = express.Router();

router.get('/job-orders', authenticateToken, async (req, res) => {
  const { status, overdue } = req.query;
  try {
    let q = `SELECT jo.*, p.trade_name as party_name, f.fabric_name, f.fabric_code, s.shade_name, s.shade_card_no
             FROM job_orders jo
             JOIN parties p ON jo.party_id = p.party_id
             JOIN fabrics f ON jo.fabric_id = f.fabric_id
             LEFT JOIN shades s ON jo.shade_id = s.shade_id
             WHERE jo.tenant_id = $1`;
    const params = [req.tenant_id];
    if (status) { q += ` AND jo.status = $${params.length + 1}`; params.push(status); }
    if (overdue === 'true') { q += ` AND jo.required_delivery_date < CURRENT_DATE AND jo.status NOT IN ('COMPLETED','CANCELLED')`; }
    q += ` ORDER BY jo.job_order_id DESC`;
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/job-orders/:id', authenticateToken, async (req, res) => {
  try {
    const jo = await pool.query(
      `SELECT jo.*, p.trade_name as party_name, p.gstin as party_gstin, f.*, s.shade_name
       FROM job_orders jo JOIN parties p ON jo.party_id = p.party_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id LEFT JOIN shades s ON jo.shade_id = s.shade_id
       WHERE jo.job_order_id = $1 AND jo.tenant_id = $2`,
      [req.params.id, req.user.tenant_id]
    );
    if (!jo.rows.length) return res.status(404).json({ error: 'Job order not found' });
    const lots = await pool.query(`SELECT * FROM lots WHERE job_order_id = $1 ORDER BY lot_id`, [req.params.id]);
    res.json({ ...jo.rows[0], lots: lots.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/job-orders', authenticateToken, async (req, res) => {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const joNo = await nextDocNo(req.user.tenant_id, 'JO', 'job_orders', 'job_order_no');
    const fabric = await client.query(`SELECT gsm, width_inches FROM fabrics WHERE fabric_id = $1`, [b.fabric_id]);
    const gsm = fabric.rows[0]?.gsm || 100;
    const width = fabric.rows[0]?.width_inches || 58;
    const qtyKg = b.qty_kg_ordered || metersToKg(b.qty_meters_ordered, gsm, width);

    const result = await client.query(
      `INSERT INTO job_orders (tenant_id, job_order_no, party_id, broker_id, fabric_id, grey_fabric_state, ownership_type,
        qty_meters_ordered, qty_kg_ordered, shade_id, process_type, process_template_id, required_delivery_date,
        rate_per_meter, rate_per_kg, billing_uom, customer_po_ref, inward_challan_ref, special_instructions, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [
        req.user.tenant_id, joNo, b.party_id, b.broker_id, b.fabric_id, b.grey_fabric_state || 'GREY',
        b.ownership_type || 'CUSTOMER_OWNED', b.qty_meters_ordered, qtyKg, b.shade_id, b.process_type,
        b.process_template_id, b.required_delivery_date, b.rate_per_meter || 0, b.rate_per_kg || 0,
        b.billing_uom || 'METER', b.customer_po_ref, b.inward_challan_ref, b.special_instructions, req.user.user_id,
      ]
    );
    await client.query('COMMIT');
    await auditLog(req, 'CREATE', 'job_orders', result.rows[0].job_order_id, null, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/job-orders/:id/confirm', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const jo = await client.query(`SELECT * FROM job_orders WHERE job_order_id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenant_id]);
    if (!jo.rows.length) return res.status(404).json({ error: 'Job order not found' });
    const order = jo.rows[0];

    const lotNo = await nextDocNo(req.user.tenant_id, 'LOT', 'lots', 'lot_no');
    const barcode = `SKD-${order.job_order_no.replace(/\//g, '-')}-A`;
    const lot = await client.query(
      `INSERT INTO lots (tenant_id, lot_no, job_order_id, lot_type, barcode_value, grey_qty_meters_in, grey_qty_kg_in, current_status)
       VALUES ($1,$2,$3,'PRIMARY',$4,$5,$6,'WAITING') RETURNING *`,
      [req.user.tenant_id, lotNo, order.job_order_id, barcode, order.qty_meters_ordered, order.qty_kg_ordered]
    );

    if (order.process_template_id) {
      await copyProcessStagesFromTemplate(client, lot.rows[0].lot_id, order.process_template_id, order.qty_meters_ordered, order.qty_kg_ordered);
    }

    await client.query(
      `INSERT INTO grey_fabric_inventory (tenant_id, lot_id, job_order_id, ownership_type, party_id, fabric_id, qty_meters, qty_kg, inward_challan_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.user.tenant_id, lot.rows[0].lot_id, order.job_order_id, order.ownership_type, order.party_id, order.fabric_id, order.qty_meters_ordered, order.qty_kg_ordered, order.inward_challan_ref]
    );

    await client.query(`UPDATE job_orders SET status = 'CONFIRMED', updated_at = NOW() WHERE job_order_id = $1`, [order.job_order_id]);
    await client.query('COMMIT');
    res.json({ job_order: order, lot: lot.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/lots/:lotId/trace', authenticateToken, async (req, res) => {
  try {
    const lotId = req.params.lotId;
    const trace = await pool.query(
      `WITH RECURSIVE lot_tree AS (
         SELECT lot_id, parent_lot_id, lot_no, grey_qty_meters_in, finished_qty_meters, 0 AS depth
         FROM lots WHERE lot_id = $1 AND tenant_id = $2
         UNION ALL
         SELECT l.lot_id, l.parent_lot_id, l.lot_no, l.grey_qty_meters_in, l.finished_qty_meters, lt.depth + 1
         FROM lots l JOIN lot_tree lt ON l.parent_lot_id = lt.lot_id OR l.lot_id = lt.parent_lot_id
       )
       SELECT DISTINCT lt.*, lps.stage_id, lps.sequence_no, lps.process_name, lps.status as stage_status,
              lps.input_meters, lps.output_meters, lps.stage_loss_pct, lps.cumulative_shrinkage_pct,
              br.batch_no, br.status as batch_status, m.machine_name,
              dc.challan_no, gi.invoice_no
       FROM lot_tree lt
       LEFT JOIN lot_process_stages lps ON lps.lot_id = lt.lot_id
       LEFT JOIN batch_runs br ON br.stage_id = lps.stage_id
       LEFT JOIN machines m ON br.machine_id = m.machine_id
       LEFT JOIN dispatch_challan_lines dcl ON dcl.lot_id = lt.lot_id
       LEFT JOIN dispatch_challans dc ON dc.challan_id = dcl.challan_id
       LEFT JOIN job_work_bills jwb ON jwb.job_order_id = (SELECT job_order_id FROM lots WHERE lot_id = lt.lot_id LIMIT 1)
       LEFT JOIN gst_invoices gi ON gi.invoice_id = jwb.invoice_id
       ORDER BY lt.depth, lps.sequence_no`,
      [lotId, req.user.tenant_id]
    );
    res.json(trace.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lots/barcode/:value', authenticateToken, async (req, res) => {
  try {
    const lot = await pool.query(
      `SELECT l.*, jo.job_order_no, p.trade_name as party_name, f.fabric_name, s.shade_name
       FROM lots l JOIN job_orders jo ON l.job_order_id = jo.job_order_id
       JOIN parties p ON jo.party_id = p.party_id JOIN fabrics f ON jo.fabric_id = f.fabric_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id
       WHERE l.barcode_value = $1 AND l.tenant_id = $2`,
      [req.params.value, req.user.tenant_id]
    );
    if (!lot.rows.length) return res.status(404).json({ error: 'Lot not found' });
    const stages = await pool.query(`SELECT * FROM lot_process_stages WHERE lot_id = $1 ORDER BY sequence_no`, [lot.rows[0].lot_id]);
    res.json({ ...lot.rows[0], stages: stages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lots/:lotId/split', authenticateToken, async (req, res) => {
  const { splits } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const parent = await client.query(`SELECT * FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [req.params.lotId, req.user.tenant_id]);
    if (!parent.rows.length) return res.status(404).json({ error: 'Lot not found' });
    const p = parent.rows[0];
    const children = [];
    let suffix = 66;
    for (const sp of splits) {
      const childNo = `${p.lot_no}-${String.fromCharCode(suffix++)}`;
      const barcode = `SKD-${childNo.replace(/\//g, '-')}`;
      const child = await client.query(
        `INSERT INTO lots (tenant_id, lot_no, job_order_id, parent_lot_id, lot_type, barcode_value, grey_qty_meters_in, grey_qty_kg_in, current_status)
         VALUES ($1,$2,$3,$4,'SPLIT_CHILD',$5,$6,$7,'WAITING') RETURNING *`,
        [req.user.tenant_id, childNo, p.job_order_id, p.lot_id, barcode, sp.qty_meters, sp.qty_kg]
      );
      await client.query(
        `INSERT INTO lot_genealogy (tenant_id, parent_lot_id, child_lot_id, relationship, qty_meters_transferred, qty_kg_transferred, created_by)
         VALUES ($1,$2,$3,'SPLIT',$4,$5,$6)`,
        [req.user.tenant_id, p.lot_id, child.rows[0].lot_id, sp.qty_meters, sp.qty_kg, req.user.user_id]
      );
      const stages = await client.query(`SELECT * FROM lot_process_stages WHERE lot_id = $1 ORDER BY sequence_no`, [p.lot_id]);
      for (const st of stages.rows) {
        await client.query(
          `INSERT INTO lot_process_stages (lot_id, sequence_no, process_name, machine_type, status, input_meters, input_kg)
           VALUES ($1,$2,$3,$4,'PENDING',$5,$6)`,
          [child.rows[0].lot_id, st.sequence_no, st.process_name, st.machine_type, sp.qty_meters, sp.qty_kg]
        );
      }
      children.push(child.rows[0]);
    }
    await client.query('COMMIT');
    res.json({ parent: p, children });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/lots/:lotId/stages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lps.*, m.machine_name, m.machine_code FROM lot_process_stages lps
       LEFT JOIN machines m ON lps.assigned_machine_id = m.machine_id
       WHERE lps.lot_id = $1 ORDER BY sequence_no`,
      [req.params.lotId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
