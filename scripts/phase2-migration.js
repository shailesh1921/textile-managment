const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migratePhase2() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('--- PHASE 2: Database Migration (Onboarding Flag) ---');

    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    `);
    console.log('✓ tenants table updated with onboarding_completed column.');

    // Existing live client default to onboarding completed
    await client.query(`
      UPDATE tenants 
      SET onboarding_completed = TRUE 
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
    `);
    console.log('✓ Live client onboarding_completed set to TRUE.');

    console.log('Phase 2 Migration Completed Successfully!');
  } catch (err) {
    console.error('Phase 2 Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

migratePhase2();
