const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

router.get('/summary', authenticateToken, async (req, res) => {
  const tid = req.tenant_id;
  const [pending, machines, qc, billing, shrink] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM job_orders WHERE tenant_id = $1 AND status IN ('CONFIRMED','IN_PRODUCTION','PARTIALLY_DISPATCHED')`, [tid]),
    pool.query(`SELECT COUNT(*) FILTER (WHERE current_status != 'IDLE') as active, COUNT(*) as total FROM machines WHERE tenant_id = $1`, [tid]),
    pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE result = 'PASS') as passed FROM qc_inspections WHERE tenant_id = $1`, [tid]),
    pool.query(`SELECT COALESCE(SUM(net_amount),0) as total FROM job_work_bills WHERE tenant_id = $1`, [tid]),
    pool.query(`SELECT COALESCE(AVG(cumulative_shrinkage_pct),0) as avg FROM lots WHERE tenant_id = $1 AND cumulative_shrinkage_pct > 0`, [tid]),
  ]);
  const qcTotal = parseInt(qc.rows[0].total, 10);
  res.json({
    pending_job_orders: parseInt(pending.rows[0].count, 10),
    active_machines: parseInt(machines.rows[0].active, 10),
    total_machines: parseInt(machines.rows[0].total, 10),
    qc_pass_rate: qcTotal ? ((qc.rows[0].passed / qcTotal) * 100).toFixed(1) : 100,
    job_work_billed: parseFloat(billing.rows[0].total),
    avg_shrinkage_pct: parseFloat(shrink.rows[0].avg).toFixed(2),
  });
});

router.get('/daily-production', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT pe.shift_date, pe.shift, m.machine_name, m.machine_type, SUM(pe.output_meters) as output_meters, SUM(pe.in_process_loss_pct) as loss
     FROM production_entries pe 
     JOIN machines m ON pe.machine_id = m.machine_id AND m.tenant_id = pe.tenant_id
     WHERE pe.tenant_id = $1 
     GROUP BY pe.shift_date, pe.shift, m.machine_name, m.machine_type 
     ORDER BY pe.shift_date DESC LIMIT 50`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

router.get('/consumption-variance', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT d.item_name, SUM(rdl.standard_qty) as standard_qty, SUM(rdl.actual_qty) as actual_qty,
      SUM(rdl.variance_qty) as variance_qty, AVG(rdl.variance_pct) as avg_variance_pct
     FROM recipe_dispensing_logs rdl 
     JOIN dye_chemicals d ON rdl.item_id = d.item_id AND d.tenant_id = rdl.tenant_id
     JOIN batch_runs br ON rdl.batch_id = br.batch_id AND br.tenant_id = rdl.tenant_id 
     WHERE rdl.tenant_id = $1 GROUP BY d.item_name`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

router.get('/machine-utilization', authenticateToken, async (req, res) => {
  const r = await pool.query(
    `SELECT m.machine_name, m.machine_type, m.current_status,
      COUNT(br.batch_id) as batches, COUNT(msl.log_id) as status_changes
     FROM machines m 
     LEFT JOIN batch_runs br ON m.machine_id = br.machine_id AND br.tenant_id = m.tenant_id
     LEFT JOIN machine_status_log msl ON m.machine_id = msl.machine_id
     WHERE m.tenant_id = $1 GROUP BY m.machine_id ORDER BY m.machine_name`,
    [req.tenant_id]
  );
  res.json(r.rows);
});

module.exports = router;
