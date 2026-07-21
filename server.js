const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool } = require('./server/db');
const authRoutes = require('./server/routes/auth');
const masterRoutes = require('./server/routes/masters');
const jobRoutes = require('./server/routes/jobOrders');
const prodRoutes = require('./server/routes/production');
const qcRoutes = require('./server/routes/quality');
const invRoutes = require('./server/routes/inventory');
const dispatchRoutes = require('./server/routes/dispatch');
const financeRoutes = require('./server/routes/finance');
const reportRoutes = require('./server/routes/reports');
const ratesRoutes = require('./server/routes/rates');
const grnRoutes = require('./server/routes/grns');

const commRoutes = require('./server/routes/communication');
const analyticsRoutes = require('./server/routes/analytics');
const clientPortalRoutes = require('./server/routes/clientPortal');
const jobWorkRoutes = require('./server/routes/jobWork');
const ownerAnalyticsRoutes = require('./server/routes/ownerAnalytics');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

app.get('/api/debug-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now, env: process.env.NODE_ENV, hasDbUrl: !!process.env.DATABASE_URL });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack, dbUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) : 'none' });
  }
});

pool.connect((err, client, release) => {
  if (err) console.error('DB connection error:', err.message);
  else { console.log('Connected to PostgreSQL'); release(); }
});

app.use('/api/auth', authRoutes);
app.use('/api/v1', masterRoutes);
app.use('/api/v1', jobRoutes);
app.use('/api/v1/production', prodRoutes);
app.use('/api/v1/qc', qcRoutes);
app.use('/api/v1/inventory', invRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/v1/rates', ratesRoutes);
app.use('/api/v1/grns', grnRoutes);
app.use('/api/v1/communication', commRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/client-portal', clientPortalRoutes);
app.use('/api/v1/job-work', jobWorkRoutes);
app.use('/api/v1/owner-analytics', ownerAnalyticsRoutes);

// Legacy aliases for existing frontend paths
app.use('/api', masterRoutes);
app.use('/api/production', prodRoutes);
app.use('/api/quality', qcRoutes);
app.use('/api/inventory', invRoutes);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
