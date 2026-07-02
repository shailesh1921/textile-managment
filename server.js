const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET || 'sarvuttam_secret_key';

// Middlewares
app.use(cors());
app.use(express.json());

// Neon PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to Neon PostgreSQL database:', err.stack);
  } else {
    console.log('Successfully connected to Neon PostgreSQL database!');
    release();
  }
});

// Helper for JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// WhatsApp alert helper using Twilio
async function sendWhatsAppAlert(customerId, orderId, phone, messageText) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNum = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  
  // Format phone number to standard E.164 (prefix with +91 if 10-digit Indian number)
  let formattedPhone = phone ? phone.trim() : '';
  if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }
  if (!formattedPhone.startsWith('whatsapp:')) {
    formattedPhone = `whatsapp:${formattedPhone}`;
  }

  let status = 'Simulated';
  let errorMsg = null;

  if (sid && token && phone) {
    try {
      const client = twilio(sid, token);
      await client.messages.create({
        body: messageText,
        from: fromNum,
        to: formattedPhone
      });
      status = 'Sent';
      console.log(`WhatsApp sent to ${formattedPhone}: "${messageText}"`);
    } catch (err) {
      status = 'Failed';
      errorMsg = err.message;
      console.error(`Twilio send failed for ${formattedPhone}:`, err.message);
    }
  } else {
    console.log(`[SIMULATED WHATSAPP] To: ${formattedPhone} | Msg: "${messageText}"`);
  }

  try {
    await pool.query(
      `INSERT INTO communication_logs (customer_id, order_id, channel, recipient, message, status)
       VALUES ($1, $2, 'WhatsApp', $3, $4, $5)`,
      [customerId, orderId, formattedPhone, messageText, status]
    );
  } catch (err) {
    console.error('Failed to write communication log to database:', err.message);
  }
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.*, r.role_name, r.permissions 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.username = $1 AND u.is_active = true`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = result.rows[0];
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Create token
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

    res.json({
      access_token: token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, r.role_name as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PROCUREMENT ENDPOINTS
// ==========================================

app.get('/api/procurement/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY supplier_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/procurement/suppliers', authenticateToken, async (req, res) => {
  const { supplier_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, payment_terms, credit_limit } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, payment_terms, credit_limit, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 5.00) RETURNING *`,
      [supplier_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, payment_terms, credit_limit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/procurement/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.*, s.name as supplier_name 
       FROM purchase_orders po 
       JOIN suppliers s ON po.supplier_id = s.supplier_id 
       ORDER BY po.po_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/procurement/purchase-orders', authenticateToken, async (req, res) => {
  const { supplier_id, order_date, expected_delivery_date, notes, items } = req.body;
  try {
    // Generate PO Number
    const countResult = await pool.query('SELECT COUNT(*) FROM purchase_orders');
    const poNum = `PO-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    // Compute totals
    let total = 0;
    items.forEach(item => {
      total += parseFloat(item.quantity) * parseFloat(item.unit_price);
    });
    const tax = total * 0.18; // 18% chemical/raw material tax default
    const net = total + tax;

    await pool.query('BEGIN');

    const poResult = await pool.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, total_amount, tax_amount, discount_amount, net_amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'draft', $8) RETURNING *`,
      [poNum, supplier_id, order_date, expected_delivery_date, total, tax, net, req.user.user_id]
    );
    const po = poResult.rows[0];

    for (let item of items) {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      await pool.query(
        `INSERT INTO po_items (po_id, material_id, quantity, unit_price, total_price, tax_rate, tax_amount, discount_rate, discount_amount)
         VALUES ($1, $2, $3, $4, $5, 18.00, $6, 0, 0)`,
        [po.po_id, item.material_id, item.quantity, item.unit_price, itemTotal, itemTotal * 0.18]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json(po);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/procurement/purchase-orders/:id', authenticateToken, async (req, res) => {
  const poId = req.params.id;
  try {
    const poResult = await pool.query(
      `SELECT po.*, s.name as supplier_name, s.contact_person, s.phone, s.email, s.address, s.city 
       FROM purchase_orders po 
       JOIN suppliers s ON po.supplier_id = s.supplier_id 
       WHERE po.po_id = $1`,
      [poId]
    );
    if (poResult.rows.length === 0) return res.status(404).json({ error: 'PO not found' });
    
    const itemsResult = await pool.query(
      `SELECT pi.*, m.name as material_name, m.material_code, m.unit 
       FROM po_items pi 
       JOIN materials m ON pi.material_id = m.material_id 
       WHERE pi.po_id = $1`,
      [poId]
    );

    res.json({
      ...poResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. INVENTORY ENDPOINTS
// ==========================================

app.get('/api/inventory/materials', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materials ORDER BY material_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/materials', authenticateToken, async (req, res) => {
  const { material_code, name, description, category, unit, reorder_level, reorder_quantity, unit_cost, hsn_code } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO materials (material_code, name, description, category, unit, reorder_level, reorder_quantity, unit_cost, hsn_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [material_code, name, description, category, unit, reorder_level, reorder_quantity, unit_cost, hsn_code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/stock-dashboard', authenticateToken, async (req, res) => {
  try {
    // Current stock levels grouped by material
    const stockQuery = await pool.query(
      `SELECT m.material_id, m.material_code, m.name, m.category, m.unit, m.reorder_level, m.unit_cost,
              COALESCE(SUM(i.quantity), 0) as current_stock,
              COALESCE(SUM(i.total_value), 0) as total_value
       FROM materials m
       LEFT JOIN inventory_items i ON m.material_id = i.material_id
       GROUP BY m.material_id
       ORDER BY current_stock ASC`
    );

    // Alerts active
    const alertsQuery = await pool.query(
      `SELECT a.*, m.name as material_name, m.material_code 
       FROM reorder_alerts a
       JOIN materials m ON a.material_id = m.material_id
       WHERE a.status = 'pending'`
    );

    res.json({
      stock: stockQuery.rows,
      alerts: alertsQuery.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/movements', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sm.*, m.name as material_name, m.material_code, u.username as logged_by
       FROM stock_movements sm
       JOIN materials m ON sm.material_id = m.material_id
       JOIN users u ON sm.created_by = u.user_id
       ORDER BY sm.movement_id DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/movements', authenticateToken, async (req, res) => {
  const { material_id, movement_type, quantity, batch_number, location, notes } = req.body;
  try {
    await pool.query('BEGIN');

    // Fetch material cost
    const matRes = await pool.query('SELECT unit_cost FROM materials WHERE material_id = $1', [material_id]);
    const cost = matRes.rows[0].unit_cost;
    const totalVal = parseFloat(quantity) * parseFloat(cost);

    // Insert log
    const movementResult = await pool.query(
      `INSERT INTO stock_movements (material_id, movement_type, quantity, batch_number, to_location, unit_cost, total_value, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [material_id, movement_type, quantity, batch_number, location, cost, totalVal, notes, req.user.user_id]
    );

    // Update inventory item stock level
    if (movement_type === 'receipt') {
      // Find or insert stock batch
      const stockRes = await pool.query(
        `SELECT * FROM inventory_items WHERE material_id = $1 AND COALESCE(batch_number, '') = COALESCE($2, '')`,
        [material_id, batch_number]
      );
      if (stockRes.rows.length > 0) {
        await pool.query(
          `UPDATE inventory_items 
           SET quantity = quantity + $1, total_value = (quantity + $1) * unit_cost, updated_at = NOW()
           WHERE item_id = $2`,
          [quantity, stockRes.rows[0].item_id]
        );
      } else {
        await pool.query(
          `INSERT INTO inventory_items (material_id, batch_number, quantity, location, unit_cost, total_value)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [material_id, batch_number, quantity, location, cost, totalVal]
        );
      }
    } else if (movement_type === 'issue') {
      // Deduct stock from the batch
      const stockRes = await pool.query(
        `SELECT * FROM inventory_items WHERE material_id = $1 AND quantity >= $2 ORDER BY quantity DESC LIMIT 1`,
        [material_id, quantity]
      );
      if (stockRes.rows.length === 0) {
        throw new Error('Insufficient stock level available for this material.');
      }
      await pool.query(
        `UPDATE inventory_items 
         SET quantity = quantity - $1, total_value = (quantity - $1) * unit_cost, updated_at = NOW()
         WHERE item_id = $2`,
        [quantity, stockRes.rows[0].item_id]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json(movementResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. PRODUCTION ENDPOINTS
// ==========================================

app.get('/api/production/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production/products', authenticateToken, async (req, res) => {
  const { product_code, name, description, category, unit, standard_cost, selling_price, lead_time_days } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (product_code, name, description, category, unit, standard_cost, selling_price, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [product_code, name, description, category, unit, standard_cost, selling_price, lead_time_days]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/production/machines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM machines ORDER BY machine_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production/machines/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE machines SET status = $1, updated_at = NOW() WHERE machine_id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/production/work-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wo.*, p.name as product_name, p.product_code 
       FROM work_orders wo 
       JOIN products p ON wo.product_id = p.product_id 
       ORDER BY wo.wo_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production/work-orders', authenticateToken, async (req, res) => {
  const { product_id, quantity, planned_start_date, planned_end_date, priority, sales_order_id, notes } = req.body;
  try {
    // Generate WO number
    const countResult = await pool.query('SELECT COUNT(*) FROM work_orders');
    const woNum = `WO-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    const result = await pool.query(
      `INSERT INTO work_orders (wo_number, product_id, quantity, unit, planned_start_date, planned_end_date, status, priority, sales_order_id, notes, created_by)
       VALUES ($1, $2, $3, 'meter', $4, $5, 'planned', $6, $7, $8, $9) RETURNING *`,
      [woNum, product_id, quantity, planned_start_date, planned_end_date, priority, sales_order_id, notes, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production/work-orders/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    let startEndClause = '';
    const params = [status, req.params.id];
    
    if (status === 'in_progress') {
      startEndClause = ', actual_start_date = NOW()';
    } else if (status === 'completed') {
      startEndClause = ', actual_end_date = NOW()';
    }

    const result = await pool.query(
      `UPDATE work_orders SET status = $1 ${startEndClause}, updated_at = NOW() WHERE wo_id = $2 RETURNING *`,
      params
    );

    const wo = result.rows[0];

    // Trigger WhatsApp alerts when work order starts/completes
    if (wo.sales_order_id) {
      const soRes = await pool.query(
        `SELECT so.*, c.name as customer_name, c.phone, c.customer_id
         FROM sales_orders so
         JOIN customers c ON so.customer_id = c.customer_id
         WHERE so.so_id = $1`,
        [wo.sales_order_id]
      );
      if (soRes.rows.length > 0) {
        const so = soRes.rows[0];
        let alertMsg = '';
        if (status === 'in_progress') {
          alertMsg = `Hello ${so.customer_name}! Your fabric production has started under Work Order ${wo.wo_number}. We will notify you once packed.`;
        } else if (status === 'completed') {
          alertMsg = `Dear customer, good news! The production for your order ${so.so_number} is completed successfully! Your fabric batch is ready for dispatch.`;
          // Update sales order status automatically
          await pool.query('UPDATE sales_orders SET status = \'ready_to_dispatch\' WHERE so_id = $1', [so.so_id]);
        }
        if (alertMsg) {
          await sendWhatsAppAlert(so.customer_id, so.so_id, so.phone, alertMsg);
        }
      }
    }

    res.json(wo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/production/production-logs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, wo.wo_number, p.name as product_name, m.name as machine_name, u.username as operator_name
       FROM production_logs pl
       JOIN work_orders wo ON pl.wo_id = wo.wo_id
       JOIN products p ON wo.product_id = p.product_id
       LEFT JOIN machines m ON pl.machine_id = m.machine_id
       JOIN users u ON pl.operator_id = u.user_id
       ORDER BY pl.log_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/production/production-logs', authenticateToken, async (req, res) => {
  const { wo_id, quantity_produced, quantity_rejected, shift, machine_id, downtime_minutes, downtime_reason, notes } = req.body;
  try {
    await pool.query('BEGIN');

    // Add production log
    const result = await pool.query(
      `INSERT INTO production_logs (wo_id, quantity_produced, quantity_rejected, shift, machine_id, downtime_minutes, downtime_reason, notes, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [wo_id, quantity_produced, quantity_rejected, shift, machine_id, downtime_minutes, downtime_reason, notes, req.user.user_id]
    );

    // Update quantities on the work order
    await pool.query(
      `UPDATE work_orders 
       SET produced_quantity = produced_quantity + $1, rejected_quantity = rejected_quantity + $2
       WHERE wo_id = $3`,
      [quantity_produced, quantity_rejected, wo_id]
    );

    await pool.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. QUALITY CONTROL ENDPOINTS
// ==========================================

app.get('/api/quality/inspections', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qc.*, wo.wo_number, u.username as inspector_name
       FROM qc_inspections qc
       LEFT JOIN work_orders wo ON qc.wo_id = wo.wo_id
       JOIN users u ON qc.inspector_id = u.user_id
       ORDER BY qc.inspection_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quality/inspections', authenticateToken, async (req, res) => {
  const { wo_id, batch_number, quantity_inspected, quantity_accepted, quantity_rejected, result, remarks } = req.body;
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM qc_inspections');
    const qcNum = `QC-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    const insertResult = await pool.query(
      `INSERT INTO qc_inspections (inspection_number, wo_id, batch_number, quantity_inspected, quantity_accepted, quantity_rejected, result, remarks, inspector_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [qcNum, wo_id, batch_number, quantity_inspected, quantity_accepted, quantity_rejected, result, remarks, req.user.user_id]
    );
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quality/defect-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM defect_types WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quality/inspections/:id/approve', authenticateToken, async (req, res) => {
  const { status, remarks } = req.body;
  try {
    await pool.query('BEGIN');

    // Update inspection
    await pool.query(
      'UPDATE qc_inspections SET result = $1, approved_by = $2, approved_at = NOW() WHERE inspection_id = $3',
      [status === 'approved' ? 'passed' : 'failed', req.user.user_id, req.params.id]
    );

    // Create batch approval log
    const inspectRes = await pool.query('SELECT batch_number FROM qc_inspections WHERE inspection_id = $1', [req.params.id]);
    const batchNo = inspectRes.rows[0].batch_number;

    const approvalResult = await pool.query(
      `INSERT INTO batch_approvals (batch_number, inspection_id, status, approved_by, approved_at, notes)
       VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *`,
      [batchNo, req.params.id, status, req.user.user_id, remarks]
    );

    await pool.query('COMMIT');
    res.json(approvalResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SALES ENDPOINTS
// ==========================================

app.get('/api/sales/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY customer_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales/customers', authenticateToken, async (req, res) => {
  const { customer_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, credit_limit, credit_days, region } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (customer_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, credit_limit, credit_days, region, customer_type, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'wholesale', 5.00) RETURNING *`,
      [customer_code, name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, credit_limit, credit_days, region]
    );

    // Send WhatsApp notification welcoming customer
    const newCust = result.rows[0];
    const welcomeMsg = `Welcome to Sarv Uttam Fabrics! Hello ${newCust.contact_person || newCust.name}, we have created your account profile. Code: ${newCust.customer_code}. Looking forward to a great partnership.`;
    await sendWhatsAppAlert(newCust.customer_id, null, newCust.phone, welcomeMsg);

    res.status(201).json(newCust);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales/sales-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT so.*, c.name as customer_name, c.phone 
       FROM sales_orders so 
       JOIN customers c ON so.customer_id = c.customer_id 
       ORDER BY so.so_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales/sales-orders', authenticateToken, async (req, res) => {
  const { customer_id, order_date, delivery_date, notes, items } = req.body;
  try {
    await pool.query('BEGIN');

    // Generate SO number
    const countResult = await pool.query('SELECT COUNT(*) FROM sales_orders');
    const soNum = `SO-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    // Compute totals
    let subtotal = 0;
    for (let item of items) {
      subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price);
    }
    const tax = subtotal * 0.05; // 5% GST on fabric sales (2.5% CGST + 2.5% SGST)
    const net = subtotal + tax;

    const soResult = await pool.query(
      `INSERT INTO sales_orders (so_number, customer_id, order_date, delivery_date, total_amount, tax_amount, discount_amount, net_amount, status, billing_address, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'draft', 'Palsana, Surat, Gujarat', $8) RETURNING *`,
      [soNum, customer_id, order_date, delivery_date, subtotal, tax, net, req.user.user_id]
    );
    const so = soResult.rows[0];

    // Insert items
    for (let item of items) {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      await pool.query(
        `INSERT INTO so_items (so_id, product_id, quantity, unit_price, total_price, tax_rate, tax_amount, discount_rate, discount_amount)
         VALUES ($1, $2, $3, $4, $5, 5.00, $6, 0, 0)`,
        [so.so_id, item.product_id, item.quantity, item.unit_price, itemTotal, itemTotal * 0.05]
      );
    }

    await pool.query('COMMIT');

    // Send WhatsApp notification about order placement
    const custRes = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [customer_id]);
    if (custRes.rows.length > 0) {
      const cust = custRes.rows[0];
      const alertMsg = `Thank you! Order ${so.so_number} has been received by Sarv Uttam Fabrics. Est delivery date: ${delivery_date || 'TBD'}. Net amount: ₹${net}.`;
      await sendWhatsAppAlert(cust.customer_id, so.so_id, cust.phone, alertMsg);
    }

    res.status(201).json(so);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales/sales-orders/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE so_id = $2 RETURNING *',
      [status, req.params.id]
    );

    const so = result.rows[0];
    const custRes = await pool.query('SELECT name, phone FROM customers WHERE customer_id = $1', [so.customer_id]);
    
    if (custRes.rows.length > 0) {
      const cust = custRes.rows[0];
      let alertMsg = '';
      
      if (status === 'confirmed') {
        alertMsg = `Hello ${cust.name}! Your order ${so.so_number} has been ACCEPTED & PROCESSED. Work order scheduling is underway.`;
      } else if (status === 'dispatched') {
        alertMsg = `Great news ${cust.name}! Your fabric order ${so.so_number} has been DISPATCHED. Total Net Due: ₹${so.net_amount}. Thank you!`;
      } else if (status === 'delivered') {
        alertMsg = `Delivery Confirmed: Order ${so.so_number} has been delivered successfully. Tax Invoice generated. Payment due as per terms: ${so.payment_terms || '30 days'}.`;
      }
      
      if (alertMsg) {
        await sendWhatsAppAlert(so.customer_id, so.so_id, cust.phone, alertMsg);
      }
    }

    res.json(so);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. COMMUNICATIONS GATEWAY LOG FEED
// ==========================================

app.get('/api/communication-logs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cl.*, c.name as customer_name 
       FROM communication_logs cl
       LEFT JOIN customers c ON cl.customer_id = c.customer_id
       ORDER BY cl.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. METRICS & REPORTS ENDPOINTS
// ==========================================

app.get('/api/reports/summary', authenticateToken, async (req, res) => {
  try {
    const salesTotal = await pool.query("SELECT COALESCE(SUM(net_amount), 0) as total FROM sales_orders WHERE status != 'cancelled'");
    const poTotal = await pool.query("SELECT COALESCE(SUM(net_amount), 0) as total FROM purchase_orders WHERE status != 'cancelled'");
    
    const activeWo = await pool.query("SELECT COUNT(*) FROM work_orders WHERE status IN ('planned', 'released', 'in_progress')");
    const activeMachines = await pool.query("SELECT COUNT(*) FROM machines WHERE status = 'in_use'");
    
    const totalQC = await pool.query("SELECT COUNT(*) FROM qc_inspections");
    const passedQC = await pool.query("SELECT COUNT(*) FROM qc_inspections WHERE result = 'passed'");
    
    res.json({
      sales_revenue: parseFloat(salesTotal.rows[0].total),
      purchase_costs: parseFloat(poTotal.rows[0].total),
      active_work_orders: parseInt(activeWo.rows[0].count),
      active_machines: parseInt(activeMachines.rows[0].count),
      qc_inspections: parseInt(totalQC.rows[0].count),
      qc_pass_rate: totalQC.rows[0].count > 0 ? (passedQC.rows[0].count / totalQC.rows[0].count * 100).toFixed(1) : 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build static files in production
const path = require('path');
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
