const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const q = `
      SELECT rm.*, p.trade_name as party_name, f.fabric_name
      FROM rate_master rm
      LEFT JOIN parties p ON rm.party_id = p.party_id
      LEFT JOIN fabrics f ON rm.fabric_id = f.fabric_id
      WHERE rm.tenant_id = $1
      ORDER BY rm.created_at DESC
    `;
    const result = await pool.query(q, [req.user.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { party_id, fabric_id, process_name, rate_per_meter, rate_per_kg, slab_min_qty, slab_max_qty } = req.body;
  try {
    const q = `
      INSERT INTO rate_master (tenant_id, party_id, fabric_id, process_name, rate_per_meter, rate_per_kg, slab_min_qty, slab_max_qty)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(q, [
      req.user.tenant_id,
      party_id || null,
      fabric_id || null,
      process_name,
      rate_per_meter || 0,
      rate_per_kg || 0,
      slab_min_qty || 0,
      slab_max_qty || 99999999.99
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/calculate', authenticateToken, async (req, res) => {
  const { party_id, fabric_id, process_name, qty } = req.body;
  try {
    // 1. Check exact match (party + fabric + process)
    let q = `
      SELECT * FROM rate_master 
      WHERE tenant_id = $1 AND process_name = $2 AND is_active = true
        AND slab_min_qty <= $3 AND slab_max_qty >= $3
    `;
    const result = await pool.query(q, [req.user.tenant_id, process_name, qty || 0]);
    let rates = result.rows;
    
    // Sort by most specific to least specific
    rates.sort((a, b) => {
      let scoreA = (a.party_id ? 2 : 0) + (a.fabric_id ? 1 : 0);
      let scoreB = (b.party_id ? 2 : 0) + (b.fabric_id ? 1 : 0);
      return scoreB - scoreA; // descending
    });
    
    // Find the best match
    const bestMatch = rates.find(r => 
      (r.party_id == party_id || r.party_id == null) &&
      (r.fabric_id == fabric_id || r.fabric_id == null)
    ) || rates[0];

    res.json(bestMatch || { rate_per_meter: 0, rate_per_kg: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
