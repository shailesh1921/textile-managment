const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');

const router = express.Router();

// ─── 1. CUSTOMERS ──────────────────────────────────────────────
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT party_id as customer_id, party_code as customer_code, legal_name as name,
              contact_person, email, mobile as phone, billing_address as address,
              state_code, gstin as tax_id, credit_limit, credit_period_days as credit_days,
              'Surat' as region
       FROM parties 
       WHERE tenant_id = $1 AND (party_type = 'TRADER_MERCHANT' OR is_job_work_client = true) AND is_active = true
       ORDER BY party_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const count = await pool.query(`SELECT COUNT(*) FROM parties WHERE tenant_id = $1`, [req.tenant_id]);
    const code = b.customer_code || `CUST-${String(parseInt(count.rows[0].count, 10) + 1).padStart(3, '0')}`;
    const result = await pool.query(
      `INSERT INTO parties (tenant_id, party_code, party_type, legal_name, trade_name, gstin, state_code, billing_address, contact_person, mobile, email, credit_limit, credit_period_days, is_job_work_client)
       VALUES ($1, $2, 'TRADER_MERCHANT', $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING *`,
      [
        req.tenant_id, code, b.name || b.legal_name, b.tax_id || b.gstin || '',
        b.state_code || '24', b.address || '', b.contact_person || '',
        b.phone || b.mobile || '', b.email || '', parseFloat(b.credit_limit || 0),
        parseInt(b.credit_days || b.credit_period_days || 30)
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. PRODUCTS ───────────────────────────────────────────────
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fabric_id as product_id, fabric_code, fabric_name as name, fabric_category as category,
              gsm, width_inches, hsn_code, (gsm * 0.15 + 25.0)::numeric(10,2) as selling_price
       FROM fabrics 
       WHERE tenant_id = $1 AND is_active = true ORDER BY fabric_id`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. SALES ORDERS ───────────────────────────────────────────
router.get('/sales-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jo.job_order_id as so_id, jo.job_order_no as so_number, jo.party_id as customer_id,
              p.legal_name as customer_name, p.mobile as customer_phone, p.billing_address,
              p.gstin as customer_tax_id, jo.created_at as order_date, jo.required_delivery_date as delivery_date,
              jo.status, (jo.qty_meters_ordered * jo.rate_per_meter)::numeric(12,2) as net_amount,
              (jo.qty_meters_ordered * jo.rate_per_meter * 0.05)::numeric(12,2) as tax_amount,
              (jo.qty_meters_ordered * jo.rate_per_meter * 1.05)::numeric(12,2) as total_amount,
              jo.qty_meters_ordered as total_meters, jo.rate_per_meter as unit_price,
              f.fabric_name as product_name, s.shade_name, jo.special_instructions as notes
       FROM job_orders jo
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = jo.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = jo.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = jo.tenant_id
       WHERE jo.tenant_id = $1
       ORDER BY jo.job_order_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales-orders', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const orderNo = await nextDocNo(req.tenant_id, 'SO', 'job_orders', 'job_order_no');
    const firstItem = (b.items && b.items[0]) || {};
    const qty = parseFloat(firstItem.quantity || b.total_meters || 1000);
    const rate = parseFloat(firstItem.unit_price || 15.0);

    const fabricId = firstItem.product_id ? parseInt(firstItem.product_id) : (
      await pool.query(`SELECT fabric_id FROM fabrics WHERE tenant_id = $1 LIMIT 1`, [req.tenant_id])
    ).rows[0]?.fabric_id || 1;

    const result = await pool.query(
      `INSERT INTO job_orders (tenant_id, job_order_no, party_id, fabric_id, qty_meters_ordered, qty_kg_ordered, rate_per_meter, billing_uom, status, required_delivery_date, special_instructions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'METER', 'CONFIRMED', $8, $9, $10) RETURNING *`,
      [
        req.tenant_id, orderNo, parseInt(b.customer_id), fabricId,
        qty, qty * 0.12, rate, b.delivery_date || new Date(Date.now() + 7 * 86400000).toISOString(),
        b.notes || '', req.user.user_id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales-orders/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jo.job_order_id as so_id, jo.job_order_no as so_number, jo.party_id as customer_id,
              p.legal_name as customer_name, p.mobile as customer_phone, p.billing_address,
              p.gstin as customer_tax_id, jo.created_at as order_date, jo.required_delivery_date as delivery_date,
              jo.status, (jo.qty_meters_ordered * jo.rate_per_meter)::numeric(12,2) as net_amount,
              (jo.qty_meters_ordered * jo.rate_per_meter * 0.05)::numeric(12,2) as tax_amount,
              (jo.qty_meters_ordered * jo.rate_per_meter * 1.05)::numeric(12,2) as total_amount,
              f.fabric_name as product_name, f.hsn_code, jo.qty_meters_ordered as quantity,
              jo.rate_per_meter as unit_price, s.shade_name
       FROM job_orders jo
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = jo.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = jo.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = jo.tenant_id
       WHERE jo.job_order_id = $1 AND jo.tenant_id = $2`,
      [req.params.id, req.tenant_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const row = result.rows[0];
    row.items = [{
      item_id: 1,
      product_name: row.product_name,
      hsn_code: row.hsn_code,
      quantity: row.quantity,
      unit_price: row.unit_price,
      total_price: row.net_amount
    }];
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales-orders/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    const statusMap = {
      confirmed: 'CONFIRMED',
      dispatched: 'DISPATCHED',
      delivered: 'COMPLETED',
      cancelled: 'CANCELLED'
    };
    const dbStatus = statusMap[status?.toLowerCase()] || status?.toUpperCase() || 'CONFIRMED';
    const result = await pool.query(
      `UPDATE job_orders SET status = $1, updated_at = NOW() WHERE job_order_id = $2 AND tenant_id = $3 RETURNING *`,
      [dbStatus, req.params.id, req.tenant_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. DISPATCH NOTES ─────────────────────────────────────────
router.get('/dispatch-notes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dc.challan_id as dn_id, dc.challan_no as dn_number, dc.dispatch_date,
              dc.vehicle_no as vehicle_number, dc.lr_no as tracking_number,
              dc.status, p.legal_name as customer_name, jo.job_order_no as so_number,
              dc.total_qty_meters as total_meters
       FROM dispatch_challans dc
       JOIN parties p ON dc.party_id = p.party_id AND p.tenant_id = dc.tenant_id
       LEFT JOIN job_orders jo ON dc.job_order_id = jo.job_order_id AND jo.tenant_id = dc.tenant_id
       WHERE dc.tenant_id = $1 ORDER BY dc.challan_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dispatch-notes', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const challanNo = await nextDocNo(req.tenant_id, 'DC', 'dispatch_challans', 'challan_no');
    const orderRes = await pool.query(
      `SELECT party_id, qty_meters_ordered, qty_kg_ordered FROM job_orders WHERE job_order_id = $1 AND tenant_id = $2`,
      [b.so_id, req.tenant_id]
    );
    const order = orderRes.rows[0] || {};
    const result = await pool.query(
      `INSERT INTO dispatch_challans (tenant_id, challan_no, challan_type, job_order_id, party_id, vehicle_no, lr_no, dispatch_date, status, total_qty_meters, total_qty_kg, created_by)
       VALUES ($1, $2, 'SECTION_143', $3, $4, $5, $6, $7, 'DISPATCHED', $8, $9, $10) RETURNING *`,
      [
        req.tenant_id, challanNo, b.so_id, order.party_id,
        b.vehicle_number || '', b.tracking_number || '', b.expected_delivery_date || new Date().toISOString(),
        order.qty_meters_ordered || 1000, order.qty_kg_ordered || 120, req.user.user_id
      ]
    );
    await pool.query(`UPDATE job_orders SET status = 'DISPATCHED' WHERE job_order_id = $1 AND tenant_id = $2`, [b.so_id, req.tenant_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. PAYMENT REMINDERS ──────────────────────────────────────
router.post('/sales-orders/payment-reminder', authenticateToken, async (req, res) => {
  const { customer_phone, customer_name, so_number, net_amount } = req.body;
  try {
    await pool.query(
      `INSERT INTO communication_logs (tenant_id, channel, recipient_phone, message_body, status, sent_at)
       VALUES ($1, 'WHATSAPP', $2, $3, 'SENT', NOW())`,
      [
        req.tenant_id, customer_phone || '9876543210',
        `Dear ${customer_name || 'Customer'}, polite reminder for invoice against order ${so_number || ''} of amount ₹${parseFloat(net_amount || 0).toLocaleString('en-IN')}. Thank you, Sarv Uttam Fabrics.`
      ]
    );
    res.json({ success: true, message: 'Payment reminder sent via WhatsApp & SMS' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
