const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { nextDocNo, calcShrinkage } = require('../utils/helpers');
const QRCode = require('qrcode');

const router = express.Router();

router.get('/machines/dashboard', authenticateToken, async (req, res) => {
  try {
    const machines = await pool.query(
      `SELECT m.*, br.batch_no, br.status as batch_status, l.lot_no, l.barcode_value, jo.job_order_no
       FROM machines m
       LEFT JOIN batch_runs br ON br.machine_id = m.machine_id AND br.tenant_id = m.tenant_id AND br.status IN ('LOADING','IN_PROCESS','UNLOADING','QC_HOLD')
       LEFT JOIN lots l ON br.lot_id = l.lot_id AND l.tenant_id = m.tenant_id
       LEFT JOIN job_orders jo ON l.job_order_id = jo.job_order_id AND jo.tenant_id = m.tenant_id
       WHERE m.tenant_id = $1 AND m.is_active = true ORDER BY m.machine_type, m.machine_code`,
      [req.tenant_id]
    );
    res.json(machines.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, l.lot_no, l.barcode_value, m.machine_name, lps.process_name, u.full_name as operator_name
       FROM batch_runs br
       JOIN lots l ON br.lot_id = l.lot_id AND l.tenant_id = br.tenant_id
       JOIN machines m ON br.machine_id = m.machine_id AND m.tenant_id = br.tenant_id
       JOIN lot_process_stages lps ON br.stage_id = lps.stage_id AND lps.tenant_id = br.tenant_id
       LEFT JOIN users u ON br.operator_id = u.user_id AND u.tenant_id = br.tenant_id
       WHERE br.tenant_id = $1 ORDER BY br.batch_id DESC LIMIT 100`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', authenticateToken, async (req, res) => {
  const { lot_id, stage_id, machine_id, recipe_id, shift, fabric_weight_kg } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify lot belongs to tenant
    const lotCheck = await client.query(`SELECT lot_id FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [lot_id, req.tenant_id]);
    if (!lotCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lot not found or access denied' });
    }

    const batchNo = await nextDocNo(req.tenant_id, 'BAT', 'batch_runs', 'batch_no');
    const batch = await client.query(
      `INSERT INTO batch_runs (tenant_id, batch_no, lot_id, stage_id, machine_id, recipe_id, status, shift, operator_id, fabric_weight_kg, loaded_at)
       VALUES ($1,$2,$3,$4,$5,$6,'LOADING',$7,$8,$9,NOW()) RETURNING *`,
      [req.tenant_id, batchNo, lot_id, stage_id, machine_id, recipe_id, shift || 'A', req.user.user_id, fabric_weight_kg]
    );
    await client.query(`UPDATE machines SET current_status = 'LOADING' WHERE machine_id = $1 AND tenant_id = $2`, [machine_id, req.tenant_id]);
    await client.query(`UPDATE lot_process_stages SET status = 'LOADING', assigned_machine_id = $1, actual_start = NOW() WHERE stage_id = $2 AND tenant_id = $3`, [machine_id, stage_id, req.tenant_id]);
    await client.query(`UPDATE lots SET current_status = 'LOADING' WHERE lot_id = $1 AND tenant_id = $2`, [lot_id, req.tenant_id]);
    await client.query('COMMIT');
    res.status(201).json(batch.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.patch('/batches/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const batch = await client.query(`SELECT * FROM batch_runs WHERE batch_id = $1 AND tenant_id = $2`, [req.params.id, req.tenant_id]);
    if (!batch.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Batch not found' });
    }
    const b = batch.rows[0];
    let extra = '';
    if (status === 'IN_PROCESS') extra = ', started_at = NOW()';
    if (status === 'COMPLETED') extra = ', completed_at = NOW()';
    const updated = await client.query(`UPDATE batch_runs SET status = $1 ${extra} WHERE batch_id = $2 AND tenant_id = $3 RETURNING *`, [status, req.params.id, req.tenant_id]);
    const machineStatus = { LOADING: 'LOADING', IN_PROCESS: 'IN_PROCESS', UNLOADING: 'UNLOADING', QC_HOLD: 'QC_HOLD', COMPLETED: 'IDLE' }[status] || status;
    await client.query(`UPDATE machines SET current_status = $1 WHERE machine_id = $2 AND tenant_id = $3`, [machineStatus, b.machine_id, req.tenant_id]);
    await client.query(`UPDATE lot_process_stages SET status = $1 WHERE stage_id = $2 AND tenant_id = $3`, [status, b.stage_id, req.tenant_id]);
    await client.query(`UPDATE lots SET current_status = $1 WHERE lot_id = $2 AND tenant_id = $3`, [status === 'COMPLETED' ? 'WAITING' : status, b.lot_id, req.tenant_id]);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/batches/:id/dispensing', authenticateToken, async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const batchCheck = await client.query(`SELECT batch_id FROM batch_runs WHERE batch_id = $1 AND tenant_id = $2`, [req.params.id, req.tenant_id]);
    if (!batchCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Batch not found or access denied' });
    }

    const logs = [];
    for (const item of items) {
      const variance = parseFloat(item.actual_qty) - parseFloat(item.standard_qty);
      const variancePct = item.standard_qty ? ((variance / item.standard_qty) * 100).toFixed(2) : 0;
      const log = await client.query(
        `INSERT INTO recipe_dispensing_logs (tenant_id, batch_id, item_id, stock_batch_id, standard_qty, actual_qty, variance_qty, variance_pct, dispensed_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.tenant_id, req.params.id, item.item_id, item.stock_batch_id, item.standard_qty, item.actual_qty, variance, variancePct, req.user.user_id]
      );
      if (item.stock_batch_id) {
        await client.query(`UPDATE dye_chemical_stock_batches SET qty_on_hand = qty_on_hand - $1 WHERE stock_batch_id = $2 AND tenant_id = $3`, [item.actual_qty, item.stock_batch_id, req.tenant_id]);
        await client.query(
          `INSERT INTO stock_movements (tenant_id, movement_type, item_category, item_id, stock_batch_id, reference_type, reference_id, qty, created_by)
           VALUES ($1,'DISPENSING_OUT','DYE_CHEMICAL',$2,$3,'BATCH_RUN',$4,$5,$6)`,
          [req.tenant_id, item.item_id, item.stock_batch_id, req.params.id, item.actual_qty, req.user.user_id]
        );
      }
      logs.push(log.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(logs);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/entries', authenticateToken, async (req, res) => {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const batchCheck = await client.query(`SELECT lot_id, stage_id FROM batch_runs WHERE batch_id = $1 AND tenant_id = $2`, [b.batch_id, req.tenant_id]);
    if (!batchCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Batch not found or access denied' });
    }

    const entry = await client.query(
      `INSERT INTO production_entries (tenant_id, batch_id, shift_date, shift, operator_id, machine_id, input_meters, input_kg, output_meters, output_kg, in_process_loss_pct, downtime_mins, downtime_reason, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.tenant_id, b.batch_id, b.shift_date || new Date().toISOString().slice(0, 10), b.shift || 'A', req.user.user_id, b.machine_id, b.input_meters, b.input_kg, b.output_meters, b.output_kg, b.in_process_loss_pct || 0, b.downtime_mins || 0, b.downtime_reason, b.remarks]
    );

    const { lot_id, stage_id } = batchCheck.rows[0];
    const lossPct = b.input_meters ? (((b.input_meters - b.output_meters) / b.input_meters) * 100).toFixed(2) : 0;
    await client.query(
      `UPDATE lot_process_stages SET output_meters = $1, output_kg = $2, stage_loss_pct = $3, status = 'COMPLETED', actual_end = NOW() WHERE stage_id = $4 AND tenant_id = $5`,
      [b.output_meters, b.output_kg, lossPct, stage_id, req.tenant_id]
    );
    const lot = await client.query(`SELECT grey_qty_meters_in FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [lot_id, req.tenant_id]);
    const cumShrink = calcShrinkage(lot.rows[0].grey_qty_meters_in, b.output_meters);
    await client.query(`UPDATE lots SET finished_qty_meters = $1, finished_qty_kg = $2, cumulative_shrinkage_pct = $3 WHERE lot_id = $4 AND tenant_id = $5`, [b.output_meters, b.output_kg, cumShrink, lot_id, req.tenant_id]);
    await client.query('COMMIT');
    res.status(201).json(entry.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/reprocess', authenticateToken, async (req, res) => {
  const { original_lot_id, reason_code, corrective_action } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orig = await client.query(`SELECT * FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [original_lot_id, req.tenant_id]);
    if (!orig.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Original lot not found or access denied' });
    }
    const o = orig.rows[0];
    const lotNo = await nextDocNo(req.tenant_id, 'LOT-RP', 'lots', 'lot_no');
    const barcode = `SKD-RP-${Date.now()}`;
    const newLot = await client.query(
      `INSERT INTO lots (tenant_id, lot_no, job_order_id, parent_lot_id, lot_type, barcode_value, grey_qty_meters_in, grey_qty_kg_in, current_status, is_reprocess, reprocess_reason_code)
       VALUES ($1,$2,$3,$4,'REPROCESS',$5,$6,$7,'WAITING',TRUE,$8) RETURNING *`,
      [req.tenant_id, lotNo, o.job_order_id, o.lot_id, barcode, o.finished_qty_meters || o.grey_qty_meters_in, o.finished_qty_kg || o.grey_qty_kg_in, reason_code]
    );
    await client.query(
      `INSERT INTO lot_genealogy (tenant_id, parent_lot_id, child_lot_id, relationship, reason, created_by) VALUES ($1,$2,$3,'REPROCESS',$4,$5)`,
      [req.tenant_id, o.lot_id, newLot.rows[0].lot_id, reason_code, req.user.user_id]
    );
    await client.query(
      `INSERT INTO reprocess_records (tenant_id, original_lot_id, new_lot_id, reason_code, corrective_action, approved_by) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.tenant_id, o.lot_id, newLot.rows[0].lot_id, reason_code, corrective_action, req.user.user_id]
    );
    await client.query('COMMIT');
    res.status(201).json(newLot.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/shrinkage/:lotId', authenticateToken, async (req, res) => {
  try {
    const stages = await pool.query(
      `SELECT process_name, input_meters, output_meters, stage_loss_pct, cumulative_shrinkage_pct FROM lot_process_stages WHERE lot_id = $1 AND tenant_id = $2 ORDER BY sequence_no`,
      [req.params.lotId, req.tenant_id]
    );
    const lot = await pool.query(`SELECT grey_qty_meters_in, finished_qty_meters, cumulative_shrinkage_pct FROM lots WHERE lot_id = $1 AND tenant_id = $2`, [req.params.lotId, req.tenant_id]);
    if (!lot.rows.length) return res.status(404).json({ error: 'Lot not found' });
    res.json({ lot: lot.rows[0], stages: stages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches/:id/qr', authenticateToken, async (req, res) => {
  try {
    const batchId = req.params.id;
    const batchRes = await pool.query(
      `SELECT br.*, l.lot_no, l.barcode_value, m.machine_name, ps.process_name 
       FROM batch_runs br
       LEFT JOIN lots l ON br.lot_id = l.lot_id AND l.tenant_id = br.tenant_id
       LEFT JOIN machines m ON br.machine_id = m.machine_id AND m.tenant_id = br.tenant_id
       LEFT JOIN process_templates ps ON br.stage_id = ps.template_id AND ps.tenant_id = br.tenant_id
       WHERE br.batch_id = $1 AND br.tenant_id = $2`,
      [batchId, req.tenant_id]
    );

    if (batchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = batchRes.rows[0];
    const payload = JSON.stringify({
      batchId: batch.batch_id,
      batchNo: batch.batch_no,
      lotNo: batch.lot_no,
      machine: batch.machine_name,
      stage: batch.process_name,
      status: batch.status
    });

    const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
    res.json({ batch, qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
