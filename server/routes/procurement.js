const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');

const router = express.Router();

// ─── 1. SUPPLIERS ──────────────────────────────────────────────
router.get('/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT party_id as supplier_id, party_code as supplier_code, legal_name as name,
              contact_person, email, mobile as phone, billing_address as address,
              city, state_code as state, gstin as tax_id, credit_limit, credit_period_days
       FROM parties 
       WHERE tenant_id = $1 AND party_type = 'SUPPLIER' AND is_active = true
       ORDER BY party_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const count = await pool.query(`SELECT COUNT(*) FROM parties WHERE tenant_id = $1`, [req.tenant_id]);
    const code = b.supplier_code || `SUP-${String(parseInt(count.rows[0].count, 10) + 1).padStart(3, '0')}`;
    const result = await pool.query(
      `INSERT INTO parties (tenant_id, party_code, party_type, legal_name, trade_name, gstin, state_code, billing_address, contact_person, mobile, email, credit_limit, credit_period_days, is_job_work_client)
       VALUES ($1, $2, 'SUPPLIER', $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, false) RETURNING *`,
      [
        req.tenant_id, code, b.name || b.legal_name, b.tax_id || b.gstin || '',
        b.state || b.state_code || '24', b.address || '', b.contact_person || '',
        b.phone || b.mobile || '', b.email || '', parseFloat(b.credit_limit || 0),
        parseInt(b.credit_period_days || 30)
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. PURCHASE ORDERS ────────────────────────────────────────
router.get('/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.po_id, po.po_number, po.order_date, po.expected_delivery_date, po.status,
              po.total_amount as net_amount, po.tax_amount, po.net_amount as total_amount,
              p.legal_name as supplier_name, p.mobile as supplier_phone, p.gstin as supplier_tax_id
       FROM purchase_orders po
       JOIN parties p ON po.supplier_id = p.party_id AND p.tenant_id = po.tenant_id
       WHERE po.tenant_id = $1
       ORDER BY po.po_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-orders', authenticateToken, async (req, res) => {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poNumber = await nextDocNo(req.tenant_id, 'PO', 'purchase_orders', 'po_number');
    const items = Array.isArray(b.items) ? b.items : [];
    
    let totalAmt = 0;
    for (const itm of items) {
      totalAmt += parseFloat(itm.quantity || 0) * parseFloat(itm.unit_price || 0);
    }
    const taxAmt = totalAmt * 0.18;
    const netAmt = totalAmt + taxAmt;

    const poRes = await client.query(
      `INSERT INTO purchase_orders (tenant_id, po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, tax_amount, net_amount, created_by)
       VALUES ($1, $2, $3, $4, $5, 'PLACED', $6, $7, $8, $9) RETURNING *`,
      [
        req.tenant_id, poNumber, parseInt(b.supplier_id),
        b.order_date || new Date().toISOString(), b.expected_delivery_date || null,
        totalAmt, taxAmt, netAmt, req.user.user_id
      ]
    );
    const po = poRes.rows[0];

    for (const itm of items) {
      if (itm.material_id) {
        await client.query(
          `INSERT INTO po_items (po_id, chemical_id, quantity, unit_price, tax_rate)
           VALUES ($1, $2, $3, $4, 18.0)`,
          [po.po_id, parseInt(itm.material_id), parseFloat(itm.quantity || 1), parseFloat(itm.unit_price || 0)]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(po);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/purchase-orders/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.po_id, po.po_number, po.order_date, po.expected_delivery_date, po.status,
              po.total_amount as net_amount, po.tax_amount, po.net_amount as total_amount,
              p.legal_name as supplier_name, p.mobile as supplier_phone, p.billing_address as supplier_address,
              p.gstin as supplier_tax_id
       FROM purchase_orders po
       JOIN parties p ON po.supplier_id = p.party_id AND p.tenant_id = po.tenant_id
       WHERE po.po_id = $1 AND po.tenant_id = $2`,
      [req.params.id, req.tenant_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Purchase Order not found' });
    const po = result.rows[0];

    const linesRes = await pool.query(
      `SELECT pi.*, d.item_name as material_name, d.uom, (pi.quantity * pi.unit_price)::numeric(12,2) as total_price
       FROM po_items pi
       JOIN dye_chemicals d ON pi.chemical_id = d.item_id AND d.tenant_id = $2
       WHERE pi.po_id = $1`,
      [po.po_id, req.tenant_id]
    );
    po.items = linesRes.rows;
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
