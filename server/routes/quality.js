const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo, calcDeltaE } = require('../utils/helpers');

const router = express.Router();

router.get('/queue', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, jo.job_order_no, f.fabric_name, s.shade_name
       FROM lots l 
       JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
       LEFT JOIN shades s ON jo.shade_id = s.shade_id AND s.tenant_id = l.tenant_id
       WHERE l.tenant_id = $1 AND l.current_status IN ('QC_HOLD','UNLOADING','WAITING')
       AND NOT EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.lot_id = l.lot_id AND qi.tenant_id = l.tenant_id AND qi.inspection_type = 'FINAL_4PT' AND qi.result = 'PASS')
       ORDER BY l.lot_id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inspections', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qi.*, l.lot_no, u.full_name as inspector_name 
       FROM qc_inspections qi
       JOIN lots l ON qi.lot_id = l.lot_id AND l.tenant_id = qi.tenant_id 
       JOIN users u ON qi.inspector_id = u.user_id AND u.tenant_id = qi.tenant_id
       WHERE qi.tenant_id = $1 ORDER BY qi.inspection_id DESC LIMIT 100`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inspections', authenticateToken, async (req, res) => {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lotCheck = await client.query(`SELECT lot_id FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [b.lot_id, req.tenant_id]);
    if (!lotCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lot not found or access denied' });
    }

    const inspNo = await nextDocNo(req.tenant_id, 'QC', 'qc_inspections', 'inspection_no');
    const totalPoints = (b.defects || []).reduce((s, d) => s + parseFloat(d.points_assigned || 0), 0);
    const result = await client.query(
      `INSERT INTO qc_inspections (tenant_id, inspection_no, lot_id, stage_id, inspection_type, inspection_system, total_points, qty_inspected_meters, result, inspector_id, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.tenant_id, inspNo, b.lot_id, b.stage_id, b.inspection_type, b.inspection_system, totalPoints, b.qty_inspected_meters, b.result || 'PENDING', req.user.user_id, b.remarks]
    );
    for (const d of b.defects || []) {
      await client.query(
        `INSERT INTO qc_defects (inspection_id, defect_code, severity, points_assigned, location) VALUES ($1,$2,$3,$4,$5)`,
        [result.rows[0].inspection_id, d.defect_code, d.severity || 'MINOR', d.points_assigned || 0, d.location]
      );
    }
    if (b.result === 'PASS' && b.inspection_type === 'FINAL_4PT') {
      const lot = await client.query(
        `SELECT l.*, jo.*, f.fabric_id, jo.shade_id 
         FROM lots l 
         JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = l.tenant_id
         JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = l.tenant_id
         WHERE l.lot_id = $1 AND l.tenant_id = $2`,
        [b.lot_id, req.tenant_id]
      );
      const lt = lot.rows[0];
      await client.query(
        `INSERT INTO finished_goods_inventory (tenant_id, lot_id, job_order_id, fabric_id, shade_id, quality_grade, qty_meters, qty_kg, ownership_type, qc_inspection_id)
         VALUES ($1,$2,$3,$4,$5,'A',$6,$7,$8,$9)`,
        [req.tenant_id, b.lot_id, lt.job_order_id, lt.fabric_id, lt.shade_id, lt.finished_qty_meters || lt.grey_qty_meters_in, lt.finished_qty_kg || lt.grey_qty_kg_in, lt.ownership_type, result.rows[0].inspection_id]
      );
      await client.query(`UPDATE lots SET current_status = 'COMPLETED' WHERE lot_id = $1 AND tenant_id = $2`, [b.lot_id, req.tenant_id]);
    }
    if (b.result === 'HOLD' || b.result === 'FAIL') {
      await client.query(`UPDATE lots SET current_status = 'QC_HOLD' WHERE lot_id = $1 AND tenant_id = $2`, [b.lot_id, req.tenant_id]);
    }
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/shade-approval', authenticateToken, async (req, res) => {
  const { lot_id, shade_id, measured_l, measured_a, measured_b } = req.body;
  try {
    const shade = await pool.query(`SELECT lab_l, lab_a, lab_b, delta_e_tolerance FROM shades WHERE shade_id = $1 AND tenant_id = $2`, [shade_id, req.tenant_id]);
    if (!shade.rows.length) return res.status(404).json({ error: 'Shade not found or access denied' });
    const s = shade.rows[0];
    const deltaE = calcDeltaE(measured_l, measured_a, measured_b, s.lab_l, s.lab_a, s.lab_b);
    const tolerance = parseFloat(s.delta_e_tolerance);
    let resultStatus = 'PASS';
    if (deltaE > tolerance * 1.5) resultStatus = 'FAIL';
    else if (deltaE > tolerance) resultStatus = 'SHADE_BAND';
    const log = await pool.query(
      `INSERT INTO shade_approval_logs (lot_id, shade_id, measured_l, measured_a, measured_b, delta_e, tolerance, result, approved_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [lot_id, shade_id, measured_l, measured_a, measured_b, deltaE, tolerance, resultStatus, req.user.user_id]
    );
    res.status(201).json(log.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lab-tests', authenticateToken, async (req, res) => {
  const { lot_id, tests } = req.body;
  try {
    const lotCheck = await pool.query(`SELECT lot_id FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [lot_id, req.tenant_id]);
    if (!lotCheck.rows.length) return res.status(404).json({ error: 'Lot not found or access denied' });

    const results = [];
    for (const t of tests) {
      const r = await pool.query(
        `INSERT INTO lab_test_results (lot_id, test_type, required_value, actual_value, uom, result) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [lot_id, t.test_type, t.required_value, t.actual_value, t.uom, t.result || 'PASS']
      );
      results.push(r.rows[0]);
    }
    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/defect-codes', authenticateToken, async (req, res) => {
  res.json([
    { defect_code: 'COLOR_PATCH', defect_name: 'Color Patch / Spot' },
    { defect_code: 'CREASE_MARK', defect_name: 'Crease Mark' },
    { defect_code: 'SHADE_BAND', defect_name: 'Shade Band / Variation' },
    { defect_code: 'STAINING', defect_name: 'Staining / Oil Marks' },
    { defect_code: 'HOLE', defect_name: 'Hole / Tear' },
    { defect_code: 'BOWING', defect_name: 'Bowing / Skewing' },
    { defect_code: 'UNEVEN_WIDTH', defect_name: 'Uneven Width' },
  ]);
});

module.exports = router;
