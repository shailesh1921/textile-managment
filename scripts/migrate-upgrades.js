const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database for migration...');

    // 1. Communication Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        log_id BIGSERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP', 'EMAIL')),
        provider VARCHAR(30) NOT NULL DEFAULT 'TWILIO',
        recipient_phone VARCHAR(20) NOT NULL,
        template_code VARCHAR(50),
        message_body TEXT NOT NULL,
        media_url TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DELIVERED')),
        error_message TEXT,
        job_order_id INT REFERENCES job_orders(job_order_id),
        batch_id INT REFERENCES batch_runs(batch_id),
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ communication_logs table ready.');

    // 2. Client OTP Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_otp_tokens (
        token_id SERIAL PRIMARY KEY,
        mobile VARCHAR(20) NOT NULL,
        job_order_id INT REFERENCES job_orders(job_order_id),
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ client_otp_tokens table ready.');

    // 3. Add reorder level & last alert sent columns to dye_chemicals
    await client.query(`
      ALTER TABLE dye_chemicals 
      ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(10,2) DEFAULT 50.00,
      ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ;
    `);
    console.log('✓ dye_chemicals alert columns updated.');

    // 4. Add defect details to qc_defects
    await client.query(`
      ALTER TABLE qc_defects 
      ADD COLUMN IF NOT EXISTS defect_type VARCHAR(50) DEFAULT 'SHADE_STREAK',
      ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'MEDIUM';
    `);
    console.log('✓ qc_defects columns updated.');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

migrate();
