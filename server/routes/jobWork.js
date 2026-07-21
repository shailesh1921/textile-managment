const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

// --- 1. JOB WORK UNITS (VENDORS) ---

// GET /api/v1/job-work/units
router.get('/units', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM job_work_units WHERE tenant_id = $1 ORDER BY id DESC`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/job-work/units
router.post('/units', authenticateToken, async (req, res) => {
  const { unit_name, contact_person, phone, address } = req.body;
  if (!unit_name) {
    return res.status(400).json({ error: 'Unit name is required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO job_work_units (tenant_id, unit_name, contact_person, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.tenant_id, unit_name, contact_person || '', phone || '', address || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/job-work/units/:id
router.put('/units/:id', authenticateToken, async (req, res) => {
  const { unit_name, contact_person, phone, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE job_work_units 
       SET unit_name = $1, contact_person = $2, phone = $3, address = $4
       WHERE id = $5 AND tenant_id = $6 RETURNING *`,
      [unit_name, contact_person, phone, address, req.params.id, req.tenant_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Job-work unit not found or access denied' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/job-work/units/:id
router.delete('/units/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM job_work_units WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [req.params.id, req.tenant_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Job-work unit not found or access denied' });
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- 2. JOB WORK ORDERS (DISPATCHES) ---

// GET /api/v1/job-work/orders
router.get('/orders', authenticateToken, async (req, res) => {
  const { status } = req.query;
  try {
    let q = `
      SELECT jwo.*, jwu.unit_name, jwu.contact_person, jwu.phone, f.fabric_name,
             COALESCE(SUM(jwr.quantity_returned), 0) as total_returned,
             COALESCE(SUM(jwr.defect_quantity), 0) as total_defects
      FROM job_work_orders jwo
      JOIN job_work_units jwu ON jwo.job_work_unit_id = jwu.id AND jwu.tenant_id = jwo.tenant_id
      JOIN fabrics f ON jwo.fabric_id = f.fabric_id AND f.tenant_id = jwo.tenant_id
      LEFT JOIN job_work_returns jwr ON jwo.id = jwr.job_work_order_id AND jwr.tenant_id = jwo.tenant_id
      WHERE jwo.tenant_id = $1
    `;
    const params = [req.tenant_id];
    if (status) {
      q += ` AND jwo.status = $${params.length + 1}`;
      params.push(status);
    }
    q += ` GROUP BY jwo.id, jwu.unit_name, jwu.contact_person, jwu.phone, f.fabric_name ORDER BY jwo.id DESC`;

    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/job-work/orders
router.post('/orders', authenticateToken, async (req, res) => {
  const { job_work_unit_id, batch_run_id, fabric_id, quantity_sent, process_type, dispatch_date, expected_return_date } = req.body;
  if (!job_work_unit_id || !fabric_id || !quantity_sent || !process_type) {
    return res.status(400).json({ error: 'job_work_unit_id, fabric_id, quantity_sent, and process_type are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // HARD CONSTRAINT 2: Verify job_work_unit belongs to req.tenant_id
    const unitCheck = await client.query(`SELECT id, unit_name, phone FROM job_work_units WHERE id = $1 AND tenant_id = $2`, [job_work_unit_id, req.tenant_id]);
    if (!unitCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job-work unit not found or access denied for this tenant.' });
    }

    // HARD CONSTRAINT 2: Verify fabric belongs to req.tenant_id
    const fabricCheck = await client.query(`SELECT fabric_id, fabric_name FROM fabrics WHERE fabric_id = $1 AND tenant_id = $2`, [fabric_id, req.tenant_id]);
    if (!fabricCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Fabric not found or access denied for this tenant.' });
    }

    // HARD CONSTRAINT 2: If batch_run_id provided, verify batch_run belongs to req.tenant_id
    if (batch_run_id) {
      const batchCheck = await client.query(`SELECT batch_id FROM batch_runs WHERE batch_id = $1 AND tenant_id = $2`, [batch_run_id, req.tenant_id]);
      if (!batchCheck.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Batch run not found or access denied for this tenant.' });
      }
    }

    // Insert order
    const orderRes = await client.query(
      `INSERT INTO job_work_orders 
        (tenant_id, job_work_unit_id, batch_run_id, fabric_id, quantity_sent, process_type, dispatch_date, expected_return_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Sent', $9) RETURNING *`,
      [
        req.tenant_id, job_work_unit_id, batch_run_id || null, fabric_id, 
        quantity_sent, process_type, dispatch_date || new Date().toISOString().slice(0, 10), 
        expected_return_date || null, req.user.user_id
      ]
    );
    const order = orderRes.rows[0];

    // Log WhatsApp notification simulation to communication_logs
    const unit = unitCheck.rows[0];
    const fabric = fabricCheck.rows[0];
    const msg = `[Job-Work Dispatch] Order #${order.id}: Dispatched ${quantity_sent}m of ${fabric.fabric_name} to ${unit.unit_name} for ${process_type}. Expected Return: ${expected_return_date || 'N/A'}`;
    await client.query(
      `INSERT INTO communication_logs (tenant_id, channel, provider, recipient_phone, template_code, message_body, status)
       VALUES ($1, 'WHATSAPP', 'SIMULATED', $2, 'JOB_WORK_DISPATCH', $3, 'SENT')`,
      [req.tenant_id, unit.phone || '+919876543210', msg]
    );

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


// --- 3. JOB WORK RETURNS (LOG RETURN & STATUS UPDATE) ---

// GET /api/v1/job-work/orders/:id/returns
router.get('/orders/:id/returns', authenticateToken, async (req, res) => {
  try {
    const returns = await pool.query(
      `SELECT jwr.*, u.full_name as receiver_name 
       FROM job_work_returns jwr
       LEFT JOIN users u ON jwr.received_by = u.user_id AND u.tenant_id = jwr.tenant_id
       WHERE jwr.job_work_order_id = $1 AND jwr.tenant_id = $2 ORDER BY jwr.id DESC`,
      [req.params.id, req.tenant_id]
    );
    res.json(returns.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/job-work/orders/:id/returns
router.post('/orders/:id/returns', authenticateToken, async (req, res) => {
  const { quantity_returned, return_date, quality_notes, defect_quantity } = req.body;
  if (!quantity_returned || parseFloat(quantity_returned) <= 0) {
    return res.status(400).json({ error: 'Valid quantity_returned > 0 is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch order and verify tenant_id
    const orderRes = await client.query(
      `SELECT * FROM job_work_orders WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenant_id]
    );
    if (!orderRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job-work order not found or access denied.' });
    }
    const order = orderRes.rows[0];

    // 2. Fetch existing total returned
    const existingReturns = await client.query(
      `SELECT COALESCE(SUM(quantity_returned), 0) as total_returned FROM job_work_returns WHERE job_work_order_id = $1 AND tenant_id = $2`,
      [order.id, req.tenant_id]
    );
    const currentReturned = parseFloat(existingReturns.rows[0].total_returned);
    const newQuantityReturned = parseFloat(quantity_returned);
    const totalReturnedAfter = currentReturned + newQuantityReturned;
    const qtySent = parseFloat(order.quantity_sent);

    // HARD CONSTRAINT 4: Reject if total returned exceeds quantity_sent
    if (totalReturnedAfter > qtySent) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot return ${newQuantityReturned}m. Total returned (${totalReturnedAfter.toFixed(2)}m) would exceed quantity sent (${qtySent.toFixed(2)}m). Current returned: ${currentReturned.toFixed(2)}m.`
      });
    }

    // 3. Insert return record
    const returnRes = await client.query(
      `INSERT INTO job_work_returns 
        (tenant_id, job_work_order_id, quantity_returned, return_date, quality_notes, defect_quantity, received_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.tenant_id, order.id, newQuantityReturned, 
        return_date || new Date().toISOString().slice(0, 10), 
        quality_notes || '', defect_quantity || 0, req.user.user_id
      ]
    );

    // HARD CONSTRAINT 3: Auto-update status
    let newStatus = 'Sent';
    if (totalReturnedAfter >= qtySent) {
      newStatus = 'Returned';
    } else if (totalReturnedAfter > 0) {
      newStatus = 'Partially Returned';
    }

    await client.query(
      `UPDATE job_work_orders SET status = $1 WHERE id = $2 AND tenant_id = $3`,
      [newStatus, order.id, req.tenant_id]
    );

    // Log WhatsApp notification
    const msg = `[Job-Work Return Logged] Order #${order.id}: Received ${newQuantityReturned}m (Defects: ${defect_quantity || 0}m). Order status updated to '${newStatus}'.`;
    await client.query(
      `INSERT INTO communication_logs (tenant_id, channel, provider, recipient_phone, template_code, message_body, status)
       VALUES ($1, 'WHATSAPP', 'SIMULATED', '+919876543210', 'JOB_WORK_RETURN', $2, 'SENT')`,
      [req.tenant_id, msg]
    );

    await client.query('COMMIT');
    res.status(201).json({
      return_record: returnRes.rows[0],
      order_status: newStatus,
      total_returned: totalReturnedAfter,
      quantity_sent: qtySent
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
