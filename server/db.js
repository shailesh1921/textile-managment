const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

module.exports = { pool };
