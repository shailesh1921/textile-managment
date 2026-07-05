const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'skdyeing_mill_secret';

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

async function auditLog(req, action, entityType, entityId, oldValues, newValues) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.tenant_id,
        req.user.user_id,
        action,
        entityType,
        String(entityId),
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip,
      ]
    );
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
}

module.exports = { authenticateToken, auditLog, JWT_SECRET };
