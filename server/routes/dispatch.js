const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');
const { calculateGstTax } = require('../utils/gst');

const router = express.Router();

router.get('/ready-lots', authenticateToken, async (req, res) => {
  const r = await pool.query(
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
  res.json(r.rows);
});

router.get('/challans', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT dc.*, p.trade_name as party_name 
     FROM dispatch_challans dc
     JOIN parties p ON dc.party_id = p.party_id AND p.tenant_id = dc.tenant_id
     WHERE dc.tenant_id = $1 ORDER BY dc.challan_id DESC`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

router.post('/challans', authenticateToken, async (req, res) => {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const joCheck = await client.query(`SELECT job_order_id FROM job_orders WHERE job_order_id = $1 AND tenant_id = $2`, [b.job_order_id, req.tenant_id]);
    if (!joCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job order not found or access denied' });
    }

    const no = await nextDocNo(req.tenant_id, 'DC', 'dispatch_challans', 'challan_no');
    let totalM = 0, totalKg = 0;
    for (const l of b.lines || []) { totalM += parseFloat(l.qty_meters || 0); totalKg += parseFloat(l.qty_kg || 0); }
    const dc = await client.query(
      `INSERT INTO dispatch_challans (tenant_id, challan_no, challan_type, job_order_id, party_id, transporter_id, vehicle_no, lr_no, lr_date, total_qty_meters, total_qty_kg, gst_section, created_by)
       VALUES ($1,$2,'DELIVERY_CHALLAN_JW',$3,$4,$5,$6,$7,$8,$9,$10,'143',$11) RETURNING *`,
      [req.tenant_id, no, b.job_order_id, b.party_id, b.transporter_id, b.vehicle_no, b.lr_no, b.lr_date, totalM, totalKg, req.user.user_id]
    );
    for (const l of b.lines || []) {
      await client.query(
        `INSERT INTO dispatch_challan_lines (challan_id, lot_id, fg_stock_id, fabric_id, shade_id, hsn_code, qty_meters, qty_kg, no_of_rolls)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [dc.rows[0].challan_id, l.lot_id, l.fg_stock_id, l.fabric_id, l.shade_id, l.hsn_code, l.qty_meters, l.qty_kg, l.no_of_rolls || 1]
      );
    }
    await client.query(`UPDATE job_orders SET status = 'PARTIALLY_DISPATCHED' WHERE job_order_id = $1 AND tenant_id = $2`, [b.job_order_id, req.tenant_id]);
    await client.query('COMMIT');
    res.status(201).json(dc.rows[0]);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

router.post('/gst/calculate-tax', authenticateToken, async (req, res) => {
  const tenant = await pool.query(`SELECT state_code FROM tenants WHERE tenant_id = $1`, [req.tenant_id]);
  const party = await pool.query(`SELECT state_code FROM parties WHERE party_id = $1 AND tenant_id = $2`, [req.body.party_id, req.tenant_id]);
  res.json(calculateGstTax(party.rows[0]?.state_code || '24', tenant.rows[0]?.state_code || '24', req.body.lines || []));
});

router.post('/gst/invoices', authenticateToken, async (req, res) => {
  const b = req.body;
  const tenant = await pool.query(`SELECT state_code FROM tenants WHERE tenant_id = $1`, [req.tenant_id]);
  const party = await pool.query(`SELECT state_code FROM parties WHERE party_id = $1 AND tenant_id = $2`, [b.party_id, req.tenant_id]);
  const tax = calculateGstTax(party.rows[0]?.state_code || '24', tenant.rows[0]?.state_code || '24', b.lines || []);
  const no = await nextDocNo(req.tenant_id, 'INV', 'gst_invoices', 'invoice_no');
  const inv = await pool.query(
    `INSERT INTO gst_invoices (tenant_id, invoice_no, invoice_type, job_order_id, party_id, taxable_value, cgst_amount, sgst_amount, igst_amount, total_amount, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.tenant_id, no, b.invoice_type || 'JOB_WORK_TAX_INVOICE', b.job_order_id, b.party_id, tax.taxable_value, tax.cgst_amount, tax.sgst_amount, tax.igst_amount, tax.total_amount, req.user.user_id]
  );
  for (const l of tax.lines || []) {
    await pool.query(
      `INSERT INTO gst_invoice_lines (invoice_id, line_type, hsn_sac, description, qty, rate, taxable_value, gst_rate, cgst, sgst, igst)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [inv.rows[0].invoice_id, l.type || 'SERVICE', l.sac || l.hsn_sac || '9988', l.description, l.qty || 1, l.rate || 0, l.taxable_value, l.gst_rate || 18, l.cgst, l.sgst, l.igst]
    );
  }
  res.status(201).json(inv.rows[0]);
});

router.get('/gst/invoices', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT gi.*, p.trade_name as party_name 
     FROM gst_invoices gi 
     JOIN parties p ON gi.party_id = p.party_id AND p.tenant_id = gi.tenant_id 
     WHERE gi.tenant_id = $1 ORDER BY gi.invoice_id DESC`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

module.exports = router;
