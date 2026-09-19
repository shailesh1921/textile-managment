const express = require('express');
const { pool } = require('../db');
const { authenticateToken, auditLog } = require('../middleware');
const { nextDocNo, metersToKg, copyProcessStagesFromTemplate, createStandardProcessStages } = require('../utils/helpers');

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

// Public lot/challan tracking for Trader Self-Service (no authentication required)
router.get('/lots/track', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Please provide a Lot Number, LR Number, or Job Order Number.' });

    const result = await pool.query(
      `SELECT l.lot_no, l.current_status, l.grey_meters, l.grey_kg, l.barcode_value,
              jo.job_order_no, p.trade_name as party_name, f.fabric_name, s.shade_name,
              (SELECT process_name FROM lot_process_stages WHERE lot_id = l.lot_id AND status = 'IN_PROGRESS' LIMIT 1) as stage
       FROM lots l
       JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = l.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = l.tenant_id
       WHERE l.lot_no ILIKE $1 OR jo.job_order_no ILIKE $1 OR l.barcode_value ILIKE $1
       LIMIT 5`,
      [`%${q}%`]
    );

    // Also search by LR number in dispatch challans
    if (result.rows.length === 0) {
      const lrResult = await pool.query(
        `SELECT dc.challan_no, dc.vehicle_no, dc.lr_no, dc.status, dc.total_qty_meters, dc.total_qty_kg,
                p.trade_name as party_name
         FROM dispatch_challans dc
         JOIN parties p ON dc.party_id = p.party_id AND p.tenant_id = dc.tenant_id
         WHERE dc.lr_no ILIKE $1 OR dc.challan_no ILIKE $1
         LIMIT 5`,
        [`%${q}%`]
      );
      if (lrResult.rows.length > 0) {
        const r = lrResult.rows[0];
        return res.json({ lot_no: r.challan_no, current_status: r.status, stage: `LR: ${r.lr_no || 'N/A'} | Vehicle: ${r.vehicle_no || 'N/A'}`, party_name: r.party_name });
      }
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'No matching lot or challan found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lots', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, jo.job_order_no, jo.required_delivery_date, p.trade_name as party_name,
              f.fabric_name, s.shade_name
       FROM lots l
       JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
       JOIN parties p ON jo.party_id = p.party_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id
       WHERE l.tenant_id = $1
       ORDER BY l.lot_id DESC`,
      [req.tenant_id]
    );
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

router.get('/lots/:lotId/takas', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM lot_takas WHERE lot_id = $1 AND tenant_id = $2 ORDER BY taka_no`,
      [req.params.lotId, req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lots/:lotId/takas', authenticateToken, async (req, res) => {
  const { takas } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    let totalMeters = 0;
    let totalKg = 0;
    for (const t of takas) {
      const m = parseFloat(t.meters) || 0;
      const kg = parseFloat(t.weight_kg) || 0;
      totalMeters += m;
      totalKg += kg;
      const result = await client.query(
        `INSERT INTO lot_takas (tenant_id, lot_id, taka_no, meters, weight_kg, grade, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (lot_id, taka_no) DO UPDATE 
         SET meters = EXCLUDED.meters, weight_kg = EXCLUDED.weight_kg, grade = EXCLUDED.grade, remarks = EXCLUDED.remarks
         RETURNING *`,
        [req.tenant_id, req.params.lotId, t.taka_no, m, kg, t.grade || 'FRESH', t.remarks]
      );
      inserted.push(result.rows[0]);
    }

    // Update lot inward totals
    await client.query(
      `UPDATE lots SET grey_qty_meters_in = COALESCE(grey_qty_meters_in, 0) + $1,
                       grey_qty_kg_in = COALESCE(grey_qty_kg_in, 0) + $2
       WHERE lot_id = $3 AND tenant_id = $4`,
      [totalMeters, totalKg, req.params.lotId, req.tenant_id]
    );

    // Auto-create standard process route card stages if not yet existing
    const existingStages = await client.query(
      `SELECT stage_id FROM lot_process_stages WHERE lot_id = $1`,
      [req.params.lotId]
    );
    if (existingStages.rows.length === 0) {
      await createStandardProcessStages(client, req.tenant_id, req.params.lotId, totalMeters, totalKg);
    }

    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/lots/:lotId/lot-card-pdf', authenticateToken, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const lotId = req.params.lotId;
    
    const lotRes = await pool.query(
      `SELECT l.*, jo.job_order_no, p.trade_name as party_name, f.fabric_name, s.shade_name
       FROM lots l
       JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = l.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = l.tenant_id
       WHERE l.lot_id = $1 AND l.tenant_id = $2`,
      [lotId, req.tenant_id]
    );
    
    if (lotRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    const lot = lotRes.rows[0];

    const takasRes = await pool.query(
      `SELECT * FROM lot_takas WHERE lot_id = $1 AND tenant_id = $2 ORDER BY taka_no`,
      [lotId, req.tenant_id]
    );
    
    const stagesRes = await pool.query(
      `SELECT * FROM lot_process_stages WHERE lot_id = $1 ORDER BY sequence_no`,
      [lotId]
    );

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="lot-card-${lotId}.pdf"`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(20).text('LOT CARD', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text(`Lot No: ${lot.lot_no}`);
    doc.font('Helvetica').text(`Barcode: ${lot.barcode_value}`);
    doc.text(`Status: ${lot.current_status}`);
    doc.text(`Job Order: ${lot.job_order_no}`);
    doc.text(`Party: ${lot.party_name}`);
    doc.text(`Fabric: ${lot.fabric_name}`);
    doc.text(`Shade: ${lot.shade_name || 'N/A'}`);
    doc.moveDown();

    if (lot.barcode_value) {
      const qrDataUrl = await QRCode.toDataURL(lot.barcode_value);
      doc.image(qrDataUrl, 450, 60, { width: 100 });
    }

    doc.font('Helvetica-Bold').fontSize(14).text('Process Stages');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    stagesRes.rows.forEach(s => {
      doc.text(`${s.sequence_no}. ${s.process_name} (${s.machine_type}) - ${s.status}`);
    });
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(14).text('Takas');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    takasRes.rows.forEach(t => {
      doc.text(`Taka ${t.taka_no}: ${t.meters}m / ${t.weight_kg}kg (${t.grade})`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Taka 4" x 2" Thermal Label PDF (288 x 144 points)
router.get('/lots/:lotId/takas/:takaId/sticker-pdf', authenticateToken, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const { lotId, takaId } = req.params;

    const query = `
      SELECT t.*, l.lot_no, l.barcode_value, jo.job_order_no, p.trade_name as party_name, f.fabric_name
      FROM lot_takas t
      JOIN lots l ON t.lot_id = l.lot_id AND l.tenant_id = t.tenant_id
      JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
      JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = l.tenant_id
      JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
      WHERE t.taka_id = $1 AND t.lot_id = $2 AND t.tenant_id = $3
    `;
    const r = await pool.query(query, [takaId, lotId, req.tenant_id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Taka not found' });
    const taka = r.rows[0];

    // Standard 4" x 2" thermal sticker: 288 x 144 pt
    const doc = new PDFDocument({ size: [288, 144], margin: 8 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="taka-sticker-${taka.taka_id}.pdf"`);
    doc.pipe(res);

    doc.rect(4, 4, 280, 136).stroke('#222222');
    doc.font('Helvetica-Bold').fontSize(10).text('SARV UTTAM TEXTILE MILL', 10, 8, { width: 190 });
    doc.font('Helvetica').fontSize(7).text(`Party: ${taka.party_name.substring(0, 28)}`, 10, 22);
    doc.fontSize(7).text(`Fabric: ${taka.fabric_name}`, 10, 32);
    doc.font('Helvetica-Bold').fontSize(9).text(`LOT: ${taka.lot_no}`, 10, 44);
    doc.fontSize(11).fillColor('#10B981').text(`TAKA #${taka.taka_no}`, 10, 58).fillColor('#000000');
    doc.font('Helvetica-Bold').fontSize(9).text(`LENGTH: ${taka.meters} M`, 10, 74);
    doc.fontSize(9).text(`WEIGHT: ${taka.weight_kg} KG`, 10, 88);
    doc.font('Helvetica').fontSize(7).text(`GRADE: ${taka.grade || 'FRESH'}  •  DATE: ${new Date().toISOString().slice(0, 10)}`, 10, 104);
    doc.fontSize(6).text(`REF: ${taka.job_order_no}`, 10, 120);

    const takaCode = `${taka.lot_no}-TK${String(taka.taka_no).padStart(3, '0')}`;
    const qrData = await QRCode.toDataURL(takaCode);
    doc.image(qrData, 195, 18, { width: 84 });
    doc.font('Helvetica-Bold').fontSize(6).text(takaCode, 195, 108, { width: 84, align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk 4" x 2" Thermal Stickers PDF for all Takas in Lot
router.get('/lots/:lotId/thermal-stickers-pdf', authenticateToken, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const { lotId } = req.params;

    const takasRes = await pool.query(
      `SELECT t.*, l.lot_no, l.barcode_value, jo.job_order_no, p.trade_name as party_name, f.fabric_name
       FROM lot_takas t
       JOIN lots l ON t.lot_id = l.lot_id AND l.tenant_id = t.tenant_id
       JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
       JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = l.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
       WHERE t.lot_id = $1 AND t.tenant_id = $2
       ORDER BY t.taka_no`,
      [lotId, req.tenant_id]
    );

    if (takasRes.rows.length === 0) return res.status(404).json({ error: 'No takas found for this lot' });
    const takas = takasRes.rows;

    const doc = new PDFDocument({ size: [288, 144], margin: 8, autoFirstPage: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="lot-${lotId}-thermal-stickers.pdf"`);
    doc.pipe(res);

    for (let i = 0; i < takas.length; i++) {
      const taka = takas[i];
      doc.addPage({ size: [288, 144], margin: 8 });
      doc.rect(4, 4, 280, 136).stroke('#222222');
      doc.font('Helvetica-Bold').fontSize(10).text('SARV UTTAM TEXTILE MILL', 10, 8, { width: 190 });
      doc.font('Helvetica').fontSize(7).text(`Party: ${taka.party_name.substring(0, 28)}`, 10, 22);
      doc.fontSize(7).text(`Fabric: ${taka.fabric_name}`, 10, 32);
      doc.font('Helvetica-Bold').fontSize(9).text(`LOT: ${taka.lot_no}`, 10, 44);
      doc.fontSize(11).fillColor('#10B981').text(`TAKA #${taka.taka_no}`, 10, 58).fillColor('#000000');
      doc.font('Helvetica-Bold').fontSize(9).text(`LENGTH: ${taka.meters} M`, 10, 74);
      doc.fontSize(9).text(`WEIGHT: ${taka.weight_kg} KG`, 10, 88);
      doc.font('Helvetica').fontSize(7).text(`GRADE: ${taka.grade || 'FRESH'}  •  DATE: ${new Date().toISOString().slice(0, 10)}`, 10, 104);
      doc.fontSize(6).text(`REF: ${taka.job_order_no}`, 10, 120);

      const takaCode = `${taka.lot_no}-TK${String(taka.taka_no).padStart(3, '0')}`;
      const qrData = await QRCode.toDataURL(takaCode);
      doc.image(qrData, 195, 18, { width: 84 });
      doc.font('Helvetica-Bold').fontSize(6).text(takaCode, 195, 108, { width: 84, align: 'center' });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
