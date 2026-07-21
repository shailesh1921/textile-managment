const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const { metersToKg } = require('../utils/helpers');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.tenant_id, r.role_code, r.role_name as role, t.mill_name, t.subdomain_or_slug, t.onboarding_completed
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       JOIN tenants t ON u.tenant_id = t.tenant_id
       WHERE u.user_id = $1 AND u.tenant_id = $2`,
      [req.user.user_id, req.tenant_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/parties', authenticateToken, async (req, res) => {
  const { type } = req.query;
  try {
    let q = `SELECT * FROM parties WHERE tenant_id = $1 AND is_active = true`;
    const params = [req.tenant_id];
    if (type) {
      q += ` AND party_type = $2`;
      params.push(type);
    }
    q += ` ORDER BY party_id DESC`;
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parties', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const count = await pool.query(`SELECT COUNT(*) FROM parties WHERE tenant_id = $1`, [req.tenant_id]);
    const prefix = { TRADER_MERCHANT: 'TRD', SUPPLIER: 'SUP', TRANSPORTER: 'TRN', BROKER_AGENT: 'BRK' }[b.party_type] || 'PTY';
    const code = b.party_code || `${prefix}-${String(parseInt(count.rows[0].count, 10) + 1).padStart(3, '0')}`;
    const result = await pool.query(
      `INSERT INTO parties (tenant_id, party_code, party_type, legal_name, trade_name, gstin, pan, state_code,
        billing_address, contact_person, mobile, email, credit_limit, credit_period_days, is_job_work_client)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        req.tenant_id, code, b.party_type, b.legal_name, b.trade_name, b.gstin, b.pan,
        b.state_code || '24', b.billing_address, b.contact_person, b.mobile, b.email,
        b.credit_limit || 0, b.credit_period_days || 30, b.party_type === 'TRADER_MERCHANT',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fabrics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM fabrics WHERE tenant_id = $1 ORDER BY fabric_id`, [req.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fabrics', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO fabrics (tenant_id, fabric_code, fabric_name, fabric_category, construction_warp, construction_weft,
        width_inches, finished_width_inches, gsm, blend_composition, hsn_code, default_shrinkage_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.tenant_id, b.fabric_code, b.fabric_name, b.fabric_category || 'WOVEN',
        b.construction_warp, b.construction_weft, b.width_inches, b.finished_width_inches,
        b.gsm, JSON.stringify(b.blend_composition || {}), b.hsn_code, b.default_shrinkage_pct || 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fabrics/convert-qty', authenticateToken, async (req, res) => {
  const { meters, gsm, width_inches, kg } = req.body;
  try {
    if (meters && gsm) {
      const width = width_inches || 58;
      return res.json({ kg: metersToKg(meters, gsm, width), meters: parseFloat(meters) });
    }
    if (kg && gsm) {
      const widthM = (width_inches || 58) * 0.0254;
      const m = (parseFloat(kg) * 1000) / (widthM * parseFloat(gsm));
      return res.json({ meters: m.toFixed(3), kg: parseFloat(kg) });
    }
    res.status(400).json({ error: 'Provide meters+gsm or kg+gsm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shades', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.trade_name as customer_name 
       FROM shades s
       LEFT JOIN parties p ON s.customer_party_id = p.party_id AND p.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1 ORDER BY s.shade_id`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shades', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO shades (tenant_id, shade_card_no, shade_name, lab_l, lab_a, lab_b, delta_e_tolerance, customer_party_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.tenant_id, b.shade_card_no, b.shade_name, b.lab_l, b.lab_a, b.lab_b, b.delta_e_tolerance || 1.0, b.customer_party_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dye-chemicals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, COALESCE(SUM(s.qty_on_hand),0) as current_stock, p.trade_name as supplier_name
       FROM dye_chemicals d
       LEFT JOIN dye_chemical_stock_batches s ON d.item_id = s.item_id AND s.tenant_id = d.tenant_id
       LEFT JOIN parties p ON d.preferred_supplier_id = p.party_id AND p.tenant_id = d.tenant_id
       WHERE d.tenant_id = $1 AND d.is_active = true
       GROUP BY d.item_id, p.trade_name ORDER BY d.item_id`,
      [req.tenant_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dye-chemicals', authenticateToken, async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO dye_chemicals (tenant_id, item_code, item_name, category, uom, hsn_code, gst_rate_pct, reorder_level, reorder_qty, preferred_supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.tenant_id, b.item_code, b.item_name, b.category, b.uom || 'KG', b.hsn_code, b.gst_rate_pct || 18, b.reorder_level || 0, b.reorder_qty || 0, b.preferred_supplier_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/machines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM machines WHERE tenant_id = $1 ORDER BY machine_id`, [req.tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/machines/:id/status', authenticateToken, async (req, res) => {
  const { status, notes } = req.body;
  try {
    const old = await pool.query(`SELECT current_status FROM machines WHERE machine_id = $1 AND tenant_id = $2`, [req.params.id, req.tenant_id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Machine not found' });
    const result = await pool.query(
      `UPDATE machines SET current_status = $1 WHERE machine_id = $2 AND tenant_id = $3 RETURNING *`,
      [status, req.params.id, req.tenant_id]
    );
    await pool.query(
      `INSERT INTO machine_status_log (machine_id, old_status, new_status, changed_by, notes) VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, old.rows[0]?.current_status, status, req.user.user_id, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/process-templates', authenticateToken, async (req, res) => {
  try {
    const templates = await pool.query(
      `SELECT pt.*, f.fabric_name 
       FROM process_templates pt 
       LEFT JOIN fabrics f ON pt.fabric_id = f.fabric_id AND f.tenant_id = pt.tenant_id 
       WHERE pt.tenant_id = $1`,
      [req.tenant_id]
    );
    for (const t of templates.rows) {
      const steps = await pool.query(`SELECT * FROM process_template_steps WHERE template_id = $1 ORDER BY sequence_no`, [t.template_id]);
      t.steps = steps.rows;
    }
    res.json(templates.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recipes', authenticateToken, async (req, res) => {
  try {
    const recipes = await pool.query(
      `SELECT r.*, s.shade_name, f.fabric_name 
       FROM recipes r
       LEFT JOIN shades s ON r.shade_id = s.shade_id AND s.tenant_id = r.tenant_id
       LEFT JOIN fabrics f ON r.fabric_id = f.fabric_id AND f.tenant_id = r.tenant_id
       WHERE r.tenant_id = $1 ORDER BY r.recipe_id`,
      [req.tenant_id]
    );
    for (const r of recipes.rows) {
      const lines = await pool.query(
        `SELECT rl.*, d.item_name, d.item_code 
         FROM recipe_lines rl 
         JOIN dye_chemicals d ON rl.item_id = d.item_id AND d.tenant_id = $2
         WHERE rl.recipe_id = $1 ORDER BY rl.sequence_no`,
        [r.recipe_id, req.tenant_id]
      );
      r.lines = lines.rows;
    }
    res.json(recipes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
