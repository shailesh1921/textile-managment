const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to Neon PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    // Create DDL schema
    console.log('Wiping legacy mismatching database tables...');
    await client.query(`
      DROP TABLE IF EXISTS 
        communication_logs, dispatch_notes, batch_approvals, defect_logs, qc_inspections, 
        production_logs, machine_allocations, work_orders, so_items, sales_orders, 
        customers, machines, bom, products, reorder_alerts, stock_movements, 
        inventory_items, supplier_ratings, po_items, purchase_orders, materials, 
        suppliers, audit_logs, users, roles, orders
      CASCADE;
    `);
    console.log('Initializing schema tables...');

    // 1. Roles
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        permissions TEXT,
        description VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details TEXT,
        ip_address VARCHAR(45),
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Suppliers
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        supplier_id SERIAL PRIMARY KEY,
        supplier_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        tax_id VARCHAR(50),
        payment_terms VARCHAR(100),
        credit_limit DECIMAL(15, 2),
        rating DECIMAL(3, 2),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Materials
    await client.query(`
      CREATE TABLE IF NOT EXISTS materials (
        material_id SERIAL PRIMARY KEY,
        material_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        reorder_level DECIMAL(15, 3),
        reorder_quantity DECIMAL(15, 3),
        unit_cost DECIMAL(15, 2),
        hsn_code VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Purchase Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        po_id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id INT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        status VARCHAR(30) DEFAULT 'draft',
        total_amount DECIMAL(15, 2),
        tax_amount DECIMAL(15, 2),
        discount_amount DECIMAL(15, 2),
        net_amount DECIMAL(15, 2),
        payment_terms VARCHAR(100),
        notes TEXT,
        approved_by INT REFERENCES users(user_id),
        approved_at TIMESTAMPTZ,
        created_by INT NOT NULL REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. PO Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS po_items (
        item_id SERIAL PRIMARY KEY,
        po_id INT NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        material_id INT NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
        quantity DECIMAL(15, 3) NOT NULL,
        unit_price DECIMAL(15, 2) NOT NULL,
        total_price DECIMAL(15, 2),
        tax_rate DECIMAL(5, 2),
        tax_amount DECIMAL(15, 2),
        discount_rate DECIMAL(5, 2),
        discount_amount DECIMAL(15, 2),
        received_quantity DECIMAL(15, 3) DEFAULT 0,
        notes TEXT
      );
    `);

    // 8. Supplier Ratings
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_ratings (
        rating_id SERIAL PRIMARY KEY,
        supplier_id INT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
        po_id INT REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
        quality_score DECIMAL(3, 2),
        delivery_score DECIMAL(3, 2),
        price_score DECIMAL(3, 2),
        communication_score DECIMAL(3, 2),
        overall_score DECIMAL(3, 2),
        delivery_time_days INT,
        defect_rate DECIMAL(5, 2),
        comments TEXT,
        rated_by INT REFERENCES users(user_id),
        rated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Inventory Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        item_id SERIAL PRIMARY KEY,
        material_id INT NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
        batch_number VARCHAR(50),
        quantity DECIMAL(15, 3) NOT NULL,
        location VARCHAR(100),
        warehouse VARCHAR(100),
        bin_location VARCHAR(50),
        unit_cost DECIMAL(15, 2),
        total_value DECIMAL(15, 2),
        manufactured_date TIMESTAMPTZ,
        expiry_date TIMESTAMPTZ,
        supplier_id INT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
        po_id INT REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
        quality_status VARCHAR(50) DEFAULT 'approved',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Stock Movements
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        movement_id SERIAL PRIMARY KEY,
        material_id INT NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
        movement_type VARCHAR(30) NOT NULL,
        quantity DECIMAL(15, 3) NOT NULL,
        batch_number VARCHAR(50),
        from_location VARCHAR(100),
        to_location VARCHAR(100),
        reference_type VARCHAR(50),
        reference_id INT,
        unit_cost DECIMAL(15, 2),
        total_value DECIMAL(15, 2),
        notes TEXT,
        created_by INT NOT NULL REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. Reorder Alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS reorder_alerts (
        alert_id SERIAL PRIMARY KEY,
        material_id INT NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
        current_stock DECIMAL(15, 3),
        reorder_level DECIMAL(15, 3),
        recommended_quantity DECIMAL(15, 3),
        priority VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        po_id INT REFERENCES purchase_orders(po_id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        resolved_by INT REFERENCES users(user_id)
      );
    `);

    // 12. Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        unit VARCHAR(20),
        standard_cost DECIMAL(15, 2),
        selling_price DECIMAL(15, 2),
        lead_time_days INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 13. BOM
    await client.query(`
      CREATE TABLE IF NOT EXISTS bom (
        bom_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
        material_id INT NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
        quantity_required DECIMAL(15, 3) NOT NULL,
        wastage_percentage DECIMAL(5, 2) DEFAULT 0,
        unit VARCHAR(20),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 14. Machines
    await client.query(`
      CREATE TABLE IF NOT EXISTS machines (
        machine_id SERIAL PRIMARY KEY,
        machine_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        machine_type VARCHAR(100),
        capacity DECIMAL(15, 3),
        capacity_unit VARCHAR(20),
        status VARCHAR(30) DEFAULT 'available',
        location VARCHAR(100),
        purchase_date DATE,
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        maintenance_frequency_days INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 15. Customers (Surat Traders)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        tax_id VARCHAR(50),
        credit_limit DECIMAL(15, 2),
        credit_days INT,
        region VARCHAR(100),
        customer_type VARCHAR(50),
        rating DECIMAL(3, 2),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 16. Sales Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        so_id SERIAL PRIMARY KEY,
        so_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
        order_date DATE NOT NULL,
        delivery_date DATE,
        status VARCHAR(30) DEFAULT 'draft',
        total_amount DECIMAL(15, 2),
        tax_amount DECIMAL(15, 2),
        discount_amount DECIMAL(15, 2),
        net_amount DECIMAL(15, 2),
        payment_terms VARCHAR(100),
        shipping_address TEXT,
        billing_address TEXT,
        notes TEXT,
        customer_po_number VARCHAR(100),
        created_by INT NOT NULL REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 17. SO Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS so_items (
        item_id SERIAL PRIMARY KEY,
        so_id INT NOT NULL REFERENCES sales_orders(so_id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
        quantity DECIMAL(15, 3) NOT NULL,
        unit_price DECIMAL(15, 2) NOT NULL,
        total_price DECIMAL(15, 2),
        tax_rate DECIMAL(5, 2),
        tax_amount DECIMAL(15, 2),
        discount_rate DECIMAL(5, 2),
        discount_amount DECIMAL(15, 2),
        dispatched_quantity DECIMAL(15, 3) DEFAULT 0,
        notes TEXT
      );
    `);

    // 18. Work Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        wo_id SERIAL PRIMARY KEY,
        wo_number VARCHAR(50) UNIQUE NOT NULL,
        product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
        quantity DECIMAL(15, 3) NOT NULL,
        unit VARCHAR(20),
        planned_start_date DATE,
        planned_end_date DATE,
        actual_start_date TIMESTAMPTZ,
        actual_end_date TIMESTAMPTZ,
        status VARCHAR(30) DEFAULT 'draft',
        priority VARCHAR(20),
        sales_order_id INT REFERENCES sales_orders(so_id) ON DELETE SET NULL,
        produced_quantity DECIMAL(15, 3) DEFAULT 0,
        rejected_quantity DECIMAL(15, 3) DEFAULT 0,
        notes TEXT,
        created_by INT NOT NULL REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 19. Machine Allocations
    await client.query(`
      CREATE TABLE IF NOT EXISTS machine_allocations (
        allocation_id SERIAL PRIMARY KEY,
        wo_id INT NOT NULL REFERENCES work_orders(wo_id) ON DELETE CASCADE,
        machine_id INT NOT NULL REFERENCES machines(machine_id) ON DELETE CASCADE,
        planned_start_time TIMESTAMPTZ,
        planned_end_time TIMESTAMPTZ,
        actual_start_time TIMESTAMPTZ,
        actual_end_time TIMESTAMPTZ,
        status VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 20. Production Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS production_logs (
        log_id SERIAL PRIMARY KEY,
        wo_id INT NOT NULL REFERENCES work_orders(wo_id) ON DELETE CASCADE,
        quantity_produced DECIMAL(15, 3) NOT NULL,
        quantity_rejected DECIMAL(15, 3) DEFAULT 0,
        shift VARCHAR(20),
        operator_id INT REFERENCES users(user_id),
        supervisor_id INT REFERENCES users(user_id),
        machine_id INT REFERENCES machines(machine_id) ON DELETE SET NULL,
        downtime_minutes INT DEFAULT 0,
        downtime_reason TEXT,
        notes TEXT,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 21. QC Inspections
    await client.query(`
      CREATE TABLE IF NOT EXISTS qc_inspections (
        inspection_id SERIAL PRIMARY KEY,
        inspection_number VARCHAR(50) UNIQUE NOT NULL,
        wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
        po_id INT REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        batch_number VARCHAR(50) NOT NULL,
        inspection_date TIMESTAMPTZ DEFAULT NOW(),
        inspector_id INT NOT NULL REFERENCES users(user_id),
        quantity_inspected DECIMAL(15, 3) NOT NULL,
        quantity_accepted DECIMAL(15, 3),
        quantity_rejected DECIMAL(15, 3),
        result VARCHAR(20) DEFAULT 'pending',
        remarks TEXT,
        approved_by INT REFERENCES users(user_id),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 22. Defect Types
    await client.query(`
      CREATE TABLE IF NOT EXISTS defect_types (
        type_id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        threshold_percentage DECIMAL(5, 2),
        severity VARCHAR(20) DEFAULT 'minor',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 23. Defect Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS defect_logs (
        defect_id SERIAL PRIMARY KEY,
        inspection_id INT NOT NULL REFERENCES qc_inspections(inspection_id) ON DELETE CASCADE,
        defect_type_id INT NOT NULL REFERENCES defect_types(type_id) ON DELETE CASCADE,
        quantity DECIMAL(15, 3) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        location VARCHAR(200),
        description TEXT,
        root_cause TEXT,
        corrective_action TEXT,
        image_url VARCHAR(500),
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 24. Batch Approvals
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_approvals (
        approval_id SERIAL PRIMARY KEY,
        batch_number VARCHAR(50) NOT NULL,
        inspection_id INT NOT NULL REFERENCES qc_inspections(inspection_id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INT REFERENCES users(user_id),
        approved_at TIMESTAMPTZ,
        rejection_reason TEXT,
        rework_instructions TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 25. Dispatch Notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispatch_notes (
        dispatch_id SERIAL PRIMARY KEY,
        dispatch_number VARCHAR(50) UNIQUE NOT NULL,
        so_id INT NOT NULL REFERENCES sales_orders(so_id) ON DELETE CASCADE,
        dispatch_date TIMESTAMPTZ DEFAULT NOW(),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(100),
        driver_phone VARCHAR(20),
        transporter VARCHAR(200),
        tracking_number VARCHAR(100),
        expected_delivery_date DATE,
        actual_delivery_date TIMESTAMPTZ,
        delivery_status VARCHAR(50) DEFAULT 'dispatched',
        notes TEXT,
        created_by INT NOT NULL REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 26. Communication Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
        order_id INT REFERENCES sales_orders(so_id) ON DELETE SET NULL,
        channel VARCHAR(20) NOT NULL,
        recipient VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✓ Database tables verified.');

    // Seed default Roles
    console.log('Seeding initial roles...');
    await client.query(`
      INSERT INTO roles (role_id, role_name, permissions, description)
      VALUES 
        (1, 'Admin', '*', 'Administrator with full system permissions'),
        (2, 'Manager', 'view,edit,create', 'Manager with operational controls'),
        (3, 'Operator', 'view,log_production', 'Shopfloor operator for machines and logs')
      ON CONFLICT (role_id) DO NOTHING;
    `);

    // Seed default Users
    console.log('Seeding default users...');
    const adminHash = bcrypt.hashSync('admin123', 10);
    const managerHash = bcrypt.hashSync('manager123', 10);
    const operatorHash = bcrypt.hashSync('operator123', 10);

    await client.query(`
      INSERT INTO users (user_id, username, email, password_hash, full_name, role_id)
      VALUES
        (1, 'admin', 'admin@sarvuttam.com', $1, 'Admin Administrator', 1),
        (2, 'manager1', 'manager@sarvuttam.com', $2, 'Manager Operations', 2),
        (3, 'operator1', 'operator@sarvuttam.com', $3, 'Machine Operator 1', 3)
      ON CONFLICT (user_id) DO NOTHING;
    `, [adminHash, managerHash, operatorHash]);

    // Seed default Defect Types
    console.log('Seeding defect types...');
    await client.query(`
      INSERT INTO defect_types (type_id, code, name, category, description, threshold_percentage, severity)
      VALUES
        (1, 'DEF-001', 'Weft Bar', 'Weaving', 'Shade variation across the width due to yarn count change', 2.00, 'major'),
        (2, 'DEF-002', 'Dye Spot', 'Dyeing', 'Concentrated spots of dye on fabric surface', 1.00, 'major'),
        (3, 'DEF-003', 'Stain', 'Finishing', 'Oil, grease or chemical stains', 1.50, 'critical'),
        (4, 'DEF-004', 'Missing Pick', 'Weaving', 'Missing weft yarn leading to thread gaps', 3.00, 'minor'),
        (5, 'DEF-005', 'Uneven Width', 'Finishing', 'Variance in fabric width beyond tolerances', 2.50, 'minor')
      ON CONFLICT (type_id) DO NOTHING;
    `);

    // Seed default Materials (Chemicals, Yarns, Packaging)
    console.log('Seeding default materials...');
    await client.query(`
      INSERT INTO materials (material_id, material_code, name, description, category, unit, reorder_level, reorder_quantity, unit_cost)
      VALUES
        (1, 'MAT-YRN-01', 'Cotton Yarn 40s', 'High quality combed cotton yarn', 'raw_material', 'kg', 500.0, 1000.0, 240.00),
        (2, 'MAT-YRN-02', 'Polyester Yarn 150D', 'Texturized polyester yarn', 'raw_material', 'kg', 300.0, 800.0, 110.00),
        (3, 'MAT-CHM-01', 'Reactive Dye Red H-3B', 'Industrial fabric reactive dye', 'consumable', 'kg', 50.0, 150.0, 480.00),
        (4, 'MAT-CHM-02', 'Soda Ash', 'Dyeing chemical auxiliary', 'consumable', 'kg', 200.0, 500.0, 32.00),
        (5, 'MAT-PKG-01', 'Cardboard Rolls', 'Tubes for rolling finished fabric', 'consumable', 'piece', 100.0, 300.0, 45.00)
      ON CONFLICT (material_id) DO NOTHING;
    `);

    // Seed default Finished Products (Fabrics)
    console.log('Seeding default products...');
    await client.query(`
      INSERT INTO products (product_id, product_code, name, description, category, unit, standard_cost, selling_price, lead_time_days)
      VALUES
        (1, 'PRD-COT-01', 'Premium Cotton Sheeting', '100% Cotton combed sheeting fabric, 120 GSM', 'finished_goods', 'meter', 160.00, 220.00, 7),
        (2, 'PRD-POLY-01', 'Polyester Satin', 'Heavy sheen polyester satin fabric, 80 GSM', 'finished_goods', 'meter', 75.00, 115.00, 5),
        (3, 'PRD-BLD-01', 'TC Twill 65/35', 'Polyester cotton blend twill fabric for uniforms', 'finished_goods', 'meter', 110.00, 155.00, 10)
      ON CONFLICT (product_id) DO NOTHING;
    `);

    // Seed default Machines
    console.log('Seeding default machines...');
    await client.query(`
      INSERT INTO machines (machine_id, machine_code, name, machine_type, capacity, capacity_unit, status, location)
      VALUES
        (1, 'MAC-WVE-01', 'Tsudakoma Air Jet Loom', 'Weaving', 1200.0, 'meter/day', 'available', 'Weaving Hall A'),
        (2, 'MAC-WVE-02', 'Picanol Rapier Loom', 'Weaving', 800.0, 'meter/day', 'in_use', 'Weaving Hall A'),
        (3, 'MAC-DYE-01', 'Sclavos Jigger Dyeing Machine', 'Dyeing', 500.0, 'kg/batch', 'available', 'Dyeing Section B'),
        (4, 'MAC-FIN-01', 'Monforts Stenter Machine', 'Finishing', 2000.0, 'meter/hour', 'maintenance', 'Finishing Hall C')
      ON CONFLICT (machine_id) DO NOTHING;
    `);

    // Seed default Customers (Surat Traders - Sarv Uttam & others)
    console.log('Seeding customers directory...');
    await client.query(`
      INSERT INTO customers (customer_id, customer_code, name, contact_person, email, phone, address, city, state, tax_id, credit_limit, credit_days, region)
      VALUES
        (1, 'CUST-SU01', 'Sarv Uttam Fabrics Pvt. Ltd.', 'Ramesh Kumar', 'ramesh@sarvuttamfabrics.com', '9876543210', 'Palsana Block 295, Surat', 'Surat', 'Gujarat', '24AAACS9999A1Z1', 1000000.00, 30, 'Surat Industrial Area'),
        (2, 'CUST-ST01', 'Gopal Ji Textiles', 'Gopal Sharma', 'gopal@gopaljitextiles.com', '9123456789', 'Millennium Textile Market, Ring Road', 'Surat', 'Gujarat', '24AAACT1111A1Z2', 500000.00, 15, 'Surat Ring Road'),
        (3, 'CUST-ST02', 'Krishna Apparels', 'Vijay Shah', 'vijay@krishnaapparels.com', '9988776655', 'Sangini Textile Hub, Palsana', 'Surat', 'Gujarat', '24AAACK2222A1Z3', 750000.00, 45, 'Surat Palsana Road')
      ON CONFLICT (customer_id) DO NOTHING;
    `);

    // Seed default Suppliers
    console.log('Seeding suppliers...');
    await client.query(`
      INSERT INTO suppliers (supplier_id, supplier_code, name, contact_person, email, phone, address, city, state, tax_id, status)
      VALUES
        (1, 'SUP-YRN-01', 'Surat Yarn Spinners Ltd.', 'Mohit Patel', 'mohit@suratyarn.com', '9555123456', 'Palsana GIDC Phase 2', 'Surat', 'Gujarat', '24AAACS5555A1Z5', 'active'),
        (2, 'SUP-CHM-01', 'Gujarat Chemicals Co.', 'Anil Mehta', 'anil@gujchem.com', '9333224466', 'Vapi Industrial Estate', 'Vapi', 'Gujarat', '24AAACG4444A1Z6', 'active')
      ON CONFLICT (supplier_id) DO NOTHING;
    `);

    console.log('✓ Seeding database complete.');
  } catch (err) {
    console.error('Database migration/seeding failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
