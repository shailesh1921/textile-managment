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
      `SELECT u.*, r.role_code, r.role_name, r.permissions, t.mill_name, t.subdomain_or_slug, t.onboarding_completed, t.gstin as mill_gstin, t.state_code as mill_state
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN tenants t ON u.tenant_id = t.tenant_id
       WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true`,
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
      tenant: {
        tenant_id: user.tenant_id,
        mill_name: user.mill_name,
        slug: user.subdomain_or_slug,
        onboarding_completed: user.onboarding_completed || false,
      },
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

// STEP 1: Multi-Tenant SaaS Signup Route
router.post('/signup', async (req, res) => {
  const { mill_name, owner_name, email, password, slug } = req.body;
  if (!mill_name || !owner_name || !email || !password || !slug) {
    return res.status(400).json({ error: 'All fields (mill_name, owner_name, email, password, slug) are required.' });
  }

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validate slug uniqueness
    const slugCheck = await client.query(`SELECT tenant_id FROM tenants WHERE subdomain_or_slug = $1`, [cleanSlug]);
    if (slugCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Slug '${cleanSlug}' is already taken. Please choose another slug.` });
    }

    // 2. Validate email uniqueness
    const userCheck = await client.query(`SELECT user_id FROM users WHERE email = $1 OR username = $1`, [email]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Email '${email}' is already registered.` });
    }

    // 3. Create Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (mill_name, subdomain_or_slug, plan_type, onboarding_completed, address)
       VALUES ($1, $2, 'STARTER', FALSE, 'Surat, Gujarat') RETURNING *`,
      [mill_name, cleanSlug]
    );
    const tenant = tenantRes.rows[0];
    const tenantId = tenant.tenant_id;

    // 4. Create Default Admin Role for this Tenant
    const roleRes = await client.query(
      `INSERT INTO roles (tenant_id, role_code, role_name, description)
       VALUES ($1, 'ADMIN', 'Owner / Admin', 'Full administrative access for tenant mill') RETURNING role_id`,
      [tenantId]
    );
    const adminRoleId = roleRes.rows[0].role_id;

    // 5. Create Owner / Admin User
    const hash = bcrypt.hashSync(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, username, email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, email, email, hash, owner_name, adminRoleId]
    );
    const newUser = userRes.rows[0];

    await client.query('COMMIT');

    // 6. Issue JWT Token (with server-derived tenant_id)
    const token = jwt.sign(
      {
        user_id: newUser.user_id,
        username: newUser.username,
        tenant_id: tenantId,
        role_code: 'ADMIN',
        role: 'Owner / Admin',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      access_token: token,
      tenant: {
        tenant_id: tenantId,
        mill_name: tenant.mill_name,
        slug: tenant.subdomain_or_slug,
        onboarding_completed: false,
      },
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: 'Owner / Admin',
        role_code: 'ADMIN',
        tenant_id: tenantId,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// STEP 4: Complete Onboarding Endpoint
router.post('/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    await pool.query(`UPDATE tenants SET onboarding_completed = TRUE WHERE tenant_id = $1`, [req.tenant_id]);
    res.json({ success: true, message: 'Onboarding completed successfully.' });
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
