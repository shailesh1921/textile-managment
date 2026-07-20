const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Helper to generate 6-digit random numeric OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/v1/client-portal/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { mobile, jobOrderNo } = req.body;
    if (!mobile || !jobOrderNo) {
      return res.status(400).json({ error: 'Mobile number and Job Order number are required' });
    }

    // Check matching job order
    const orderRes = await pool.query(
      `SELECT jo.*, p.legal_name, p.mobile as party_mobile 
       FROM job_orders jo
       JOIN parties p ON jo.party_id = p.party_id
       WHERE jo.order_no = $1`,
      [jobOrderNo]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Job Order not found with the specified order number' });
    }

    const order = orderRes.rows[0];
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    // Save token
    await pool.query(
      `INSERT INTO client_otp_tokens (mobile, job_order_id, otp_code, expires_at) VALUES ($1, $2, $3, $4)`,
      [mobile, order.job_order_id, otpCode, expiresAt]
    );

    console.log(`[CLIENT OTP] Mobile: ${mobile} | Order #${jobOrderNo} | OTP: ${otpCode}`);

    res.json({
      success: true,
      message: `OTP sent to registered mobile ${mobile}.`,
      demoOtp: otpCode // Provided in response for easy testing
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/client-portal/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, jobOrderNo, otpCode } = req.body;
    if (!mobile || !jobOrderNo || !otpCode) {
      return res.status(400).json({ error: 'Mobile, Job Order No, and OTP are required' });
    }

    // Verify OTP matching
    const tokenRes = await pool.query(
      `SELECT t.*, jo.order_no, jo.order_date, jo.status as order_status, jo.total_meters, jo.total_weight_kg, p.legal_name as client_name, f.fabric_name
       FROM client_otp_tokens t
       JOIN job_orders jo ON t.job_order_id = jo.job_order_id
       JOIN parties p ON jo.party_id = p.party_id
       JOIN fabrics f ON jo.fabric_id = f.fabric_id
       WHERE t.mobile = $1 AND jo.order_no = $2 AND t.otp_code = $3 AND t.expires_at > NOW()
       ORDER BY t.created_at DESC LIMIT 1`,
      [mobile, jobOrderNo, otpCode]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP code' });
    }

    const order = tokenRes.rows[0];

    // Mark verified
    await pool.query(`UPDATE client_otp_tokens SET is_verified = TRUE WHERE token_id = $1`, [order.token_id]);

    // Fetch lot stages and batch history
    const lotsRes = await pool.query(`SELECT * FROM lots WHERE job_order_id = $1`, [order.job_order_id]);
    const batchRes = await pool.query(
      `SELECT b.*, m.machine_name, ps.process_name 
       FROM batch_runs b
       LEFT JOIN machines m ON b.machine_id = m.machine_id
       LEFT JOIN process_templates ps ON b.stage_id = ps.template_id
       WHERE b.lot_id IN (SELECT lot_id FROM lots WHERE job_order_id = $1)
       ORDER BY b.started_at DESC`,
      [order.job_order_id]
    );

    res.json({
      success: true,
      orderInfo: {
        orderNo: order.order_no,
        orderDate: order.order_date,
        status: order.order_status,
        clientName: order.client_name,
        fabricName: order.fabric_name,
        totalMeters: order.total_meters,
        totalKg: order.total_weight_kg
      },
      lots: lotsRes.rows,
      batches: batchRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
