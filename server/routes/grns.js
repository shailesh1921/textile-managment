const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Get all GRNs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const q = `
      SELECT g.*, p.trade_name as party_name, f.fabric_name 
      FROM greige_grn g
      JOIN parties p ON g.party_id = p.party_id AND p.tenant_id = g.tenant_id
      JOIN fabrics f ON g.fabric_id = f.fabric_id AND f.tenant_id = g.tenant_id
      WHERE g.tenant_id = $1
      ORDER BY g.created_at DESC
    `;
    const result = await pool.query(q, [req.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new GRN
router.post('/', authenticateToken, async (req, res) => {
  const { grn_no, party_id, fabric_id, challan_no, challan_meters, challan_kg, actual_meters, actual_kg, discrepancy_flagged, remarks } = req.body;
  try {
    const q = `
      INSERT INTO greige_grn (tenant_id, grn_no, party_id, fabric_id, challan_no, challan_meters, challan_kg, actual_meters, actual_kg, discrepancy_flagged, remarks, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const result = await pool.query(q, [
      req.tenant_id,
      grn_no,
      party_id,
      fabric_id,
      challan_no,
      challan_meters,
      challan_kg,
      actual_meters,
      actual_kg,
      discrepancy_flagged,
      remarks,
      req.user.user_id
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
