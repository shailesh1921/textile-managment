const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../middleware');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.*, r.role_code, r.role_name, r.permissions, t.mill_name, t.gstin as mill_gstin, t.state_code as mill_state
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN tenants t ON u.tenant_id = t.tenant_id
       WHERE u.username = $1 AND u.is_active = true`,
      [username]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });
    const user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        tenant_id: user.tenant_id,
        role_code: user.role_code,
        role: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);
    res.json({
      access_token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        role_code: user.role_code,
        tenant_id: user.tenant_id,
        mill_name: user.mill_name,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
