const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`Failed to load module ${modulePath}:`, err.message);
    return null;
  }
};

const dbModule = safeRequire('../server/db');
const pool = dbModule ? dbModule.pool : null;

app.get('/api/test', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/debug-db', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'DB pool failed to initialize' });
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now, env: process.env.NODE_ENV, hasDbUrl: !!process.env.DATABASE_URL });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

const mount = (path, modulePath) => {
  const router = safeRequire(modulePath);
  if (router) app.use(path, router);
};

mount('/api/auth', '../server/routes/auth');
mount('/api/v1', '../server/routes/masters');
mount('/api/v1', '../server/routes/jobOrders');
mount('/api/v1/production', '../server/routes/production');
mount('/api/v1/qc', '../server/routes/quality');
mount('/api/v1/inventory', '../server/routes/inventory');
mount('/api/v1/dispatch', '../server/routes/dispatch');
mount('/api/v1/finance', '../server/routes/finance');
mount('/api/reports', '../server/routes/reports');
mount('/api/v1/rates', '../server/routes/rates');
mount('/api/v1/grns', '../server/routes/grns');
mount('/api/v1/communication', '../server/routes/communication');
mount('/api/v1/analytics', '../server/routes/analytics');
mount('/api/v1/client-portal', '../server/routes/clientPortal');
mount('/api/v1/job-work', '../server/routes/jobWork');
mount('/api/v1/owner-analytics', '../server/routes/ownerAnalytics');

// Mount without /api prefix in case Vercel rewrites strip /api
mount('/auth', '../server/routes/auth');
mount('/v1', '../server/routes/masters');
mount('/v1', '../server/routes/jobOrders');
mount('/v1/production', '../server/routes/production');
mount('/v1/qc', '../server/routes/quality');
mount('/v1/inventory', '../server/routes/inventory');
mount('/v1/dispatch', '../server/routes/dispatch');
mount('/v1/finance', '../server/routes/finance');
mount('/reports', '../server/routes/reports');
mount('/v1/rates', '../server/routes/rates');
mount('/v1/grns', '../server/routes/grns');
mount('/v1/communication', '../server/routes/communication');
mount('/v1/analytics', '../server/routes/analytics');
mount('/v1/client-portal', '../server/routes/clientPortal');
mount('/v1/job-work', '../server/routes/jobWork');
mount('/v1/owner-analytics', '../server/routes/ownerAnalytics');

mount('/api', '../server/routes/masters');
mount('/api/production', '../server/routes/production');
mount('/api/quality', '../server/routes/quality');
mount('/api/inventory', '../server/routes/inventory');

// Catch-all debug for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found in Vercel Express handler',
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method
  });
});

module.exports = (req, res) => {
  return app(req, res);
};
