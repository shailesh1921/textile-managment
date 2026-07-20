const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo } = require('../utils/helpers');
const PDFDocument = require('pdfkit');

const router = express.Router();

router.post('/job-work/run', authenticateToken, async (req, res) => {
  const { job_order_id } = req.body;
  const jo = await pool.query(`SELECT * FROM job_orders WHERE job_order_id = $1`, [job_order_id]);
  if (!jo.rows.length) return res.status(404).json({ error: 'Not found' });
  const o = jo.rows[0];
  const lot = await pool.query(`SELECT COALESCE(SUM(finished_qty_meters),0) as m, COALESCE(SUM(finished_qty_kg),0) as kg FROM lots WHERE job_order_id = $1`, [job_order_id]);
  const qty = o.billing_uom === 'KG' ? lot.rows[0].kg : lot.rows[0].m;
  const rate = o.billing_uom === 'KG' ? o.rate_per_kg : o.rate_per_meter;
  const gross = parseFloat(qty) * parseFloat(rate);
  const no = await nextDocNo(req.user.tenant_id, 'BILL', 'job_work_bills', 'bill_no');
  const bill = await pool.query(
    `INSERT INTO job_work_bills (tenant_id, job_order_id, bill_no, processed_qty_meters, processed_qty_kg, rate, gross_amount, net_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,
    [req.user.tenant_id, job_order_id, no, lot.rows[0].m, lot.rows[0].kg, rate, gross]
  );
  res.status(201).json(bill.rows[0]);
});

router.get('/ledger', authenticateToken, async (req, res) => {
  const { party_id } = req.query;
  const r = await pool.query(`SELECT * FROM party_ledger WHERE tenant_id = $1 AND party_id = $2 ORDER BY entry_date`, [req.user.tenant_id, party_id]);
  res.json(r.rows);
});

router.get('/ageing', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT p.party_id, p.trade_name, p.outstanding_balance, p.credit_period_days,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date <= 30 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_0_30,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date BETWEEN 31 AND 60 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_31_60,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date BETWEEN 61 AND 90 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_61_90,
      COALESCE(SUM(CASE WHEN CURRENT_DATE - pl.entry_date > 90 THEN pl.debit_amount - pl.credit_amount ELSE 0 END),0) as bucket_90_plus
     FROM parties p LEFT JOIN party_ledger pl ON p.party_id = pl.party_id
     WHERE p.tenant_id = $1 AND p.party_type = 'TRADER_MERCHANT' GROUP BY p.party_id ORDER BY p.trade_name`,
    [req.user.tenant_id]);
  res.json(r.rows);
});

router.get('/lot-cost/:lotId', authenticateToken, async (req, res) => {
  const lotId = req.params.lotId;
  const disp = await pool.query(
    `SELECT COALESCE(SUM(rdl.actual_qty * dcs.unit_cost),0) as recipe_cost FROM recipe_dispensing_logs rdl
     JOIN batch_runs br ON rdl.batch_id = br.batch_id
     LEFT JOIN dye_chemical_stock_batches dcs ON rdl.stock_batch_id = dcs.stock_batch_id WHERE br.lot_id = $1`, [lotId]);
  const jo = await pool.query(`SELECT jo.rate_per_meter, jo.qty_meters_ordered FROM lots l JOIN job_orders jo ON l.job_order_id = jo.job_order_id WHERE l.lot_id = $1`, [lotId]);
  const recipeCost = parseFloat(disp.rows[0].recipe_cost);
  const billed = parseFloat(jo.rows[0]?.rate_per_meter || 0) * parseFloat(jo.rows[0]?.qty_meters_ordered || 0);
  const machineCost = recipeCost * 0.3;
  const total = recipeCost + machineCost;
  const sheet = await pool.query(
    `INSERT INTO lot_cost_sheets (tenant_id, lot_id, recipe_cost, machine_hour_cost, total_cost, billed_amount, profit_margin, profit_margin_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING *`,
    [req.user.tenant_id, lotId, recipeCost, machineCost, total, billed, billed - total, billed ? (((billed - total) / billed) * 100).toFixed(2) : 0]
  );
router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const billId = req.params.id;
    const billRes = await pool.query(
      `SELECT b.*, jo.order_no, p.legal_name as party_name, p.gstin as party_gstin, p.billing_address, f.fabric_name 
       FROM job_work_bills b
       JOIN job_orders jo ON b.job_order_id = jo.job_order_id
       JOIN parties p ON jo.party_id = p.party_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id
       WHERE b.bill_id = $1`,
      [billId]
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
    doc.fontSize(20).text('SK DYEING & FINISHING MILLS', { align: 'center' });
    doc.fontSize(10).text('Plot 42, GIDC Pandesara Industrial Estate, Surat, Gujarat - 394221', { align: 'center' });
    doc.text('GSTIN: 24AAACS1234F1Z9 | Phone: +91 98765 43210', { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown();

    // Invoice Meta
    doc.fontSize(16).text('TAX INVOICE (JOB-WORK)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Invoice No: ${bill.bill_no}`);
    doc.text(`Date: ${new Date(bill.created_at || Date.now()).toLocaleDateString('en-IN')}`);
    doc.text(`Job Order No: ${bill.order_no}`);
    doc.moveDown();

    // Client Info
    doc.text(`Billed To: ${bill.party_name}`);
    if (bill.party_gstin) doc.text(`GSTIN: ${bill.party_gstin}`);
    if (bill.billing_address) doc.text(`Address: ${bill.billing_address}`);
    doc.moveDown();

    // Table Header
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold');
    doc.text('Item / Service', 50, doc.y, { width: 200 });
    doc.text('Processed Qty', 250, doc.y - 12, { width: 100 });
    doc.text('Rate', 370, doc.y - 12, { width: 80 });
    doc.text('Amount (Rs)', 470, doc.y - 12, { width: 90 });
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.5);

    // Line Item
    const qtyText = `${bill.processed_qty_meters || bill.processed_qty_kg} ${bill.billing_uom || 'Meters'}`;
    const rateText = `Rs. ${bill.rate}`;
    const amtText = `Rs. ${bill.gross_amount}`;

    doc.text(`Dyeing & Finishing Job-work (${bill.fabric_name})`, 50, doc.y, { width: 200 });
    doc.text(qtyText, 250, doc.y - 12, { width: 100 });
    doc.text(rateText, 370, doc.y - 12, { width: 80 });
    doc.text(amtText, 470, doc.y - 12, { width: 90 });

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown();

    // Total Amount
    doc.font('Helvetica-Bold');
    doc.text(`TOTAL AMOUNT: Rs. ${bill.net_amount || bill.gross_amount}`, { align: 'right' });
    doc.moveDown(2);

    doc.font('Helvetica');
    doc.text('Terms & Conditions:', { underline: true });
    doc.text('1. Payment due within credit period terms.');
    doc.text('2. Goods once delivered cannot be returned unless QC defect flagged within 48 hours.');
    doc.moveDown(2);

    doc.text('Authorized Signatory for SK Dyeing & Finishing', { align: 'right' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
