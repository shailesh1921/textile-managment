const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migratePhase1() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('--- PHASE 1: Multi-Tenant Database Migration ---');

    // 1. Update tenants table
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS subdomain_or_slug VARCHAR(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'STARTER';
    `);
    console.log('✓ tenants table schema updated with subdomain_or_slug & plan_type');

    // 2. Ensure default tenant has a slug
    await client.query(`
      UPDATE tenants 
      SET subdomain_or_slug = 'sk-dyeing', plan_type = 'ENTERPRISE' 
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND subdomain_or_slug IS NULL;
    `);

    // 3. Verify tenant_id columns on all business tables
    const tables = [
      'users', 'parties', 'fabrics', 'dye_chemicals', 'shades', 
      'machines', 'job_orders', 'lots', 'batch_runs', 'production_entries', 
      'qc_inspections', 'job_work_bills', 'communication_logs'
    ];

    for (const tbl of tables) {
      await client.query(`
        ALTER TABLE ${tbl} 
        ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${tbl}_tenant ON ${tbl}(tenant_id);
      `);
      console.log(`✓ Table ${tbl} tenant_id column & index verified.`);
    }

    console.log('Phase 1 Migration Completed Successfully!');
  } catch (err) {
    console.error('Phase 1 Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

migratePhase1();
