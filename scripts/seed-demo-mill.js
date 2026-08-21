/**
 * Seed Demo Mill — Populates a realistic Surat Dyeing Mill tenant
 * 
 * Creates: 1 Tenant, 4 Users, 6 Parties, 8 Fabrics, 12 Shades,
 *          15 Chemicals, 6 Machines, 3 Process Templates, 4 Recipes,
 *          5 Job Orders, 3 Lots, Rate Masters, GRN records
 * 
 * Usage: node scripts/seed-demo-mill.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } });

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function run() {
  const c = await pool.connect();
  try {
    console.log('🏭 Seeding Sarv Uttam Fabrics demo mill...\n');

    // Clean existing demo tenant data before starting transaction
    const colRes = await c.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND column_name = 'tenant_id'
    `);
    const tablesWithTenant = new Set(colRes.rows.map(r => r.table_name));

    const cleanupOrder = [
      'lot_takas', 'batch_utility_logs', 'packing_lists',
      'communication_logs', 'return_materials', 'eway_bills',
      'dispatch_challans', 'lot_cost_sheets', 'party_ledger', 'job_work_bills',
      'gst_invoices', 'purchase_invoices', 'grn_records', 'purchase_orders',
      'packing_materials', 'finished_goods_inventory', 'grey_fabric_inventory',
      'stock_movements', 'reorder_alerts', 'dye_chemical_stock_batches',
      'qc_inspections', 'reprocess_records', 'production_entries',
      'batch_runs', 'job_work_orders', 'job_work_returns', 'job_work_units',
      'lots', 'job_orders', 'recipes', 'process_templates',
      'rate_master', 'greige_grn',
      'dye_chemicals', 'shades', 'fabrics', 'parties', 'machines',
      'audit_logs', 'users', 'roles'
    ];

    for (const tbl of cleanupOrder) {
      if (tablesWithTenant.has(tbl)) {
        try {
          await c.query(`DELETE FROM ${tbl} WHERE tenant_id = $1`, [TENANT_ID]);
        } catch (e) {
          // ignore
        }
      }
    }
    // Resync sequences for tables with serial IDs
    const serialTables = [
      ['roles', 'role_id'], ['users', 'user_id'], ['parties', 'party_id'],
      ['fabrics', 'fabric_id'], ['shades', 'shade_id'], ['dye_chemicals', 'item_id'],
      ['machines', 'machine_id'], ['process_templates', 'template_id'],
      ['process_template_steps', 'step_id'], ['recipes', 'recipe_id'],
      ['recipe_lines', 'line_id'], ['rate_master', 'rate_id'],
      ['job_orders', 'job_order_id'], ['lots', 'lot_id'], ['lot_takas', 'taka_id'],
      ['lot_process_stages', 'stage_id'], ['batch_runs', 'batch_id'],
      ['batch_utility_logs', 'log_id'], ['packing_lists', 'packing_list_id'],
      ['packing_list_items', 'item_id']
    ];
    for (const [tbl, col] of serialTables) {
      try {
        await c.query(`
          SELECT setval(
            pg_get_serial_sequence('${tbl}', '${col}'),
            COALESCE((SELECT MAX(${col}) FROM ${tbl}), 0) + 1,
            false
          );
        `);
      } catch (e) { /* ignore */ }
    }

    await c.query('BEGIN');

    // ─── TENANT ────────────────────────────────────────────────
    await c.query(`
      INSERT INTO tenants (tenant_id, mill_name, subdomain_or_slug, plan_type, gstin, state_code, address, city, pincode, onboarding_completed)
      VALUES ($1, 'Sarv Uttam Fabrics', 'sarv-uttam', 'PROFESSIONAL', '24AABCS1234F1ZP', '24', 'Plot 14, Phase-II, Sachin GIDC', 'Surat', '394230', true)
      ON CONFLICT (tenant_id) DO UPDATE SET mill_name = EXCLUDED.mill_name, onboarding_completed = true
    `, [TENANT_ID]);
    console.log('  ✓ Tenant: Sarv Uttam Fabrics');

    // ─── ROLES ─────────────────────────────────────────────────
    const roleDefs = [
      ['ADMIN', 'Mill Admin', '{"all": true}'],
      ['PROD_MGR', 'Production Manager', '{"production": true, "quality": true}'],
      ['QC_INSPECTOR', 'QC Inspector', '{"quality": true}'],
      ['DISPATCH_CLERK', 'Dispatch Clerk', '{"dispatch": true, "inventory": true}']
    ];
    const roleIds = {};
    for (const [code, name, perms] of roleDefs) {
      const r = await c.query(`
        INSERT INTO roles (tenant_id, role_code, role_name, permissions) VALUES ($1, $2, $3, $4)
        RETURNING role_id
      `, [TENANT_ID, code, name, perms]);
      roleIds[code] = r.rows[0].role_id;
    }
    console.log('  ✓ 4 Roles created');

    // ─── USERS ─────────────────────────────────────────────────
    const pw = await bcrypt.hash('admin123', 10);
    const users = [
      ['admin', 'admin@sarvuttam.com', 'Ramesh Patel', 'EMP001', roleIds['ADMIN'], 'A'],
      ['prod_mgr', 'production@sarvuttam.com', 'Suresh Shah', 'EMP002', roleIds['PROD_MGR'], 'A'],
      ['qc1', 'qc@sarvuttam.com', 'Priya Desai', 'EMP003', roleIds['QC_INSPECTOR'], 'B'],
      ['dispatch1', 'dispatch@sarvuttam.com', 'Kiran Mehta', 'EMP004', roleIds['DISPATCH_CLERK'], 'A']
    ];
    const userIds = {};
    for (const [uname, email, fname, ecode, rid, shift] of users) {
      const r = await c.query(`
        INSERT INTO users (tenant_id, username, email, password_hash, full_name, employee_code, role_id, shift_default, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING user_id
      `, [TENANT_ID, uname, email, pw, fname, ecode, rid, shift]);
      userIds[uname] = r.rows[0].user_id;
    }
    console.log('  ✓ 4 Users created (admin / prod_mgr / qc1 / dispatch1, password: admin123)');

    // ─── PARTIES ───────────────────────────────────────────────
    const parties = [
      ['TRD-001', 'TRADER_MERCHANT', 'Shree Ganesh Textiles', 'Surat', '24AABCG5678K1ZQ', '24', 'Rajesh Agarwal', '9876543210'],
      ['TRD-002', 'TRADER_MERCHANT', 'Mahavir Silk Mills', 'Surat', '24AABCM9012L1ZR', '24', 'Vikram Jain', '9876543211'],
      ['TRD-003', 'TRADER_MERCHANT', 'Patel Brothers Fabrics', 'Ahmedabad', '24AABCP3456M1ZS', '24', 'Dinesh Patel', '9876543212'],
      ['SUP-001', 'SUPPLIER', 'Gujarat Dye Chem Pvt Ltd', 'Surat', '24AABCG7890N1ZT', '24', 'Ankit Sharma', '9876543213'],
      ['SUP-002', 'SUPPLIER', 'Balaji Chemicals & Dyes', 'Ahmedabad', '24AABCB1234P1ZU', '24', 'Hitesh Modi', '9876543214'],
      ['TRN-001', 'TRANSPORTER', 'Surat Express Cargo', 'Surat', '24AABCS5678Q1ZV', '24', 'Kamlesh Driver', '9876543215']
    ];
    const partyIds = {};
    for (const [code, ptype, name, city, gstin, sc, contact, mobile] of parties) {
      const r = await c.query(`
        INSERT INTO parties (tenant_id, party_code, party_type, legal_name, trade_name, gstin, state_code, contact_person, mobile, billing_address, is_active)
        VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT DO NOTHING RETURNING party_id
      `, [TENANT_ID, code, ptype, name, gstin, sc, contact, mobile, city]);
      if (r.rows[0]) partyIds[code] = r.rows[0].party_id;
    }
    if (!partyIds['TRD-001']) {
      const pp = await c.query(`SELECT party_id, party_code FROM parties WHERE tenant_id = $1`, [TENANT_ID]);
      pp.rows.forEach(p => { partyIds[p.party_code] = p.party_id; });
    }
    console.log('  ✓ 6 Parties (3 Traders, 2 Suppliers, 1 Transporter)');

    // ─── FABRICS ───────────────────────────────────────────────
    const fabrics = [
      ['FAB-GEO', 'Georgette', 'WOVEN', 60, 44, 46, '5407.61'],
      ['FAB-MOS', 'Moss Crepe', 'WOVEN', 120, 44, 46, '5407.52'],
      ['FAB-COT', 'Cotton Flex', 'WOVEN', 150, 58, 56, '5208.52'],
      ['FAB-SAT', 'Japan Satin', 'WOVEN', 90, 44, 46, '5407.52'],
      ['FAB-RAY', 'Rayon Plain', 'WOVEN', 100, 44, 46, '5408.22'],
      ['FAB-PTW', 'Polyester Twill', 'WOVEN', 130, 58, 56, '5407.52'],
      ['FAB-CHF', 'Chiffon', 'WOVEN', 40, 44, 46, '5407.61'],
      ['FAB-LYC', 'Lycra Knit', 'KNITTED', 180, 60, 58, '6006.32']
    ];
    const fabricIds = {};
    for (const [code, name, cat, gsm, wid, fwid, hsn] of fabrics) {
      const r = await c.query(`
        INSERT INTO fabrics (tenant_id, fabric_code, fabric_name, fabric_category, gsm, width_inches, finished_width_inches, hsn_code, default_shrinkage_pct, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 5.0, true)
        ON CONFLICT DO NOTHING RETURNING fabric_id
      `, [TENANT_ID, code, name, cat, gsm, wid, fwid, hsn]);
      if (r.rows[0]) fabricIds[code] = r.rows[0].fabric_id;
    }
    if (!fabricIds['FAB-GEO']) {
      const ff = await c.query(`SELECT fabric_id, fabric_code FROM fabrics WHERE tenant_id = $1`, [TENANT_ID]);
      ff.rows.forEach(f => { fabricIds[f.fabric_code] = f.fabric_id; });
    }
    console.log('  ✓ 8 Fabrics (Georgette, Moss Crepe, Cotton Flex, Japan Satin, Rayon, Poly Twill, Chiffon, Lycra)');

    // ─── SHADES (CIELAB) ───────────────────────────────────────
    const shades = [
      ['SC-001', 'Navy Blue', null, 28.5, 3.2, -38.7, 1.5],
      ['SC-002', 'Bottle Green', null, 35.2, -22.4, 12.8, 1.5],
      ['SC-003', 'Wine Red', null, 32.1, 42.6, 18.3, 1.5],
      ['SC-004', 'Dusty Pink', null, 72.4, 12.8, 5.6, 2.0],
      ['SC-005', 'Royal Purple', null, 25.8, 28.9, -42.1, 1.5],
      ['SC-006', 'Ivory White', null, 92.1, -0.5, 6.2, 1.0],
      ['SC-007', 'Rust Orange', null, 48.5, 38.2, 42.6, 1.5],
      ['SC-008', 'Charcoal Grey', null, 35.8, 0.2, -0.8, 1.5],
      ['SC-009', 'Teal Blue', null, 45.2, -18.6, -12.4, 1.5],
      ['SC-010', 'Magenta', null, 42.1, 58.3, -8.2, 1.5],
      ['SC-011', 'Olive Green', null, 52.8, -12.4, 28.6, 2.0],
      ['SC-012', 'Maroon', null, 22.4, 32.8, 12.4, 1.5]
    ];
    const shadeIds = {};
    for (const [card, name, pantone, l, a, b, de] of shades) {
      const r = await c.query(`
        INSERT INTO shades (tenant_id, shade_card_no, shade_name, pantone_ref, lab_l, lab_a, lab_b, delta_e_tolerance, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT DO NOTHING RETURNING shade_id
      `, [TENANT_ID, card, name, pantone, l, a, b, de]);
      if (r.rows[0]) shadeIds[card] = r.rows[0].shade_id;
    }
    if (!shadeIds['SC-001']) {
      const ss = await c.query(`SELECT shade_id, shade_card_no FROM shades WHERE tenant_id = $1`, [TENANT_ID]);
      ss.rows.forEach(s => { shadeIds[s.shade_card_no] = s.shade_id; });
    }
    console.log('  ✓ 12 Shades with CIELAB L*a*b* values');

    // ─── DYE & CHEMICALS ───────────────────────────────────────
    const chems = [
      ['DYE-DSB', 'Disperse Blue SE-2R', 'DISPERSE_DYE', 'grams', '3204.11', 12, 5.0, 25],
      ['DYE-DSR', 'Disperse Red FB', 'DISPERSE_DYE', 'grams', '3204.11', 12, 5.0, 25],
      ['DYE-DSY', 'Disperse Yellow 5GLS', 'DISPERSE_DYE', 'grams', '3204.11', 12, 4.0, 20],
      ['DYE-RCR', 'Reactive Red M8B', 'REACTIVE_DYE', 'grams', '3204.16', 12, 3.0, 15],
      ['DYE-RCB', 'Reactive Blue BF', 'REACTIVE_DYE', 'grams', '3204.16', 12, 3.0, 15],
      ['CHM-SOD', 'Soda Ash (Na2CO3)', 'AUXILIARY', 'kg', '2836.20', 5, 50.0, 200],
      ['CHM-ACE', 'Acetic Acid', 'AUXILIARY', 'liters', '2915.21', 18, 20.0, 100],
      ['CHM-LEV', 'Leveling Agent CD', 'AUXILIARY', 'kg', '3402.90', 18, 10.0, 50],
      ['CHM-SFT', 'Softener CT (Cationic)', 'SOFTENER', 'kg', '3809.91', 18, 15.0, 60],
      ['CHM-DIS', 'Dispersing Agent NNO', 'AUXILIARY', 'kg', '3402.90', 18, 10.0, 50],
      ['CHM-SEQ', 'Sequestering Agent', 'AUXILIARY', 'kg', '3402.90', 18, 5.0, 25],
      ['CHM-RED', 'Reduction Clean Agent', 'AUXILIARY', 'kg', '2832.10', 12, 8.0, 40],
      ['CHM-CAU', 'Caustic Soda (NaOH)', 'AUXILIARY', 'kg', '2815.11', 5, 30.0, 150],
      ['CHM-H2O', 'Hydrogen Peroxide 50%', 'AUXILIARY', 'liters', '2847.00', 12, 10.0, 50],
      ['CHM-SIL', 'Silicone Softener', 'SOFTENER', 'kg', '3910.00', 18, 10.0, 40]
    ];
    const chemIds = {};
    for (const [code, name, cat, uom, hsn, gst, reorder, reorderQty] of chems) {
      const r = await c.query(`
        INSERT INTO dye_chemicals (tenant_id, item_code, item_name, category, uom, hsn_code, gst_rate_pct, reorder_level, reorder_qty, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT DO NOTHING RETURNING item_id
      `, [TENANT_ID, code, name, cat, uom, hsn, gst, reorder, reorderQty]);
      if (r.rows[0]) chemIds[code] = r.rows[0].item_id;
    }
    if (!chemIds['DYE-DSB']) {
      const cc = await c.query(`SELECT item_id, item_code FROM dye_chemicals WHERE tenant_id = $1`, [TENANT_ID]);
      cc.rows.forEach(ci => { chemIds[ci.item_code] = ci.item_id; });
    }
    console.log('  ✓ 15 Dye & Chemical items');

    // ─── MACHINES ──────────────────────────────────────────────
    const machines = [
      ['JET-01', 'Jet Dyeing Machine #1', 'JET_DYEING', 200, 'kg', 8.0, 12.0, 850],
      ['JET-02', 'Jet Dyeing Machine #2', 'JET_DYEING', 300, 'kg', 8.0, 12.0, 950],
      ['RDR-01', 'Relax Dryer #1', 'RELAX_DRYER', 500, 'meters/hr', null, null, 400],
      ['STN-01', 'Stenter Machine #1', 'STENTER', 600, 'meters/hr', null, null, 700],
      ['DEC-01', 'Decatizer #1', 'DECATIZING', 400, 'meters/hr', null, null, 350],
      ['CAL-01', 'Calendering Machine #1', 'CALENDERING', 800, 'meters/hr', null, null, 500]
    ];
    const machineIds = {};
    for (const [code, name, mtype, cap, cuom, lrmin, lrmax, rate] of machines) {
      const r = await c.query(`
        INSERT INTO machines (tenant_id, machine_code, machine_name, machine_type, capacity_value, capacity_uom, liquor_ratio_min, liquor_ratio_max, current_status, hourly_rate, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IDLE', $9, true)
        ON CONFLICT DO NOTHING RETURNING machine_id
      `, [TENANT_ID, code, name, mtype, cap, cuom, lrmin, lrmax, rate]);
      if (r.rows[0]) machineIds[code] = r.rows[0].machine_id;
    }
    if (!machineIds['JET-01']) {
      const mm = await c.query(`SELECT machine_id, machine_code FROM machines WHERE tenant_id = $1`, [TENANT_ID]);
      mm.rows.forEach(m => { machineIds[m.machine_code] = m.machine_id; });
    }
    console.log('  ✓ 6 Machines (2 Jet Dyeing, 1 Relax Dryer, 1 Stenter, 1 Decatizer, 1 Calender)');

    // ─── PROCESS TEMPLATES ─────────────────────────────────────
    const templates = [
      ['Polyester Dyeing Standard', fabricIds['FAB-GEO'], 'DYEING', [
        [1, 'Grey Preparation', 'MANUAL', 30, 0],
        [2, 'Scouring', 'JET_DYEING', 45, 1.0],
        [3, 'Dyeing', 'JET_DYEING', 120, 2.5],
        [4, 'Reduction Cleaning', 'JET_DYEING', 30, 0.5],
        [5, 'Drying', 'RELAX_DRYER', 40, 1.0],
        [6, 'Stentering', 'STENTER', 25, 0.5],
        [7, 'Folding & Packing', 'MANUAL', 20, 0]
      ]],
      ['Cotton Reactive Dyeing', fabricIds['FAB-COT'], 'DYEING', [
        [1, 'Grey Preparation', 'MANUAL', 30, 0],
        [2, 'Desizing & Scouring', 'JET_DYEING', 60, 1.5],
        [3, 'Bleaching', 'JET_DYEING', 45, 1.0],
        [4, 'Reactive Dyeing', 'JET_DYEING', 150, 3.0],
        [5, 'Soaping & Washing', 'JET_DYEING', 30, 0.5],
        [6, 'Drying', 'RELAX_DRYER', 40, 1.0],
        [7, 'Stentering', 'STENTER', 25, 0.5],
        [8, 'Calendering', 'CALENDERING', 20, 0],
        [9, 'Folding & Packing', 'MANUAL', 20, 0]
      ]],
      ['Finishing Only', fabricIds['FAB-SAT'], 'FINISHING', [
        [1, 'Drying', 'RELAX_DRYER', 40, 1.0],
        [2, 'Stentering', 'STENTER', 25, 0.5],
        [3, 'Decatizing', 'DECATIZING', 20, 0.3],
        [4, 'Folding & Packing', 'MANUAL', 20, 0]
      ]]
    ];
    const templateIds = {};
    for (const [name, fabId, ptype, steps] of templates) {
      const r = await c.query(`
        INSERT INTO process_templates (tenant_id, template_name, fabric_id, process_type, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING RETURNING template_id
      `, [TENANT_ID, name, fabId, ptype]);
      if (r.rows[0]) {
        templateIds[name] = r.rows[0].template_id;
        for (const [seq, pname, mtype, time, loss] of steps) {
          await c.query(`
            INSERT INTO process_template_steps (template_id, sequence_no, process_name, machine_type, standard_time_mins, expected_loss_pct)
            VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
          `, [r.rows[0].template_id, seq, pname, mtype, time, loss]);
        }
      }
    }
    console.log('  ✓ 3 Process Templates with step definitions');

    // ─── RECIPES ───────────────────────────────────────────────
    const recipeDefs = [
      ['RCP-NVB-GEO', shadeIds['SC-001'], fabricIds['FAB-GEO'], 'JET_DYEING', 10.0, 130, 60, 5.5, [
        [chemIds['DYE-DSB'], 2.5, null, 1, true],
        [chemIds['DYE-DSR'], 0.3, null, 2, false],
        [chemIds['CHM-DIS'], 1.0, null, 3, true],
        [chemIds['CHM-LEV'], 0.5, null, 4, false],
        [chemIds['CHM-ACE'], null, 1.5, 5, false],
      ]],
      ['RCP-WNR-MOS', shadeIds['SC-003'], fabricIds['FAB-MOS'], 'JET_DYEING', 10.0, 130, 75, 5.0, [
        [chemIds['DYE-DSR'], 3.2, null, 1, true],
        [chemIds['DYE-DSY'], 0.8, null, 2, false],
        [chemIds['CHM-DIS'], 1.2, null, 3, true],
        [chemIds['CHM-LEV'], 0.5, null, 4, false],
      ]],
      ['RCP-BLK-COT', shadeIds['SC-008'], fabricIds['FAB-COT'], 'JET_DYEING', 8.0, 60, 120, 11.0, [
        [chemIds['DYE-RCR'], 1.8, null, 1, true],
        [chemIds['DYE-RCB'], 4.2, null, 2, true],
        [chemIds['CHM-SOD'], null, 20, 3, true],
        [chemIds['CHM-CAU'], null, 5, 4, false],
      ]],
      ['RCP-DPK-SAT', shadeIds['SC-004'], fabricIds['FAB-SAT'], 'JET_DYEING', 10.0, 130, 45, 5.5, [
        [chemIds['DYE-DSR'], 0.4, null, 1, true],
        [chemIds['DYE-DSY'], 0.1, null, 2, false],
        [chemIds['CHM-DIS'], 0.8, null, 3, true],
      ]]
    ];
    for (const [code, shadeId, fabId, mtype, lr, temp, time, ph, lines] of recipeDefs) {
      const r = await c.query(`
        INSERT INTO recipes (tenant_id, recipe_code, shade_id, fabric_id, machine_type, liquor_ratio, process_temp_celsius, cycle_time_mins, ph_target, is_approved, approved_by, approved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW())
        ON CONFLICT DO NOTHING RETURNING recipe_id
      `, [TENANT_ID, code, shadeId, fabId, mtype, lr, temp, time, ph, userIds['admin']]);
      if (r.rows[0]) {
        for (const [itemId, dpct, dgpl, seq, crit] of lines) {
          await c.query(`
            INSERT INTO recipe_lines (recipe_id, item_id, dosage_pct, dosage_gpl, sequence_no, is_critical)
            VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
          `, [r.rows[0].recipe_id, itemId, dpct, dgpl, seq, crit]);
        }
      }
    }
    console.log('  ✓ 4 Recipes with chemical dosing lines');

    // ─── RATE MASTER ───────────────────────────────────────────
    const rates = [
      [partyIds['TRD-001'], fabricIds['FAB-GEO'], 'DYEING', 12.50, null, 0, 5000],
      [partyIds['TRD-001'], fabricIds['FAB-MOS'], 'DYEING', 14.00, null, 0, 5000],
      [partyIds['TRD-002'], fabricIds['FAB-COT'], 'DYEING', 18.00, null, 0, 10000],
      [partyIds['TRD-003'], fabricIds['FAB-SAT'], 'FINISHING', 8.50, null, 0, 3000],
      [null, null, 'DYEING', 15.00, null, 0, 99999]  // Default rate
    ];
    for (const [pid, fid, proc, rpm, rpk, smin, smax] of rates) {
      await c.query(`
        INSERT INTO rate_master (tenant_id, party_id, fabric_id, process_name, rate_per_meter, rate_per_kg, slab_min_qty, slab_max_qty, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) ON CONFLICT DO NOTHING
      `, [TENANT_ID, pid, fid, proc, rpm, rpk, smin, smax]);
    }
    console.log('  ✓ 5 Rate Master entries');

    // ─── JOB ORDERS ────────────────────────────────────────────
    const FY = '2025-26';
    const jobOrders = [
      [`JO/${FY}/00001`, partyIds['TRD-001'], fabricIds['FAB-GEO'], 5000, null, shadeIds['SC-001'], 'DYEING', '2025-08-30', 12.50, 'METER', 'COMPLETED'],
      [`JO/${FY}/00002`, partyIds['TRD-001'], fabricIds['FAB-MOS'], 3000, null, shadeIds['SC-003'], 'DYEING', '2025-09-05', 14.00, 'METER', 'IN_PRODUCTION'],
      [`JO/${FY}/00003`, partyIds['TRD-002'], fabricIds['FAB-COT'], 8000, null, shadeIds['SC-008'], 'DYEING', '2025-09-15', 18.00, 'METER', 'CONFIRMED'],
      [`JO/${FY}/00004`, partyIds['TRD-003'], fabricIds['FAB-SAT'], 2000, null, shadeIds['SC-004'], 'FINISHING', '2025-09-20', 8.50, 'METER', 'DRAFT'],
      [`JO/${FY}/00005`, partyIds['TRD-002'], fabricIds['FAB-RAY'], 4000, null, shadeIds['SC-005'], 'DYEING', '2025-09-25', 15.00, 'METER', 'DISPATCHED']
    ];
    const joIds = {};
    for (const [joNo, pid, fid, qty, qtyKg, shId, ptype, ddate, rate, buom, status] of jobOrders) {
      const r = await c.query(`
        INSERT INTO job_orders (tenant_id, job_order_no, party_id, fabric_id, qty_meters_ordered, qty_kg_ordered, shade_id, process_type, required_delivery_date, rate_per_meter, billing_uom, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING RETURNING job_order_id
      `, [TENANT_ID, joNo, pid, fid, qty, qtyKg, shId, ptype, ddate, rate, buom, status, userIds['admin']]);
      if (r.rows[0]) joIds[joNo] = r.rows[0].job_order_id;
    }
    console.log('  ✓ 5 Job Orders (Draft, Confirmed, In Production, Completed, Dispatched)');

    // ─── LOTS ──────────────────────────────────────────────────
    const lots = [
      [`LOT/${FY}/00001`, joIds[`JO/${FY}/00001`], `SKD-${FY}-00001`, 5000, null, 4750, null, 5.0, 'QC_PASSED'],
      [`LOT/${FY}/00002`, joIds[`JO/${FY}/00002`], `SKD-${FY}-00002`, 3000, null, null, null, null, 'IN_PROCESS'],
      [`LOT/${FY}/00003`, joIds[`JO/${FY}/00005`], `SKD-${FY}-00003`, 4000, null, 3800, null, 5.0, 'DISPATCHED']
    ];
    const lotIds = {};
    for (const [lotNo, joId, barcode, inM, inKg, outM, outKg, shrink, status] of lots) {
      if (!joId) continue;
      const r = await c.query(`
        INSERT INTO lots (tenant_id, lot_no, job_order_id, barcode_value, grey_qty_meters_in, grey_qty_kg_in, finished_qty_meters, finished_qty_kg, cumulative_shrinkage_pct, current_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING RETURNING lot_id
      `, [TENANT_ID, lotNo, joId, barcode, inM, inKg, outM, outKg, shrink, status]);
      if (r.rows[0]) lotIds[lotNo] = r.rows[0].lot_id;
    }
    console.log('  ✓ 3 Lots with barcodes and process tracking');

    // ─── SAMPLE LOT TAKAS ──────────────────────────────────────
    const firstLotId = lotIds[`LOT/${FY}/00001`];
    if (firstLotId) {
      const takas = [
        [1, 520, 3.12], [2, 480, 2.88], [3, 510, 3.06], [4, 490, 2.94],
        [5, 500, 3.00], [6, 530, 3.18], [7, 470, 2.82], [8, 520, 3.12],
        [9, 500, 3.00], [10, 480, 2.88]
      ];
      for (const [no, m, kg] of takas) {
        await c.query(`
          INSERT INTO lot_takas (tenant_id, lot_id, taka_no, meters, weight_kg, grade)
          VALUES ($1, $2, $3, $4, $5, 'FRESH') ON CONFLICT DO NOTHING
        `, [TENANT_ID, firstLotId, no, m, kg]);
      }
      console.log('  ✓ 10 Sample Takas for first lot');
    }

    await c.query('COMMIT');
    console.log('\n✅ Demo mill seed complete! Login with username "admin", password "admin123"');
    console.log('   Tenant: Sarv Uttam Fabrics (Sachin GIDC, Surat)');

  } catch (err) {
    await c.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    c.release();
    await pool.end();
  }
}

run();
