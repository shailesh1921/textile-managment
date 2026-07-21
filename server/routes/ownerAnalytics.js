const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

// 1. Late Orders Widget
router.get('/late-orders', authenticateToken, async (req, res) => {
  try {
    const q = `
      SELECT jo.job_order_id, jo.job_order_no, p.trade_name as party_name, f.fabric_name,
             jo.required_delivery_date, jo.qty_meters_ordered, jo.status,
             CURRENT_DATE - jo.required_delivery_date as days_late
      FROM job_orders jo
      JOIN parties p ON jo.party_id = p.party_id AND p.tenant_id = jo.tenant_id
      JOIN fabrics f ON jo.fabric_id = f.fabric_id AND f.tenant_id = jo.tenant_id
      WHERE jo.tenant_id = $1 
        AND jo.required_delivery_date < CURRENT_DATE 
        AND jo.status NOT IN ('COMPLETED', 'CANCELLED')
      ORDER BY days_late DESC
    `;
    const result = await pool.query(q, [req.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Order Status Breakdown Widget
router.get('/status-breakdown', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || '2020-01-01';
  const end = endDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  try {
    const q = `
      SELECT jo.status, COUNT(*) as count, COALESCE(SUM(jo.qty_meters_ordered), 0) as total_meters
      FROM job_orders jo
      WHERE jo.tenant_id = $1
        AND jo.created_at >= $2::timestamp
        AND jo.created_at <= ($3::date + INTERVAL '1 day')::timestamp
      GROUP BY jo.status
    `;
    const result = await pool.query(q, [req.tenant_id, start, end]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Job-Work Turnaround Widget
router.get('/job-work-turnaround', authenticateToken, async (req, res) => {
  try {
    const q = `
      SELECT jwu.id as unit_id, jwu.unit_name, jwu.contact_person,
             COUNT(jwo.id) as total_orders,
             COALESCE(AVG(jwr_max.latest_return_date - jwo.dispatch_date), 0)::numeric(10,1) as avg_turnaround_days
      FROM job_work_units jwu
      LEFT JOIN job_work_orders jwo ON jwu.id = jwo.job_work_unit_id AND jwo.tenant_id = jwu.tenant_id AND jwo.status = 'Returned'
      LEFT JOIN (
        SELECT job_work_order_id, MAX(return_date) as latest_return_date
        FROM job_work_returns
        WHERE tenant_id = $1
        GROUP BY job_work_order_id
      ) jwr_max ON jwo.id = jwr_max.job_work_order_id
      WHERE jwu.tenant_id = $1
      GROUP BY jwu.id, jwu.unit_name, jwu.contact_person
      ORDER BY avg_turnaround_days DESC
    `;
    const result = await pool.query(q, [req.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Labor / Production Volume Widget
router.get('/production-volume', authenticateToken, async (req, res) => {
  const { period } = req.query;
  const dateFormat = period === 'monthly' ? 'YYYY-MM' : 'YYYY-WW';
  try {
    const q = `
      SELECT 
        TO_CHAR(shift_date, '${dateFormat}') as period_label,
        SUM(output_meters) as total_output_meters,
        SUM(output_kg) as total_output_kg,
        COUNT(DISTINCT operator_id) as active_operators
      FROM production_entries
      WHERE tenant_id = $1
      GROUP BY TO_CHAR(shift_date, '${dateFormat}')
      ORDER BY period_label DESC
      LIMIT 12
    `;
    const result = await pool.query(q, [req.tenant_id]);
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
