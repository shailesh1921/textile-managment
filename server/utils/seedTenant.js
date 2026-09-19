/**
 * Seeds starter master data for a brand-new tenant so their dashboard
 * isn't empty on first login. Called inside the signup transaction.
 * 
 * @param {string} tenantId - UUID of the newly created tenant
 * @param {import('pg').PoolClient} client - The transaction-bound PG client
 * @returns {{ adminRoleId: number }} The role_id of the ADMIN role
 */
async function seedNewTenant(tenantId, client) {
  // ── 1. Seed all 7 standard roles ──────────────────────────
  const roles = [
    ['ADMIN', 'Administrator', 'Full administrative access'],
    ['PRODUCTION_MANAGER', 'Production Manager', 'Manages production floor and batches'],
    ['MACHINE_OPERATOR', 'Machine Operator', 'Operates dyeing/stenter machines'],
    ['QC_INSPECTOR', 'QC Inspector', 'Performs ASTM D5430 quality checks'],
    ['ACCOUNTS', 'Accounts', 'Finance, GST, and party ledger management'],
    ['DISPATCH', 'Dispatch', 'Packing, challan, and dispatch operations'],
    ['PARTY_PORTAL', 'Party Portal', 'External trader/merchant self-service access'],
  ];
  let adminRoleId = null;
  for (const [code, name, desc] of roles) {
    const r = await client.query(
      `INSERT INTO roles (tenant_id, role_code, role_name, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING role_id`,
      [tenantId, code, name, desc]
    );
    if (r.rows.length > 0 && code === 'ADMIN') {
      adminRoleId = r.rows[0].role_id;
    }
  }
  // If ADMIN role already existed (ON CONFLICT), fetch it
  if (!adminRoleId) {
    const existing = await client.query(
      `SELECT role_id FROM roles WHERE tenant_id = $1 AND role_code = 'ADMIN' LIMIT 1`,
      [tenantId]
    );
    if (existing.rows.length > 0) adminRoleId = existing.rows[0].role_id;
  }

  // ── 2. Seed common fabric types ───────────────────────────
  // Columns: tenant_id, fabric_name, fabric_code, width_inches, gsm
  const fabrics = [
    ['Pure Cotton 44"', 'COTTON-44', 44, 120],
    ['Polyester 58"', 'POLY-58', 58, 85],
    ['Rayon / Viscose 44"', 'RAYON-44', 44, 110],
    ['T/C Blend 65/35 58"', 'TC-BLEND-58', 58, 95],
    ['Cotton Lycra 72"', 'CTN-LYCRA-72', 72, 180],
  ];
  for (const [name, code, width, gsm] of fabrics) {
    await client.query(
      `INSERT INTO fabrics (tenant_id, fabric_name, fabric_code, width_inches, gsm)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [tenantId, name, code, width, gsm]
    );
  }

  // ── 3. Seed default process template ──────────────────────
  // Creates a standard 9-stage route template
  const templateRes = await client.query(
    `INSERT INTO process_templates (tenant_id, template_name, process_type, is_active)
     VALUES ($1, 'Standard Dyeing (9-Stage)', 'DYEING', true)
     RETURNING template_id`,
    [tenantId]
  );
  if (templateRes.rows.length > 0) {
    const templateId = templateRes.rows[0].template_id;
    const stages = [
      [1, 'Desizing', 'JET', 45, 1.0],
      [2, 'Scouring', 'JET', 60, 1.5],
      [3, 'Bleaching', 'JET', 50, 1.0],
      [4, 'Mercerizing', 'MERCERIZER', 40, 0.5],
      [5, 'Dyeing', 'JET', 120, 2.0],
      [6, 'Washing & Soaping', 'WASHER', 30, 0.5],
      [7, 'Stenter Finishing', 'STENTER', 25, 3.0],
      [8, 'Quality Check (ASTM D5430)', null, 15, 0],
      [9, 'Folding & Packing', null, 20, 0],
    ];
    for (const [seq, name, machineType, timeMins, lossPct] of stages) {
      await client.query(
        `INSERT INTO process_template_steps (template_id, sequence_no, process_name, machine_type, standard_time_mins, expected_loss_pct, is_qc_checkpoint)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [templateId, seq, name, machineType, timeMins, lossPct, seq === 8]
      );
    }
  }

  // ── 4. Seed sample shades ─────────────────────────────────
  const shades = [
    ['Navy Blue', 'SC-001', '19-3832 TPX'],
    ['Black', 'SC-002', '19-0303 TPX'],
    ['White (RFD)', 'SC-003', '11-0601 TPX'],
  ];
  for (const [name, cardNo, pantone] of shades) {
    await client.query(
      `INSERT INTO shades (tenant_id, shade_name, shade_card_no, pantone_ref, delta_e_tolerance, is_active)
       VALUES ($1, $2, $3, $4, 1.5, true)
       ON CONFLICT DO NOTHING`,
      [tenantId, name, cardNo, pantone]
    );
  }

  return { adminRoleId };
}

module.exports = { seedNewTenant };
