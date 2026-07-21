const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migratePhase4() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('--- PHASE 4: Job-Work Tracking Module Migration ---');

    // 1. job_work_units
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_work_units (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        unit_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_jw_units_tenant ON job_work_units(tenant_id);
    `);
    console.log('✓ job_work_units table & index created.');

    // 2. job_work_orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_work_orders (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        job_work_unit_id INT NOT NULL REFERENCES job_work_units(id) ON DELETE CASCADE,
        batch_run_id INT REFERENCES batch_runs(batch_id) ON DELETE SET NULL,
        fabric_id INT NOT NULL REFERENCES fabrics(fabric_id),
        quantity_sent NUMERIC(12,3) NOT NULL,
        process_type VARCHAR(100) NOT NULL,
        dispatch_date DATE DEFAULT CURRENT_DATE,
        expected_return_date DATE,
        status VARCHAR(50) DEFAULT 'Sent',
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_jw_orders_tenant ON job_work_orders(tenant_id);
    `);
    console.log('✓ job_work_orders table & index created.');

    // 3. job_work_returns
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_work_returns (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        job_work_order_id INT NOT NULL REFERENCES job_work_orders(id) ON DELETE CASCADE,
        quantity_returned NUMERIC(12,3) NOT NULL,
        return_date DATE DEFAULT CURRENT_DATE,
        quality_notes TEXT,
        defect_quantity NUMERIC(12,3) DEFAULT 0,
        received_by INT REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_jw_returns_tenant ON job_work_returns(tenant_id);
    `);
    console.log('✓ job_work_returns table & index created.');

    console.log('Phase 4 Migration Completed Successfully!');
  } catch (err) {
    console.error('Phase 4 Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

migratePhase4();
