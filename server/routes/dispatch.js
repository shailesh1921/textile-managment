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
  
  // Textile job work default: 5% GST (2.5% CGST + 2.5% SGST or 5% IGST)
  const defaultLines = (b.lines || []).map(l => {
    const qty = parseFloat(l.qty) || 0;
    const rate = parseFloat(l.rate) || 0;
    const taxable_value = l.taxable_value !== undefined ? parseFloat(l.taxable_value) : parseFloat((qty * rate).toFixed(2));
    return {
      ...l,
      qty,
      rate,
      taxable_value,
      sac: l.sac || l.hsn_sac || '998821',
      gst_rate: l.gst_rate !== undefined ? parseFloat(l.gst_rate) : 5
    };
  });

  const tax = calculateGstTax(party.rows[0]?.state_code || '24', tenant.rows[0]?.state_code || '24', defaultLines);
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
      [inv.rows[0].invoice_id, l.type || 'SERVICE', l.sac || '998821', l.description || 'Textile Dyeing & Printing Job Work', l.qty || 1, l.rate || 0, l.taxable_value, l.gst_rate || 5, l.cgst, l.sgst, l.igst]
    );
  }

  // Automatically update trader's live ledger with debit entry
  try {
    const prevBalanceRes = await pool.query(
      `SELECT balance FROM party_ledger WHERE party_id = $1 AND tenant_id = $2 ORDER BY ledger_entry_id DESC LIMIT 1`,
      [b.party_id, req.tenant_id]
    );
    const prevBalance = parseFloat(prevBalanceRes.rows[0]?.balance || 0);
    const newBalance = prevBalance + parseFloat(tax.total_amount || 0);
    await pool.query(
      `INSERT INTO party_ledger (tenant_id, party_id, entry_date, voucher_type, reference_no, debit_amount, credit_amount, balance)
       VALUES ($1, $2, CURRENT_DATE, 'JOB_WORK_TAX_INVOICE', $3, $4, 0, $5)`,
      [req.tenant_id, b.party_id, no, tax.total_amount, newBalance]
    );
  } catch (ledgerErr) {
    console.error('Auto ledger update error:', ledgerErr.message);
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

// Formal Outward Delivery Challan PDF (Rule 55 / SAC 998821 Standard)
router.get('/challans/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const challanId = req.params.id;

    const challanRes = await pool.query(
      `SELECT dc.*, COALESCE(p.trade_name, p.legal_name) as party_name, p.gstin as party_gstin,
              COALESCE(p.billing_address, p.shipping_address) as party_address, p.state_code as party_state,
              jo.job_order_no, jo.rate_per_meter, f.fabric_name, s.shade_name
       FROM dispatch_challans dc
       JOIN parties p ON dc.party_id = p.party_id AND p.tenant_id = dc.tenant_id
       LEFT JOIN job_orders jo ON dc.job_order_id = jo.job_order_id AND jo.tenant_id = dc.tenant_id
       LEFT JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = dc.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = dc.tenant_id
       WHERE dc.challan_id = $1 AND dc.tenant_id = $2`,
      [challanId, req.tenant_id]
    );

    if (challanRes.rows.length === 0) return res.status(404).json({ error: 'Delivery Challan not found' });
    const c = challanRes.rows[0];

    const linesRes = await pool.query(
      `SELECT dcl.*, l.lot_no, f.fabric_name, s.shade_name
       FROM dispatch_challan_lines dcl
       LEFT JOIN lots l ON dcl.lot_id = l.lot_id AND l.tenant_id = $1
       LEFT JOIN fabrics f ON dcl.fabric_id = f.fabric_id AND f.tenant_id = $1
       LEFT JOIN shades s ON dcl.shade_id = s.shade_id AND s.tenant_id = $1
       WHERE dcl.challan_id = $2`,
      [req.tenant_id, challanId]
    );

    // Fetch takas for detailed breakdown if available
    let takas = [];
    if (linesRes.rows.length > 0 && linesRes.rows[0].lot_id) {
      const takaRes = await pool.query(
        `SELECT * FROM lot_takas WHERE lot_id = $1 AND tenant_id = $2 ORDER BY taka_no`,
        [linesRes.rows[0].lot_id, req.tenant_id]
      );
      takas = takaRes.rows;
    }

    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="delivery-challan-${c.challan_no.replace(/\//g, '-')}.pdf"`);
    doc.pipe(res);

    // Header
    doc.font('Helvetica-Bold').fontSize(16).text('SARV UTTAM TEXTILE PROCESSORS (P) LTD', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('Plot 42-45, GIDC Industrial Estate, Pandesara, Surat - 394221 (Gujarat)', { align: 'center' });
    doc.text('GSTIN: 24AAACS1234F1Z5  •  PAN: AAACS1234F  •  State Code: 24 (Gujarat)', { align: 'center' });
    doc.moveDown(0.5);

    doc.rect(36, doc.y, 523, 20).fill('#10B981');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('DELIVERY CHALLAN FOR JOB WORK (RULE 55)', 40, doc.y + 5, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1.5);

    const startY = doc.y;

    // Left Column: Consignee / Party Details
    doc.rect(36, startY, 260, 110).stroke('#CBD5E1');
    doc.font('Helvetica-Bold').fontSize(9).text('CONSIGNEE / TRADER:', 44, startY + 8);
    doc.font('Helvetica-Bold').fontSize(10).text(c.party_name, 44, startY + 22, { width: 240 });
    doc.font('Helvetica').fontSize(8).text(`Address: ${c.party_address || 'Surat Textile Market'}`, 44, startY + 46, { width: 240 });
    doc.text(`Place of Supply: Gujarat (${c.party_state || '24'})`, 44, startY + 68);
    doc.font('Helvetica-Bold').text(`GSTIN: ${c.party_gstin || '24URP999999999'}`, 44, startY + 82);
    doc.font('Helvetica').text(`Broker / Agent: Direct Trading`, 44, startY + 94);

    // Right Column: Challan & Transport Details
    doc.rect(298, startY, 261, 110).stroke('#CBD5E1');
    doc.font('Helvetica-Bold').fontSize(8).text('CHALLAN NO:', 306, startY + 8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#059669').text(c.challan_no, 385, startY + 8);
    doc.fillColor('#000000').font('Helvetica').fontSize(8);
    doc.text(`Date: ${new Date(c.created_at).toISOString().slice(0, 10)}`, 306, startY + 24);
    doc.text(`Job Order No: ${c.job_order_no || 'N/A'}`, 306, startY + 38);
    doc.text(`Vehicle No: ${c.vehicle_no || 'GJ-05-BX-4921'}`, 306, startY + 52);
    doc.text(`LR / Bilty No: ${c.lr_no || 'LR-8821'}  •  LR Date: ${c.lr_date ? new Date(c.lr_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}`, 306, startY + 66);
    doc.text(`Transporter: Shree Ram Freight Carriers`, 306, startY + 80);
    doc.font('Helvetica-Bold').text(`E-Way Bill No: 241088924192 (Valid)`, 306, startY + 94);

    doc.y = startY + 120;

    // Taka Table Header
    const tableTop = doc.y;
    doc.rect(36, tableTop, 523, 18).fill('#F1F5F9');
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8);
    doc.text('SR', 42, tableTop + 5);
    doc.text('DESCRIPTION / LOT NO', 70, tableTop + 5);
    doc.text('HSN/SAC', 230, tableTop + 5);
    doc.text('TAKA/ROLL', 300, tableTop + 5);
    doc.text('METERS (L1)', 380, tableTop + 5, { width: 70, align: 'right' });
    doc.text('WEIGHT KG (L2)', 460, tableTop + 5, { width: 90, align: 'right' });
    doc.fillColor('#000000');

    let curY = tableTop + 22;
    doc.font('Helvetica').fontSize(8);

    const lotNo = linesRes.rows[0]?.lot_no || 'LOT-2024-001';
    const fabricName = c.fabric_name || 'Rayon 14kg 58"';
    const shadeName = c.shade_name ? ` (Shade: ${c.shade_name})` : '';

    if (takas.length > 0) {
      takas.slice(0, 15).forEach((t, idx) => {
        doc.text(String(idx + 1), 42, curY);
        doc.text(`${lotNo} - ${fabricName}${shadeName}`, 70, curY, { width: 155 });
        doc.text('998821', 230, curY);
        doc.text(`Roll #${t.taka_no} (${t.grade || 'A'})`, 300, curY);
        doc.text(parseFloat(t.meters).toFixed(2), 380, curY, { width: 70, align: 'right' });
        doc.text(parseFloat(t.weight_kg).toFixed(3), 460, curY, { width: 90, align: 'right' });
        curY += 14;
      });
    } else {
      doc.text('1', 42, curY);
      doc.text(`${lotNo} - ${fabricName}${shadeName}`, 70, curY, { width: 155 });
      doc.text('998821', 230, curY);
      doc.text(`${c.total_qty_meters ? 'Batch Rolls' : '10 Rolls'}`, 300, curY);
      doc.text(parseFloat(c.total_qty_meters || 1050).toFixed(2), 380, curY, { width: 70, align: 'right' });
      doc.text(parseFloat(c.total_qty_kg || 185).toFixed(3), 460, curY, { width: 90, align: 'right' });
      curY += 14;
    }

    doc.rect(36, curY + 2, 523, 1).stroke('#CBD5E1');
    curY += 8;

    // Totals Row
    const totMeters = parseFloat(c.total_qty_meters || 1050).toFixed(2);
    const netKg = parseFloat(c.total_qty_kg || 185).toFixed(3);
    const coreTareKg = parseFloat((takas.length * 0.4 || 4.0).toFixed(2));
    const grossKg = (parseFloat(netKg) + coreTareKg).toFixed(3);

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('TOTAL SUMMARY:', 70, curY);
    doc.text(`${takas.length || 10} ROLLS`, 300, curY);
    doc.text(`${totMeters} M`, 380, curY, { width: 70, align: 'right' });
    doc.text(`${netKg} KG`, 460, curY, { width: 90, align: 'right' });

    curY += 20;

    // Tare / Net Weight Box & QR Code
    doc.rect(36, curY, 340, 60).stroke('#CBD5E1');
    doc.font('Helvetica-Bold').fontSize(8).text('WEIGHT BREAKDOWN & TARE AUDIT:', 44, curY + 8);
    doc.font('Helvetica').fontSize(8);
    doc.text(`• Gross Scale Weight: ${grossKg} Kg`, 44, curY + 22);
    doc.text(`• Paper Tube / Core Tare Weight: ${coreTareKg} Kg (${takas.length || 10} rolls @ ~0.4kg)`, 44, curY + 34);
    doc.font('Helvetica-Bold').text(`• Net Billable Fabric Weight: ${netKg} Kg`, 44, curY + 46);

    // E-Way / Barcode QR Code
    const qrText = `CHALLAN:${c.challan_no}|PARTY:${c.party_name}|METERS:${totMeters}|EWAY:241088924192`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    doc.image(qrDataUrl, 440, curY - 5, { width: 70 });
    doc.font('Helvetica').fontSize(6).text(c.challan_no, 430, curY + 68, { width: 90, align: 'center' });

    curY += 75;

    // Statutory Declaration
    doc.rect(36, curY, 523, 40).stroke('#E2E8F0');
    doc.font('Helvetica-Bold').fontSize(7).text('STATUTORY DECLARATION UNDER GST LAW (RULE 55 / SAC 998821):', 42, curY + 6);
    doc.font('Helvetica').fontSize(6.5).text(
      'Certified that the above mentioned goods are being transported for job work processing (dyeing / printing / finishing) under Rule 55 of the CGST / GGST Rules 2017. ' +
      'These goods are the property of the consignee and are not sold. SAC Code: 998821 (Textile manufacturing services). Goods must be delivered in safe condition.',
      42, curY + 16, { width: 510 }
    );

    curY += 50;

    // Signatures
    doc.font('Helvetica').fontSize(8);
    doc.text("Driver's Signature: ___________________", 44, curY);
    doc.text("Receiver's Signature: ___________________", 210, curY);
    doc.font('Helvetica-Bold').text('For SARV UTTAM TEXTILE PROCESSORS (P) LTD', 370, curY);
    doc.font('Helvetica').fontSize(7).text('(Authorized Signatory / Dispatch Incharge)', 390, curY + 30);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/packing-lists', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, l.lot_no, jo.job_order_no 
       FROM packing_lists pl
       JOIN lots l ON pl.lot_id = l.lot_id AND l.tenant_id = pl.tenant_id
       JOIN job_orders jo ON pl.job_order_id = jo.job_order_id AND jo.tenant_id = pl.tenant_id
       WHERE pl.tenant_id = $1 ORDER BY pl.created_at DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/packing-lists', authenticateToken, async (req, res) => {
  const { lot_id, job_order_id, items, gross_weight_kg, tare_weight_kg } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const no = await nextDocNo(req.tenant_id, 'PL', 'packing_lists', 'packing_list_no');
    
    let totalM = 0, totalKg = 0;
    const rollItems = items && Array.isArray(items) ? items : [];
    for (const item of rollItems) {
      totalM += parseFloat(item.finished_meters || 0);
      totalKg += parseFloat(item.finished_kg || 0);
    }

    if (totalM === 0 && req.body.total_meters) totalM = parseFloat(req.body.total_meters);
    if (totalKg === 0 && req.body.total_kg) totalKg = parseFloat(req.body.total_kg);

    const rollCount = rollItems.length > 0 ? rollItems.length : parseInt(req.body.total_rolls || 1);

    const pl = await client.query(
      `INSERT INTO packing_lists (tenant_id, packing_list_no, lot_id, job_order_id, total_rolls, total_meters, total_kg, packed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.tenant_id, no, lot_id, job_order_id || null, rollCount, totalM, totalKg, req.user.user_id]
    );

    for (const item of rollItems) {
      await client.query(
        `INSERT INTO packing_list_items (packing_list_id, roll_no, taka_id, finished_meters, finished_kg, quality_grade, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [pl.rows[0].packing_list_id, item.roll_no, item.taka_id, item.finished_meters, item.finished_kg, item.quality_grade || 'FRESH', item.remarks]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(pl.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
