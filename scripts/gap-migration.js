/**
 * Gap Migration Script — Adds missing tables for:
 *   1. lot_takas (individual roll tracking within lots)
 *   2. batch_utility_logs (fuel/utility consumption per batch)
 *   3. packing_lists + packing_list_items (grouping finished rolls for dispatch)
 */
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running gap migration...');

    // ─── 1. Individual Taka/Roll Tracking ──────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS lot_takas (
        taka_id       SERIAL PRIMARY KEY,
        tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id),
        lot_id        INT NOT NULL REFERENCES lots(lot_id) ON DELETE CASCADE,
        taka_no       INT NOT NULL,
        meters        NUMERIC(10,2) NOT NULL,
        weight_kg     NUMERIC(10,3),
        grade         VARCHAR(20) DEFAULT 'FRESH',
        remarks       TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(lot_id, taka_no)
      );
    `);
    console.log('  ✓ lot_takas table created');

    // ─── 2. Fuel / Utility Consumption Logging ─────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_utility_logs (
        log_id        SERIAL PRIMARY KEY,
        tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id),
        batch_id      INT NOT NULL REFERENCES batch_runs(batch_id) ON DELETE CASCADE,
        utility_type  VARCHAR(30) NOT NULL,
        quantity      NUMERIC(12,3) NOT NULL,
        unit_cost     NUMERIC(10,2) DEFAULT 0,
        total_cost    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
        shift         VARCHAR(5),
        logged_by     INT REFERENCES users(user_id),
        logged_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✓ batch_utility_logs table created');

    // ─── 3. Packing Lists ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS packing_lists (
        packing_list_id  SERIAL PRIMARY KEY,
        tenant_id        UUID NOT NULL REFERENCES tenants(tenant_id),
        packing_list_no  VARCHAR(30) NOT NULL,
        lot_id           INT REFERENCES lots(lot_id),
        job_order_id     INT REFERENCES job_orders(job_order_id),
        total_rolls      INT DEFAULT 0,
        total_meters     NUMERIC(10,2) DEFAULT 0,
        total_kg         NUMERIC(10,3) DEFAULT 0,
        packed_by        INT REFERENCES users(user_id),
        packed_at        TIMESTAMPTZ DEFAULT NOW(),
        status           VARCHAR(20) DEFAULT 'PACKED',
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✓ packing_lists table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS packing_list_items (
        item_id          SERIAL PRIMARY KEY,
        packing_list_id  INT NOT NULL REFERENCES packing_lists(packing_list_id) ON DELETE CASCADE,
        roll_no          INT NOT NULL,
        taka_id          INT REFERENCES lot_takas(taka_id),
        finished_meters  NUMERIC(10,2) NOT NULL,
        finished_kg      NUMERIC(10,3),
        quality_grade    VARCHAR(20) DEFAULT 'FRESH',
        remarks          TEXT
      );
    `);
    console.log('  ✓ packing_list_items table created');

    console.log('\n✅ Gap migration complete — 4 new tables created.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
