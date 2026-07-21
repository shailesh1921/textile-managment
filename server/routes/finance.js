const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');
const PDFDocument = require('pdfkit');

const router = express.Router();

router.post('/job-work/run', authenticateToken, async (req, res) => {
  const { job_order_id } = req.body;
  const jo = await pool.query(`SELECT * FROM job_orders WHERE job_order_id = $1 AND tenant_id = $2`, [job_order_id, req.tenant_id]);
  if (!jo.rows.length) return res.status(404).json({ error: 'Job order not found or access denied' });
  const o = jo.rows[0];
  const lot = await pool.query(`SELECT COALESCE(SUM(finished_qty_meters),0) as m, COALESCE(SUM(finished_qty_kg),0) as kg FROM lots WHERE job_order_id = $1 AND tenant_id = $2`, [job_order_id, req.tenant_id]);
  const qty = o.billing_uom === 'KG' ? lot.rows[0].kg : lot.rows[0].m;
  const rate = o.billing_uom === 'KG' ? o.rate_per_kg : o.rate_per_meter;
  const gross = parseFloat(qty) * parseFloat(rate);
  const no = await nextDocNo(req.tenant_id, 'BILL', 'job_work_bills', 'bill_no');
  const bill = await pool.query(
    `INSERT INTO job_work_bills (tenant_id, job_order_id, bill_no, processed_qty_meters, processed_qty_kg, rate, gross_amount, net_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,
    [req.tenant_id, job_order_id, no, lot.rows[0].m, lot.rows[0].kg, rate, gross]
  );
  res.status(201).json(bill.rows[0]);
});

router.get('/ledger', authenticateToken, async (req, res) => {
  const { party_id } = req.query;
  const r = await pool.query(`SELECT * FROM party_ledger WHERE tenant_id = $1 AND party_id = $2 ORDER BY entry_date`, [req.tenant_id, party_id]);
  res.json(r.rows);
});

router.get('/ageing', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT p.party_id, p.trade_name, p.outstanding_balance, p.credit_period_days,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date <= 30 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_0_30,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date BETWEEN 31 AND 60 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_31_60,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date BETWEEN 61 AND 90 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_61_90,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date > 90 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_90_plus
     FROM parties p LEFT JOIN party_ledger pl ON p.party_id = pl.party_id AND pl.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1 AND p.party_type = 'TRADER_MERCHANT' GROUP BY p.party_id ORDER BY p.trade_name`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

router.get('/lot-cost/:lotId', authenticateToken, async (req, res) => {
  const lotId = req.params.lotId;
  const disp = await pool.query(
    `SELECT COALESCE(SUM(rdl.actual_qty * dcs.unit_cost),0) as recipe_cost 
     FROM recipe_dispensing_logs rdl
     JOIN batch_runs br ON rdl.batch_id = br.batch_id AND br.tenant_id = rdl.tenant_id
     LEFT JOIN dye_chemical_stock_batches dcs ON rdl.stock_batch_id = dcs.stock_batch_id AND dcs.tenant_id = rdl.tenant_id 
     WHERE br.lot_id = $1 AND br.tenant_id = $2`, 
    [lotId, req.tenant_id]
  );
  const jo = await pool.query(`SELECT jo.rate_per_meter, jo.qty_meters_ordered FROM lots l JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id WHERE l.lot_id = $1 AND l.tenant_id = $2`, [lotId, req.tenant_id]);
  const recipeCost = parseFloat(disp.rows[0]?.recipe_cost || 0);
  const billed = parseFloat(jo.rows[0]?.rate_per_meter || 0) * parseFloat(jo.rows[0]?.qty_meters_ordered || 0);
  const machineCost = recipeCost * 0.3;
  const total = recipeCost + machineCost;
  const sheet = await pool.query(
    `INSERT INTO lot_cost_sheets (tenant_id, lot_id, recipe_cost, machine_hour_cost, total_cost, billed_amount, profit_margin, profit_margin_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING *`,
    [req.tenant_id, lotId, recipeCost, machineCost, total, billed, billed - total, billed ? (((billed - total) / billed) * 100).toFixed(2) : 0]
  );
  res.json(sheet.rows[0] || { lot_id: lotId, recipe_cost: recipeCost, total_cost: total, billed_amount: billed });
});

router.get('/invoices/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const billId = req.params.id;
    const billRes = await pool.query(
      `SELECT b.*, jo.order_no, p.legal_name as party_name, p.gstin as party_gstin, p.billing_address, f.fabric_name 
       FROM job_work_bills b
       JOIN job_orders jo ON b.job_order_id = jo.job_order_id AND jo.tenant_id = b.tenant_id
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = b.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = b.tenant_id
       WHERE b.bill_id = $1 AND b.tenant_id = $2`,
      [billId, req.tenant_id]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const bill = billRes.rows[0];

    // Create PDF Document
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${bill.bill_no}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SURAT TEXTILE ERP INVOICE', { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown();

    // Invoice Meta
    doc.fontSize(16).text('TAX INVOICE (JOB-WORK)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Invoice No: ${bill.bill_no}`);
    doc.text(`Date: ${new Date(bill.created_at || Date.now()).toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Client Info
    doc.text(`Billed To: ${bill.party_name}`);
    if (bill.party_gstin) doc.text(`GSTIN: ${bill.party_gstin}`);
    doc.moveDown();

    // Line Item
    const qtyText = `${bill.processed_qty_meters || bill.processed_qty_kg} ${bill.billing_uom || 'Meters'}`;
    doc.text(`Dyeing & Finishing Job-work (${bill.fabric_name}) - Qty: ${qtyText} @ Rs. ${bill.rate}`);
    doc.moveDown();

    // Total Amount
    doc.font('Helvetica-Bold');
    doc.text(`TOTAL AMOUNT: Rs. ${bill.net_amount || bill.gross_amount}`, { align: 'right' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
