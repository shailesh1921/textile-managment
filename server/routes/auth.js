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

router.post('/register', async (req, res) => {
  const { username, password, email, full_name, mill_name, gstin, register_type } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = bcrypt.hashSync(password, 10);
    let tenantId = '00000000-0000-0000-0000-000000000001'; // default tenant

    if (register_type === 'NEW_MILL') {
      // Create a new tenant mill
      const tResult = await client.query(
        `INSERT INTO tenants (mill_name, gstin, address) VALUES ($1, $2, 'Surat, Gujarat') RETURNING tenant_id`,
        [mill_name || `${full_name}'s Mill`, gstin || `24AAACS${Math.floor(Math.random() * 100000)}A1Z0`]
      );
      tenantId = tResult.rows[0].tenant_id;

      // Seed default roles for this new tenant
      const defaultRoles = [
        [1, 'ADMIN', 'Administrator'],
        [2, 'PRODUCTION_MANAGER', 'Production Manager'],
        [3, 'MACHINE_OPERATOR', 'Machine Operator'],
        [4, 'QC_INSPECTOR', 'QC Inspector'],
        [5, 'ACCOUNTS', 'Accounts'],
        [6, 'DISPATCH', 'Dispatch'],
        [7, 'PARTY_PORTAL', 'Party Portal'],
      ];
      for (const [rid, code, name] of defaultRoles) {
        await client.query(
          `INSERT INTO roles (role_id, tenant_id, role_code, role_name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [rid, tenantId, code, name]
        );
      }
    }

    // Insert user
    const roleId = register_type === 'NEW_MILL' ? 1 : 7; // Mill Admin or Party Portal
    const userResult = await client.query(
      `INSERT INTO users (tenant_id, username, email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, username, email || `${username}@skdyeing.com`, hash, full_name, roleId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Registration successful', user: userResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
