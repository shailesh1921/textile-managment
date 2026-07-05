const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL is not set.');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL. Initializing dyeing mill ERP schema...');

    await client.query(`
      DROP TABLE IF EXISTS
        communication_logs, return_materials, eway_bills, dispatch_challan_lines, dispatch_challans,
        lot_cost_sheets, party_ledger, job_work_bills, gst_invoice_lines, gst_invoices,
        purchase_invoices, grn_records, po_items, purchase_orders,
        packing_stock, packing_materials, finished_goods_inventory, grey_fabric_inventory,
        dye_chemical_stock_batches, stock_movements, reorder_alerts,
        qc_hold_notifications, lab_test_results, shade_approval_logs, qc_defects, qc_inspections,
        reprocess_records, production_entries, recipe_dispensing_logs, batch_runs, machine_status_log,
        lot_process_stages, lot_genealogy, lots, job_orders,
        recipe_lines, recipes, process_template_steps, process_templates,
        dye_chemicals, shades, fabrics, parties,
        audit_logs, users, roles, tenants, machines
      CASCADE;
    `);

    await client.query(`
      CREATE TABLE tenants (
        tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mill_name VARCHAR(200) NOT NULL,
        gstin VARCHAR(15) UNIQUE NOT NULL,
        pan VARCHAR(10),
        state_code CHAR(2) DEFAULT '24',
        address TEXT, city VARCHAR(100), pincode VARCHAR(10),
        financial_year_start SMALLINT DEFAULT 4,
        default_uom_fabric VARCHAR(10) DEFAULT 'METER',
        costing_method_chemicals VARCHAR(20) DEFAULT 'FIFO',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE roles (
        role_id SERIAL PRIMARY KEY,
        tenant_id UUID REFERENCES tenants(tenant_id),
        role_code VARCHAR(30) UNIQUE NOT NULL,
        role_name VARCHAR(50) NOT NULL,
        permissions JSONB DEFAULT '{}',
        description VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        employee_code VARCHAR(30),
        role_id INT NOT NULL REFERENCES roles(role_id),
        shift_default VARCHAR(5) DEFAULT 'A',
        is_party_portal_user BOOLEAN DEFAULT FALSE,
        linked_party_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, username),
        UNIQUE(tenant_id, email)
      );
    `);

    await client.query(`
      CREATE TABLE audit_logs (
        log_id BIGSERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        user_id INT REFERENCES users(user_id),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(80),
        entity_id VARCHAR(50),
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE parties (
        party_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        party_code VARCHAR(30) NOT NULL,
        party_type VARCHAR(30) NOT NULL CHECK (party_type IN ('TRADER_MERCHANT','SUPPLIER','TRANSPORTER','BROKER_AGENT')),
        legal_name VARCHAR(200) NOT NULL,
        trade_name VARCHAR(200),
        gstin VARCHAR(15),
        pan VARCHAR(10),
        state_code CHAR(2) DEFAULT '24',
        billing_address TEXT, shipping_address TEXT,
        contact_person VARCHAR(100), mobile VARCHAR(20), email VARCHAR(100),
        credit_limit DECIMAL(15,2) DEFAULT 0,
        credit_period_days INT DEFAULT 30,
        outstanding_balance DECIMAL(15,2) DEFAULT 0,
        broker_commission_pct DECIMAL(5,2) DEFAULT 0,
        is_job_work_client BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, party_code)
      );
    `);

    await client.query(`
      CREATE TABLE fabrics (
        fabric_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        fabric_code VARCHAR(30) NOT NULL,
        fabric_name VARCHAR(200) NOT NULL,
        fabric_category VARCHAR(20) DEFAULT 'WOVEN',
        construction_warp VARCHAR(50),
        construction_weft VARCHAR(50),
        width_inches DECIMAL(6,2),
        finished_width_inches DECIMAL(6,2),
        gsm DECIMAL(6,2),
        blend_composition JSONB DEFAULT '{}',
        hsn_code VARCHAR(8),
        default_shrinkage_pct DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, fabric_code)
      );
    `);

    await client.query(`
      CREATE TABLE shades (
        shade_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        shade_card_no VARCHAR(50) NOT NULL,
        shade_name VARCHAR(100) NOT NULL,
        pantone_ref VARCHAR(30),
        lab_l DECIMAL(8,4), lab_a DECIMAL(8,4), lab_b DECIMAL(8,4),
        delta_e_tolerance DECIMAL(5,2) DEFAULT 1.0,
        approved_sample_image_url VARCHAR(500),
        customer_party_id INT REFERENCES parties(party_id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, shade_card_no)
      );
    `);

    await client.query(`
      CREATE TABLE dye_chemicals (
        item_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        item_code VARCHAR(30) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        category VARCHAR(30) NOT NULL,
        uom VARCHAR(10) DEFAULT 'KG',
        hsn_code VARCHAR(8),
        gst_rate_pct DECIMAL(5,2) DEFAULT 18,
        reorder_level DECIMAL(12,3) DEFAULT 0,
        reorder_qty DECIMAL(12,3) DEFAULT 0,
        preferred_supplier_id INT REFERENCES parties(party_id),
        track_batch_expiry BOOLEAN DEFAULT TRUE,
        shelf_life_days INT DEFAULT 365,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, item_code)
      );
    `);

    await client.query(`
      CREATE TABLE machines (
        machine_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        machine_code VARCHAR(30) NOT NULL,
        machine_name VARCHAR(200) NOT NULL,
        machine_type VARCHAR(30) NOT NULL,
        capacity_value DECIMAL(12,3),
        capacity_uom VARCHAR(30),
        liquor_ratio_min DECIMAL(6,2),
        liquor_ratio_max DECIMAL(6,2),
        current_status VARCHAR(20) DEFAULT 'IDLE',
        location VARCHAR(100),
        hourly_rate DECIMAL(12,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, machine_code)
      );
    `);

    await client.query(`
      CREATE TABLE process_templates (
        template_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        template_name VARCHAR(100) NOT NULL,
        fabric_id INT REFERENCES fabrics(fabric_id),
        process_type VARCHAR(30) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE process_template_steps (
        step_id SERIAL PRIMARY KEY,
        template_id INT NOT NULL REFERENCES process_templates(template_id) ON DELETE CASCADE,
        sequence_no INT NOT NULL,
        process_name VARCHAR(80) NOT NULL,
        machine_type VARCHAR(30),
        standard_time_mins INT DEFAULT 60,
        expected_loss_pct DECIMAL(5,2) DEFAULT 0,
        is_qc_checkpoint BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE recipes (
        recipe_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        recipe_code VARCHAR(30) NOT NULL,
        shade_id INT REFERENCES shades(shade_id),
        fabric_id INT REFERENCES fabrics(fabric_id),
        machine_type VARCHAR(30),
        liquor_ratio DECIMAL(6,2) DEFAULT 8,
        process_temp_celsius DECIMAL(5,1),
        cycle_time_mins INT DEFAULT 120,
        ph_target DECIMAL(4,2),
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by INT REFERENCES users(user_id),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, recipe_code)
      );
    `);

    await client.query(`
      CREATE TABLE recipe_lines (
        line_id SERIAL PRIMARY KEY,
        recipe_id INT NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
        item_id INT NOT NULL REFERENCES dye_chemicals(item_id),
        dosage_pct DECIMAL(8,4) DEFAULT 0,
        dosage_gpl DECIMAL(8,4) DEFAULT 0,
        sequence_no INT DEFAULT 1,
        is_critical BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE job_orders (
        job_order_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        job_order_no VARCHAR(30) NOT NULL,
        party_id INT NOT NULL REFERENCES parties(party_id),
        broker_id INT REFERENCES parties(party_id),
        fabric_id INT NOT NULL REFERENCES fabrics(fabric_id),
        grey_fabric_state VARCHAR(20) DEFAULT 'GREY',
        ownership_type VARCHAR(20) DEFAULT 'CUSTOMER_OWNED',
        qty_meters_ordered DECIMAL(12,3) NOT NULL,
        qty_kg_ordered DECIMAL(12,3),
        shade_id INT REFERENCES shades(shade_id),
        process_type VARCHAR(30) NOT NULL,
        process_template_id INT REFERENCES process_templates(template_id),
        required_delivery_date DATE,
        rate_per_meter DECIMAL(12,4) DEFAULT 0,
        rate_per_kg DECIMAL(12,4) DEFAULT 0,
        billing_uom VARCHAR(10) DEFAULT 'METER',
        customer_po_ref VARCHAR(50),
        inward_challan_ref VARCHAR(50),
        status VARCHAR(30) DEFAULT 'DRAFT',
        special_instructions TEXT,
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, job_order_no)
      );
    `);

    await client.query(`
      CREATE TABLE lots (
        lot_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
        lot_no VARCHAR(40) NOT NULL,
        job_order_id INT NOT NULL REFERENCES job_orders(job_order_id),
        parent_lot_id INT REFERENCES lots(lot_id),
        lot_type VARCHAR(20) DEFAULT 'PRIMARY',
        barcode_value VARCHAR(100) NOT NULL,
        grey_qty_meters_in DECIMAL(12,3) NOT NULL,
        grey_qty_kg_in DECIMAL(12,3),
        finished_qty_meters DECIMAL(12,3) DEFAULT 0,
        finished_qty_kg DECIMAL(12,3) DEFAULT 0,
        cumulative_shrinkage_pct DECIMAL(6,3) DEFAULT 0,
        current_status VARCHAR(20) DEFAULT 'WAITING',
        is_reprocess BOOLEAN DEFAULT FALSE,
        reprocess_reason_code VARCHAR(30),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, lot_no),
        UNIQUE(tenant_id, barcode_value)
      );
    `);

    await client.query(`
      CREATE TABLE lot_genealogy (
        genealogy_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        parent_lot_id INT NOT NULL REFERENCES lots(lot_id),
        child_lot_id INT NOT NULL REFERENCES lots(lot_id),
        relationship VARCHAR(20) NOT NULL,
        qty_meters_transferred DECIMAL(12,3),
        qty_kg_transferred DECIMAL(12,3),
        reason TEXT,
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE lot_process_stages (
        stage_id SERIAL PRIMARY KEY,
        lot_id INT NOT NULL REFERENCES lots(lot_id) ON DELETE CASCADE,
        sequence_no INT NOT NULL,
        process_name VARCHAR(80) NOT NULL,
        machine_type VARCHAR(30),
        assigned_machine_id INT REFERENCES machines(machine_id),
        status VARCHAR(20) DEFAULT 'PENDING',
        planned_start TIMESTAMPTZ, planned_end TIMESTAMPTZ,
        actual_start TIMESTAMPTZ, actual_end TIMESTAMPTZ,
        input_meters DECIMAL(12,3), input_kg DECIMAL(12,3),
        output_meters DECIMAL(12,3), output_kg DECIMAL(12,3),
        stage_loss_pct DECIMAL(5,2) DEFAULT 0,
        cumulative_shrinkage_pct DECIMAL(6,3) DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE batch_runs (
        batch_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        batch_no VARCHAR(40) NOT NULL,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        stage_id INT NOT NULL REFERENCES lot_process_stages(stage_id),
        machine_id INT NOT NULL REFERENCES machines(machine_id),
        recipe_id INT REFERENCES recipes(recipe_id),
        status VARCHAR(20) DEFAULT 'WAITING',
        shift VARCHAR(5) DEFAULT 'A',
        operator_id INT REFERENCES users(user_id),
        fabric_weight_kg DECIMAL(12,3),
        loaded_at TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE recipe_dispensing_logs (
        dispensing_id SERIAL PRIMARY KEY,
        batch_id INT NOT NULL REFERENCES batch_runs(batch_id) ON DELETE CASCADE,
        item_id INT NOT NULL REFERENCES dye_chemicals(item_id),
        stock_batch_id INT,
        standard_qty DECIMAL(12,4) NOT NULL,
        actual_qty DECIMAL(12,4) NOT NULL,
        variance_qty DECIMAL(12,4) DEFAULT 0,
        variance_pct DECIMAL(6,2) DEFAULT 0,
        dispensed_by INT REFERENCES users(user_id),
        dispensed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE production_entries (
        entry_id SERIAL PRIMARY KEY,
        batch_id INT NOT NULL REFERENCES batch_runs(batch_id),
        shift_date DATE NOT NULL,
        shift VARCHAR(5) DEFAULT 'A',
        operator_id INT REFERENCES users(user_id),
        machine_id INT REFERENCES machines(machine_id),
        input_meters DECIMAL(12,3), input_kg DECIMAL(12,3),
        output_meters DECIMAL(12,3), output_kg DECIMAL(12,3),
        in_process_loss_pct DECIMAL(5,2) DEFAULT 0,
        downtime_mins INT DEFAULT 0,
        downtime_reason VARCHAR(30),
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE reprocess_records (
        reprocess_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        original_lot_id INT NOT NULL REFERENCES lots(lot_id),
        new_lot_id INT NOT NULL REFERENCES lots(lot_id),
        reason_code VARCHAR(30) NOT NULL,
        corrective_action TEXT,
        approved_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE machine_status_log (
        log_id SERIAL PRIMARY KEY,
        machine_id INT NOT NULL REFERENCES machines(machine_id),
        old_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        changed_by INT REFERENCES users(user_id),
        changed_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE qc_inspections (
        inspection_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        inspection_no VARCHAR(30) NOT NULL,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        stage_id INT REFERENCES lot_process_stages(stage_id),
        inspection_type VARCHAR(30) NOT NULL,
        inspection_system VARCHAR(20),
        total_points DECIMAL(8,2) DEFAULT 0,
        qty_inspected_meters DECIMAL(12,3),
        result VARCHAR(20) DEFAULT 'PENDING',
        inspector_id INT REFERENCES users(user_id),
        inspected_at TIMESTAMPTZ DEFAULT NOW(),
        remarks TEXT,
        UNIQUE(tenant_id, inspection_no)
      );
    `);

    await client.query(`
      CREATE TABLE qc_defects (
        defect_id SERIAL PRIMARY KEY,
        inspection_id INT NOT NULL REFERENCES qc_inspections(inspection_id) ON DELETE CASCADE,
        defect_code VARCHAR(30) NOT NULL,
        severity VARCHAR(20) DEFAULT 'MINOR',
        points_assigned DECIMAL(4,1) DEFAULT 0,
        location VARCHAR(100),
        image_url VARCHAR(500)
      );
    `);

    await client.query(`
      CREATE TABLE shade_approval_logs (
        approval_id SERIAL PRIMARY KEY,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        shade_id INT NOT NULL REFERENCES shades(shade_id),
        measured_l DECIMAL(8,4), measured_a DECIMAL(8,4), measured_b DECIMAL(8,4),
        delta_e DECIMAL(5,2),
        tolerance DECIMAL(5,2),
        result VARCHAR(20) NOT NULL,
        approved_by INT REFERENCES users(user_id),
        sample_image_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE lab_test_results (
        test_id SERIAL PRIMARY KEY,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        test_type VARCHAR(30) NOT NULL,
        required_value VARCHAR(50),
        actual_value VARCHAR(50),
        uom VARCHAR(20),
        result VARCHAR(10) DEFAULT 'PASS',
        tested_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE grey_fabric_inventory (
        grey_stock_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        lot_id INT REFERENCES lots(lot_id),
        job_order_id INT REFERENCES job_orders(job_order_id),
        ownership_type VARCHAR(20) NOT NULL,
        party_id INT REFERENCES parties(party_id),
        fabric_id INT REFERENCES fabrics(fabric_id),
        qty_meters DECIMAL(12,3) NOT NULL,
        qty_kg DECIMAL(12,3),
        location VARCHAR(100),
        inward_challan_no VARCHAR(50),
        received_date DATE DEFAULT CURRENT_DATE
      );
    `);

    await client.query(`
      CREATE TABLE dye_chemical_stock_batches (
        stock_batch_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        item_id INT NOT NULL REFERENCES dye_chemicals(item_id),
        batch_lot_no VARCHAR(50),
        qty_on_hand DECIMAL(12,4) NOT NULL,
        uom VARCHAR(10) DEFAULT 'KG',
        unit_cost DECIMAL(12,4) DEFAULT 0,
        expiry_date DATE,
        supplier_id INT REFERENCES parties(party_id),
        warehouse_location VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE stock_movements (
        movement_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        movement_type VARCHAR(30) NOT NULL,
        item_category VARCHAR(20) NOT NULL,
        item_id INT,
        stock_batch_id INT,
        reference_type VARCHAR(50),
        reference_id INT,
        qty DECIMAL(12,4) NOT NULL,
        unit_cost DECIMAL(12,4) DEFAULT 0,
        ownership_type VARCHAR(20),
        notes TEXT,
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE finished_goods_inventory (
        fg_stock_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        job_order_id INT REFERENCES job_orders(job_order_id),
        fabric_id INT REFERENCES fabrics(fabric_id),
        shade_id INT REFERENCES shades(shade_id),
        quality_grade VARCHAR(5) DEFAULT 'A',
        qty_meters DECIMAL(12,3) NOT NULL,
        qty_kg DECIMAL(12,3),
        ownership_type VARCHAR(20) DEFAULT 'CUSTOMER_OWNED',
        location VARCHAR(100),
        qc_inspection_id INT REFERENCES qc_inspections(inspection_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE packing_materials (
        packing_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        item_code VARCHAR(30) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        uom VARCHAR(10) DEFAULT 'PIECE',
        reorder_level DECIMAL(12,3) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(tenant_id, item_code)
      );
    `);

    await client.query(`
      CREATE TABLE packing_stock (
        stock_id SERIAL PRIMARY KEY,
        packing_id INT NOT NULL REFERENCES packing_materials(packing_id),
        qty_on_hand DECIMAL(12,3) NOT NULL,
        unit_cost DECIMAL(12,2) DEFAULT 0,
        location VARCHAR(50)
      );
    `);

    await client.query(`
      CREATE TABLE reorder_alerts (
        alert_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        item_id INT NOT NULL REFERENCES dye_chemicals(item_id),
        current_stock DECIMAL(12,3),
        reorder_level DECIMAL(12,3),
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE purchase_orders (
        po_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        po_number VARCHAR(50) NOT NULL,
        supplier_id INT NOT NULL REFERENCES parties(party_id),
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        status VARCHAR(30) DEFAULT 'DRAFT',
        total_amount DECIMAL(15,2) DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2) DEFAULT 0,
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, po_number)
      );
    `);

    await client.query(`
      CREATE TABLE po_items (
        item_id SERIAL PRIMARY KEY,
        po_id INT NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        chemical_id INT NOT NULL REFERENCES dye_chemicals(item_id),
        quantity DECIMAL(15,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 18,
        received_quantity DECIMAL(15,3) DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE grn_records (
        grn_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        grn_number VARCHAR(30) NOT NULL,
        po_id INT REFERENCES purchase_orders(po_id),
        supplier_id INT REFERENCES parties(party_id),
        received_date DATE DEFAULT CURRENT_DATE,
        total_amount DECIMAL(15,2) DEFAULT 0,
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE dispatch_challans (
        challan_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        challan_no VARCHAR(30) NOT NULL,
        challan_type VARCHAR(30) DEFAULT 'DELIVERY_CHALLAN_JW',
        job_order_id INT REFERENCES job_orders(job_order_id),
        party_id INT NOT NULL REFERENCES parties(party_id),
        dispatch_date TIMESTAMPTZ DEFAULT NOW(),
        transporter_id INT REFERENCES parties(party_id),
        vehicle_no VARCHAR(20),
        lr_no VARCHAR(50), lr_date DATE,
        place_of_supply CHAR(2) DEFAULT '24',
        total_qty_meters DECIMAL(12,3) DEFAULT 0,
        total_qty_kg DECIMAL(12,3) DEFAULT 0,
        gst_section VARCHAR(20) DEFAULT '143',
        status VARCHAR(20) DEFAULT 'DRAFT',
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, challan_no)
      );
    `);

    await client.query(`
      CREATE TABLE dispatch_challan_lines (
        line_id SERIAL PRIMARY KEY,
        challan_id INT NOT NULL REFERENCES dispatch_challans(challan_id) ON DELETE CASCADE,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        fg_stock_id INT REFERENCES finished_goods_inventory(fg_stock_id),
        fabric_id INT REFERENCES fabrics(fabric_id),
        shade_id INT REFERENCES shades(shade_id),
        hsn_code VARCHAR(8),
        qty_meters DECIMAL(12,3) NOT NULL,
        qty_kg DECIMAL(12,3),
        no_of_rolls INT DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE eway_bills (
        eway_bill_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        challan_id INT REFERENCES dispatch_challans(challan_id),
        ewb_no VARCHAR(20),
        valid_upto TIMESTAMPTZ,
        distance_km INT,
        transport_mode VARCHAR(10) DEFAULT 'ROAD',
        api_response JSONB,
        status VARCHAR(20) DEFAULT 'GENERATED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE return_materials (
        return_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        original_challan_id INT REFERENCES dispatch_challans(challan_id),
        party_id INT REFERENCES parties(party_id),
        lot_id INT REFERENCES lots(lot_id),
        qty_meters DECIMAL(12,3),
        reason TEXT,
        received_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'RECEIVED'
      );
    `);

    await client.query(`
      CREATE TABLE gst_invoices (
        invoice_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        invoice_no VARCHAR(30) NOT NULL,
        invoice_type VARCHAR(30) DEFAULT 'JOB_WORK_TAX_INVOICE',
        job_order_id INT REFERENCES job_orders(job_order_id),
        party_id INT NOT NULL REFERENCES parties(party_id),
        invoice_date DATE DEFAULT CURRENT_DATE,
        supply_type VARCHAR(10) DEFAULT 'B2B',
        place_of_supply CHAR(2) DEFAULT '24',
        taxable_value DECIMAL(15,2) DEFAULT 0,
        cgst_amount DECIMAL(15,2) DEFAULT 0,
        sgst_amount DECIMAL(15,2) DEFAULT 0,
        igst_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        irn VARCHAR(100),
        status VARCHAR(20) DEFAULT 'DRAFT',
        created_by INT REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, invoice_no)
      );
    `);

    await client.query(`
      CREATE TABLE gst_invoice_lines (
        line_id SERIAL PRIMARY KEY,
        invoice_id INT NOT NULL REFERENCES gst_invoices(invoice_id) ON DELETE CASCADE,
        line_type VARCHAR(10) DEFAULT 'SERVICE',
        hsn_sac VARCHAR(10) DEFAULT '9988',
        description TEXT,
        qty DECIMAL(12,3) DEFAULT 1,
        rate DECIMAL(12,4) DEFAULT 0,
        taxable_value DECIMAL(15,2) NOT NULL,
        gst_rate DECIMAL(5,2) DEFAULT 18,
        cgst DECIMAL(15,2) DEFAULT 0,
        sgst DECIMAL(15,2) DEFAULT 0,
        igst DECIMAL(15,2) DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE job_work_bills (
        bill_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        job_order_id INT NOT NULL REFERENCES job_orders(job_order_id),
        bill_no VARCHAR(30) NOT NULL,
        processed_qty_meters DECIMAL(12,3) DEFAULT 0,
        processed_qty_kg DECIMAL(12,3) DEFAULT 0,
        rate DECIMAL(12,4) DEFAULT 0,
        gross_amount DECIMAL(15,2) DEFAULT 0,
        delay_penalty DECIMAL(15,2) DEFAULT 0,
        quality_penalty DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2) DEFAULT 0,
        invoice_id INT REFERENCES gst_invoices(invoice_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, bill_no)
      );
    `);

    await client.query(`
      CREATE TABLE party_ledger (
        ledger_entry_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        party_id INT NOT NULL REFERENCES parties(party_id),
        entry_date DATE DEFAULT CURRENT_DATE,
        voucher_type VARCHAR(20) NOT NULL,
        reference_no VARCHAR(50),
        debit_amount DECIMAL(15,2) DEFAULT 0,
        credit_amount DECIMAL(15,2) DEFAULT 0,
        balance DECIMAL(15,2) DEFAULT 0,
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE lot_cost_sheets (
        cost_sheet_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        lot_id INT NOT NULL REFERENCES lots(lot_id),
        recipe_cost DECIMAL(15,2) DEFAULT 0,
        machine_hour_cost DECIMAL(15,2) DEFAULT 0,
        labor_cost DECIMAL(15,2) DEFAULT 0,
        overhead_cost DECIMAL(15,2) DEFAULT 0,
        total_cost DECIMAL(15,2) DEFAULT 0,
        billed_amount DECIMAL(15,2) DEFAULT 0,
        profit_margin DECIMAL(15,2) DEFAULT 0,
        profit_margin_pct DECIMAL(6,2) DEFAULT 0,
        calculated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE purchase_invoices (
        purchase_invoice_id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL,
        invoice_no VARCHAR(30) NOT NULL,
        supplier_id INT REFERENCES parties(party_id),
        grn_id INT REFERENCES grn_records(grn_id),
        invoice_date DATE DEFAULT CURRENT_DATE,
        taxable_value DECIMAL(15,2) DEFAULT 0,
        cgst DECIMAL(15,2) DEFAULT 0, sgst DECIMAL(15,2) DEFAULT 0, igst DECIMAL(15,2) DEFAULT 0,
        itc_eligible BOOLEAN DEFAULT TRUE,
        itc_cgst DECIMAL(15,2) DEFAULT 0, itc_sgst DECIMAL(15,2) DEFAULT 0, itc_igst DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE communication_logs (
        id SERIAL PRIMARY KEY,
        tenant_id UUID,
        party_id INT REFERENCES parties(party_id),
        job_order_id INT REFERENCES job_orders(job_order_id),
        channel VARCHAR(20) DEFAULT 'WhatsApp',
        recipient VARCHAR(50),
        message TEXT,
        status VARCHAR(20) DEFAULT 'Sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX idx_parties_tenant_type ON parties(tenant_id, party_type);
      CREATE INDEX idx_lots_job ON lots(job_order_id);
      CREATE INDEX idx_lots_barcode ON lots(barcode_value);
      CREATE INDEX idx_lot_genealogy_parent ON lot_genealogy(parent_lot_id);
      CREATE INDEX idx_lot_stages_lot ON lot_process_stages(lot_id, sequence_no);
      CREATE INDEX idx_batch_runs_lot ON batch_runs(lot_id);
      CREATE INDEX idx_party_ledger_party ON party_ledger(party_id, entry_date);
      CREATE INDEX idx_job_orders_status ON job_orders(tenant_id, status);
    `);

    console.log('Schema created. Seeding data...');

    await client.query(`
      INSERT INTO tenants (tenant_id, mill_name, gstin, pan, state_code, address, city, pincode)
      VALUES ($1, 'Shree Krishna Dyeing & Finishing Mill', '24AABCS1234A1Z5', 'AABCS1234A', '24',
              'Palsana GIDC, Block 12, Surat', 'Surat', '394305')
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    const roles = [
      [1, 'ADMIN', 'Administrator', '{"all": true}'],
      [2, 'PRODUCTION_MANAGER', 'Production Manager', '{"production": true, "masters": true, "jobs": true}'],
      [3, 'MACHINE_OPERATOR', 'Machine Operator', '{"shop_floor": true}'],
      [4, 'QC_INSPECTOR', 'QC Inspector', '{"quality": true}'],
      [5, 'ACCOUNTS', 'Accounts', '{"finance": true, "dispatch": true}'],
      [6, 'DISPATCH', 'Dispatch', '{"dispatch": true}'],
      [7, 'PARTY_PORTAL', 'Party Portal', '{"portal": true}'],
    ];
    for (const [id, code, name, perms] of roles) {
      await client.query(
        `INSERT INTO roles (role_id, tenant_id, role_code, role_name, permissions) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [id, DEFAULT_TENANT, code, name, perms]
      );
    }

    const adminHash = bcrypt.hashSync('admin123', 10);
    const managerHash = bcrypt.hashSync('manager123', 10);
    const operatorHash = bcrypt.hashSync('operator123', 10);
    const qcHash = bcrypt.hashSync('qc123', 10);

    await client.query(`
      INSERT INTO users (user_id, tenant_id, username, email, password_hash, full_name, role_id, employee_code)
      VALUES
        (1, $1, 'admin', 'admin@skdyeing.com', $2, 'Mill Administrator', 1, 'EMP-001'),
        (2, $1, 'prod_mgr', 'prod@skdyeing.com', $3, 'Production Manager', 2, 'EMP-002'),
        (3, $1, 'operator1', 'op1@skdyeing.com', $4, 'Jet Dyeing Operator', 3, 'EMP-003'),
        (4, $1, 'qc1', 'qc@skdyeing.com', $5, 'QC Inspector', 4, 'EMP-004')
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT, adminHash, managerHash, operatorHash, qcHash]);

    await client.query(`
      INSERT INTO parties (party_id, tenant_id, party_code, party_type, legal_name, trade_name, gstin, state_code, contact_person, mobile, credit_limit, credit_period_days, is_job_work_client)
      VALUES
        (1, $1, 'TRD-001', 'TRADER_MERCHANT', 'Sarv Uttam Fabrics Pvt. Ltd.', 'Sarv Uttam', '24AAACS9999A1Z1', '24', 'Ramesh Kumar', '9876543210', 1000000, 30, TRUE),
        (2, $1, 'TRD-002', 'TRADER_MERCHANT', 'Gopal Ji Textiles', 'Gopal Ji', '24AAACT1111A1Z2', '24', 'Gopal Sharma', '9123456789', 500000, 15, TRUE),
        (3, $1, 'SUP-001', 'SUPPLIER', 'Gujarat Chemicals Co.', 'GujChem', '24AAACG4444A1Z6', '24', 'Anil Mehta', '9333224466', 0, 0, FALSE),
        (4, $1, 'TRN-001', 'TRANSPORTER', 'Surat Road Carriers', 'SRC Logistics', '24AAACR5555A1Z7', '24', 'Mahesh Patel', '9825112233', 0, 0, FALSE),
        (5, $1, 'BRK-001', 'BROKER_AGENT', 'Textile Brokers Surat', 'TBS', '24AAACB6666A1Z8', '24', 'Suresh Shah', '9898012345', 0, 0, FALSE)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO fabrics (fabric_id, tenant_id, fabric_code, fabric_name, fabric_category, construction_warp, construction_weft, width_inches, finished_width_inches, gsm, blend_composition, hsn_code, default_shrinkage_pct)
      VALUES
        (1, $1, 'FAB-PCH-60', 'Polyester Chiffon 60 GSM', 'WOVEN', '75D/144F', '75D/144F', 58, 57, 60, '{"polyester": 100}', '5407', 8.5),
        (2, $1, 'FAB-CTN-120', 'Cotton Sheeting 120 GSM', 'WOVEN', '40s', '40s', 60, 58, 120, '{"cotton": 100}', '5208', 6.0),
        (3, $1, 'FAB-TC-180', 'Poly-Cotton Twill 65/35', 'WOVEN', '30s', '30s', 58, 57, 180, '{"polyester": 65, "cotton": 35}', '5516', 7.5)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO shades (shade_id, tenant_id, shade_card_no, shade_name, lab_l, lab_a, lab_b, delta_e_tolerance, customer_party_id)
      VALUES
        (1, $1, 'SC-NAVY-447', 'Navy Blue RFD-447', 25.5, 5.2, -35.8, 1.0, 1),
        (2, $1, 'SC-BLACK-001', 'Jet Black', 15.0, 0.5, -2.0, 0.8, 1),
        (3, $1, 'SC-RED-H3B', 'Reactive Red H-3B', 45.2, 65.3, 35.1, 1.2, 2)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO dye_chemicals (item_id, tenant_id, item_code, item_name, category, uom, hsn_code, gst_rate_pct, reorder_level, reorder_qty, preferred_supplier_id)
      VALUES
        (1, $1, 'DYE-RR-H3B', 'Reactive Red H-3B', 'REACTIVE_DYE', 'KG', '3204', 18, 25, 100, 3),
        (2, $1, 'DYE-NB-447', 'Disperse Navy Blue 447', 'DISPERSE_DYE', 'KG', '3204', 18, 20, 80, 3),
        (3, $1, 'CHM-SALT', 'Glauber Salt', 'SALT', 'KG', '2501', 5, 500, 2000, 3),
        (4, $1, 'CHM-SODA', 'Soda Ash Light', 'SODA_ASH', 'KG', '2836', 18, 200, 1000, 3),
        (5, $1, 'CHM-SOFT', 'Cationic Softener', 'SOFTENER', 'KG', '3402', 18, 50, 200, 3),
        (6, $1, 'CHM-CAUSTIC', 'Caustic Soda Flakes', 'CAUSTIC_SODA', 'KG', '2815', 18, 150, 500, 3)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO machines (machine_id, tenant_id, machine_code, machine_name, machine_type, capacity_value, capacity_uom, current_status, location, hourly_rate)
      VALUES
        (1, $1, 'JIG-01', 'Sclavos Jigger #1', 'JIGGER', 500, 'KG_PER_BATCH', 'IDLE', 'Dyeing Hall A', 850),
        (2, $1, 'JET-01', 'Thies Soft Flow Jet #1', 'SOFT_FLOW', 300, 'KG_PER_BATCH', 'IDLE', 'Dyeing Hall B', 1200),
        (3, $1, 'JET-02', 'Thies Jet Dyeing #2', 'JET_DYEING', 250, 'KG_PER_BATCH', 'IDLE', 'Dyeing Hall B', 1100),
        (4, $1, 'STN-01', 'Monforts Stenter Line 1', 'STENTER', 2000, 'METERS_PER_HOUR', 'IDLE', 'Finishing Hall', 650),
        (5, $1, 'PAD-01', 'Padding Mangle #1', 'PADDING_MANGLE', 1500, 'METERS_PER_HOUR', 'IDLE', 'Finishing Hall', 500),
        (6, $1, 'SNG-01', 'Singeing Machine', 'SINGEING', 3000, 'METERS_PER_HOUR', 'IDLE', 'Pre-Treatment', 400)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO process_templates (template_id, tenant_id, template_name, fabric_id, process_type)
      VALUES
        (1, $1, 'Polyester Disperse Full Process', 1, 'FULL_PROCESS'),
        (2, $1, 'Cotton Reactive Dyeing Only', 2, 'DYEING_ONLY'),
        (3, $1, 'TC Blend Dyeing + Finishing', 3, 'DYEING_FINISHING')
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO process_template_steps (template_id, sequence_no, process_name, machine_type, standard_time_mins, expected_loss_pct, is_qc_checkpoint)
      VALUES
        (1, 1, 'Singeing', 'SINGEING', 30, 0.5, FALSE),
        (1, 2, 'Desizing & Scouring', 'WASHING', 45, 1.0, FALSE),
        (1, 3, 'Dyeing (Disperse)', 'JET_DYEING', 180, 2.0, TRUE),
        (1, 4, 'Washing & Reduction Clear', 'WASHING', 60, 1.5, FALSE),
        (1, 5, 'Stenter Drying & Setting', 'STENTER', 45, 3.0, FALSE),
        (1, 6, 'Soft Finish (Padding)', 'PADDING_MANGLE', 30, 0.5, FALSE),
        (1, 7, 'Final Inspection & Folding', 'INSPECTION_TABLE', 20, 0.5, TRUE),
        (2, 1, 'Desizing', 'WASHING', 40, 1.0, FALSE),
        (2, 2, 'Reactive Dyeing', 'JIGGER', 240, 2.5, TRUE),
        (2, 3, 'Soaping & Washing', 'WASHING', 60, 1.0, FALSE),
        (3, 1, 'Singeing', 'SINGEING', 30, 0.5, FALSE),
        (3, 2, 'Dyeing', 'SOFT_FLOW', 200, 2.0, TRUE),
        (3, 3, 'Stenter Finishing', 'STENTER', 50, 3.5, TRUE)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO recipes (recipe_id, tenant_id, recipe_code, shade_id, fabric_id, machine_type, liquor_ratio, process_temp_celsius, cycle_time_mins, ph_target, is_approved)
      VALUES
        (1, $1, 'RCP-NAVY-PCH-JET', 1, 1, 'JET_DYEING', 8, 130, 180, 4.5, TRUE),
        (2, $1, 'RCP-RED-CTN-JIG', 3, 2, 'JIGGER', 10, 60, 240, 10.5, TRUE),
        (3, $1, 'RCP-BLK-TC-SF', 2, 3, 'SOFT_FLOW', 12, 135, 200, 4.0, TRUE)
      ON CONFLICT DO NOTHING;
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO recipe_lines (recipe_id, item_id, dosage_pct, sequence_no, is_critical)
      VALUES
        (1, 3, 40.0, 1, FALSE), (1, 2, 2.5, 2, TRUE), (1, 5, 1.0, 3, FALSE),
        (2, 3, 50.0, 1, FALSE), (2, 1, 3.0, 2, TRUE), (2, 4, 15.0, 3, TRUE), (2, 5, 0.8, 4, FALSE),
        (3, 3, 35.0, 1, FALSE), (3, 2, 4.0, 2, TRUE), (3, 6, 2.0, 3, FALSE)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO dye_chemical_stock_batches (tenant_id, item_id, batch_lot_no, qty_on_hand, unit_cost, expiry_date, supplier_id, warehouse_location)
      VALUES
        ($1, 1, 'BATCH-RR-2026-A', 85.5, 480, '2027-06-01', 3, 'Chem Store A'),
        ($1, 2, 'BATCH-NB-2026-A', 62.0, 520, '2027-05-15', 3, 'Chem Store A'),
        ($1, 3, 'BATCH-SALT-2026', 2500, 8, '2028-01-01', 3, 'Chem Store B'),
        ($1, 4, 'BATCH-SODA-2026', 800, 32, '2027-12-01', 3, 'Chem Store B'),
        ($1, 5, 'BATCH-SOFT-2026', 120, 145, '2027-08-01', 3, 'Chem Store A'),
        ($1, 6, 'BATCH-CAU-2026', 450, 55, '2027-10-01', 3, 'Chem Store B')
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO packing_materials (tenant_id, item_code, item_name, uom, reorder_level)
      VALUES ($1, 'PKG-ROLL', 'Cardboard Roll Tubes', 'PIECE', 100), ($1, 'PKG-POLY', 'Poly Bags Large', 'PIECE', 500), ($1, 'PKG-CTN', 'Carton Box 24"', 'PIECE', 200)
    `, [DEFAULT_TENANT]);

    await client.query(`
      INSERT INTO packing_stock (packing_id, qty_on_hand, unit_cost, location)
      SELECT packing_id, 350, 45, 'Packing Store' FROM packing_materials WHERE item_code = 'PKG-ROLL';
      INSERT INTO packing_stock (packing_id, qty_on_hand, unit_cost, location)
      SELECT packing_id, 1200, 8, 'Packing Store' FROM packing_materials WHERE item_code = 'PKG-POLY';
    `);

    console.log('✓ Dyeing mill ERP schema initialized and seeded.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
