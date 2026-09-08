const fs = require('fs');
const path = require('path');
const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType, VerticalAlign
} = require('docx');
const { execSync } = require('child_process');

async function createDocx() {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  };

  const createCell = (text, isHeader = false, widthPct = 50, isBold = false) => {
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: isHeader ? { fill: "F2F2F2", type: ShadingType.CLEAR } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 150, right: 150 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: isHeader || isBold,
              font: "Calibri",
              size: 20, // 10pt
              color: "000000"
            })
          ]
        })
      ]
    });
  };

  const createSectionHeader = (title) => {
    return new Paragraph({
      shading: { fill: "D9E1F2", type: ShadingType.CLEAR },
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: "Calibri",
          size: 22, // 11pt
          color: "1F4E78"
        })
      ]
    });
  };

  const createBullet = (boldTitle, text) => {
    return new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: boldTitle + " ", bold: true, font: "Calibri", size: 21 }),
        new TextRun({ text: text, font: "Calibri", size: 21 })
      ]
    });
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 21, color: "000000" },
          paragraph: { spacing: { line: 276, before: 60, after: 60 } }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
          }
        },
        children: [
          // Header / University Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({ text: "P P SAVANI UNIVERSITY", bold: true, size: 28, font: "Calibri", color: "1F4E78" }),
              new TextRun({ text: "  |  NAAC A+ ACCREDITED  |  ", size: 20, font: "Calibri", color: "7F7F7F" }),
              new TextRun({ text: "SCHOOL OF ENGINEERING", bold: true, size: 24, font: "Calibri", color: "385723" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 200 },
            children: [
              new TextRun({ text: "INTERNSHIP / UDP / TRAINING REPORT – REPORTING 3\n", bold: true, size: 26, font: "Calibri" }),
              new TextRun({ text: "(Advanced Implementation, Testing & Validation Progress Report)", italics: true, size: 20, color: "595959", font: "Calibri" })
            ]
          }),

          // 1. Student Information
          createSectionHeader("1. Student Information"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Student Name", false, 35, true), createCell("Deep Patel", false, 65)] }),
              new TableRow({ children: [createCell("Enrollment Number", false, 35, true), createCell("23SE02IT048", false, 65)] }),
              new TableRow({ children: [createCell("Program/Branch", false, 35, true), createCell("B-Tech IT", false, 65)] }),
              new TableRow({ children: [createCell("Semester", false, 35, true), createCell("7th", false, 65)] }),
              new TableRow({ children: [createCell("Contact Number", false, 35, true), createCell("8780414037", false, 65)] }),
              new TableRow({ children: [createCell("Email ID", false, 35, true), createCell("23se02it048@ppsu.ac.in", false, 65)] })
            ]
          }),

          // 2. Internship Details
          createSectionHeader("2. Internship / UDP / Training Details"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Type", false, 35, true), createCell("Internship", false, 65)] }),
              new TableRow({ children: [createCell("Company/Organization", false, 35, true), createCell("Techomax Solutions", false, 65)] }),
              new TableRow({ children: [createCell("Department/Domain", false, 35, true), createCell("Web Development & Enterprise Software Engineering", false, 65)] }),
              new TableRow({ children: [createCell("Mentor Name (Company)", false, 35, true), createCell("Mr. Himanshu Prajapati", false, 65)] }),
              new TableRow({ children: [createCell("Mentor Name (Institute)", false, 35, true), createCell("Mr. Ajay Chouhan", false, 65)] }),
              new TableRow({ children: [createCell("Start Date", false, 35, true), createCell("8th June 2026", false, 65)] }),
              new TableRow({ children: [createCell("End Date", false, 35, true), createCell("3rd October 2026", false, 65)] })
            ]
          }),

          // 3. Work Progress Summary
          createSectionHeader("3. Work Progress Summary"),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: "a) Project Title:\n", bold: true, size: 22 }),
              new TextRun({ text: "Design and Development of Cloud-Native Multi-Tenant ERP & Production Management System for Textile Dyeing & Processing Mills", size: 21 })
            ]
          }),

          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: "b) Brief Overview of Work Completed After Reporting 2:", bold: true, size: 22 })]
          }),
          createBullet("• Major tasks completed:", "Developed end-to-end multi-tenant business workflows for commission-based textile dyeing houses, including roll-level (Taka) meterage tracking, batch utility fuel logging (coal/gas/steam/power), ASTM D5430 4-Point QC auditing, and PDFKit QR-coded lot traveler card generation."),
          createBullet("• Modules completed:", "Completed Master Data Management (8 tabs), Job Orders & Inward GRN, Production Batch Engine & Machine Routing, Quality Assurance with CIELAB spectrophotometer shade matching, Inventory & Procurement, Section 143 GST Dispatch Challans, and Lot Cost Sheet Profitability Analysis."),
          createBullet("• New features implemented:", "Integrated dual Unit of Measure (UOM) converter (Meters vs. KG dynamically derived from GSM), live commodity market ticker, WhatsApp payment reminder webhooks, and executive turnaround KPIs."),
          createBullet("• Research / development work completed:", "Researched Surat process house operations, PostgreSQL multi-tenant isolation via JWT middleware, real-time utility costing algorithms, and PDF vector streaming."),
          createBullet("• Integration work completed:", "Connected React frontend with Node.js/Express REST APIs and Neon Cloud Serverless PostgreSQL database with automated database sequence resynchronization."),

          // Completion status table
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: "c) Overall Project Completion Status", bold: true, size: 22 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Component", true, 40), createCell("Status", true, 30), createCell("Completion (%)", true, 30)] }),
              new TableRow({ children: [createCell("Requirement / Analysis"), createCell("Completed"), createCell("100%")] }),
              new TableRow({ children: [createCell("Design & Architecture"), createCell("Completed"), createCell("100%")] }),
              new TableRow({ children: [createCell("Development"), createCell("Completed"), createCell("90%")] }),
              new TableRow({ children: [createCell("Integration"), createCell("Completed"), createCell("85%")] }),
              new TableRow({ children: [createCell("Testing & Validation"), createCell("In Progress"), createCell("80%")] }),
              new TableRow({ children: [createCell("Documentation & Deployment"), createCell("In Progress"), createCell("75%")] })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [new TextRun({ text: "Overall Project Completion: 88 %", bold: true, size: 22, color: "1F4E78" })]
          }),

          // 4. Advanced Implementation
          createSectionHeader("4. Advanced Implementation"),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: "a) Module / Feature Implementation", bold: true, size: 22 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Module / Feature", true, 25), createCell("Work Completed", true, 55), createCell("Status", true, 20)] }),
              new TableRow({ children: [createCell("Master Data Management", false, 25, true), createCell("Created 8 core entities: Parties, Fabrics, CIELAB Shades, Chemicals, Machines, Process Templates, Recipes, and Dynamic Rates."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Job Orders & Taka Tracking", false, 25, true), createCell("Implemented order creation, greige inwarding (GRN), discrepancy flagging, and roll-level (Taka) breakdown with QR Lot Card PDF printing."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Production & Batch Routing", false, 25, true), createCell("Built machine dashboard, stage-wise batch run executions, liquor ratio chemical dosing calculations, and utility consumption logging."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Quality Control (QC) Audit", false, 25, true), createCell("Implemented ASTM D5430 4-Point fabric inspection matrix, CIELAB Delta E spectrophotometer shade matching, and lab physical testing."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Procurement & Inventory", false, 25, true), createCell("Developed raw material stock batch tracking, expiry monitoring, reorder alerts, and vendor purchase order (PO) generation."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Dispatch & Delivery Challans", false, 25, true), createCell("Implemented finished goods packing list grouping, transporter LR logging, and automated GST Section 143 delivery challan generation."), createCell("Completed")] }),
              new TableRow({ children: [createCell("Finance & Cost Sheets", false, 25, true), createCell("Built party ledger accounting, aging analysis, and lot profitability cost sheets factoring chemical, utility, labor, and machine overheads."), createCell("Completed")] })
            ]
          }),

          // 4b. Integration Details
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: "b) Integration / Development Details", bold: true, size: 22 })]
          }),
          createBullet("• Module integration:", "Integrated all 8 business modules into a unified single-page application (SPA) layout with role-based navigation guards, sticky header controls, and dynamic tabbed switching without page reloads."),
          createBullet("• API integration:", "Constructed over 35 Express RESTful API endpoints covering authenticated CRUD operations, transaction-wrapped batch runs, and PDF streaming. Unified API client in React handles automated bearer token injection."),
          createBullet("• Database integration:", "Architected relational schema in Neon PostgreSQL consisting of 28 normalized tables with foreign keys, cascading constraints, auto-increment serial sequences, and multi-tenant tenant_id indexing."),
          createBullet("• Software integration:", "Integrated React 18, Vite, Tailwind CSS, Lucide React icons, PDFKit, QRCode, Recharts for executive analytics, and bcryptjs/jsonwebtoken for enterprise-grade authentication."),
          createBullet("• Major coding / development work:", "Refined reusable UI components, created inline creation modal forms across all master tabs, implemented dual UOM dynamic calculation algorithms, and resolved PostgreSQL sequence drifts."),

          // 5. Testing and Validation
          createSectionHeader("5. Testing and Validation"),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: "Testing Performed", bold: true, size: 22 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Test No.", true, 10), createCell("Test / Function", true, 25), createCell("Expected Result", true, 35), createCell("Actual Result", true, 20), createCell("Status", true, 10)] }),
              new TableRow({ children: [createCell("1"), createCell("JWT Auth & Tenant Isolation"), createCell("Valid login returns token; cross-tenant access blocked"), createCell("Tenant data strictly isolated"), createCell("Pass")] }),
              new TableRow({ children: [createCell("2"), createCell("Taka Roll Breakdown"), createCell("Adding rolls recalculates total lot meters and KG"), createCell("Sum and weight calculated accurately"), createCell("Pass")] }),
              new TableRow({ children: [createCell("3"), createCell("QR Lot Card Generation"), createCell("Print Lot Card streams PDF with QR code"), createCell("PDF generated with readable QR code"), createCell("Pass")] }),
              new TableRow({ children: [createCell("4"), createCell("Utility Consumption Log"), createCell("Logging fuel logs shift usage and computes cost"), createCell("Computed total cost dynamically"), createCell("Pass")] }),
              new TableRow({ children: [createCell("5"), createCell("ASTM 4-Point QC Audit"), createCell("Computes points per 100 sq. m and checks threshold"), createCell("Accurately evaluated PASS/FAIL status"), createCell("Pass")] }),
              new TableRow({ children: [createCell("6"), createCell("Section 143 Challan"), createCell("Challan generation deducts inventory & logs LR"), createCell("Challan generated and stock updated"), createCell("Pass")] }),
              new TableRow({ children: [createCell("7"), createCell("Lot Profitability Costing"), createCell("Cost sheet factors chemicals, fuel, and overheads"), createCell("Gross profit margin rendered cleanly"), createCell("Pass")] }),
              new TableRow({ children: [createCell("8"), createCell("Responsive UI Layout"), createCell("Layout adapts cleanly on desktop, tablet, and mobile"), createCell("Responsive across all viewport sizes"), createCell("Pass")] })
            ]
          }),

          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: "Testing Methods Used", bold: true, size: 22 })]
          }),
          new Paragraph({ children: [new TextRun({ text: "☑ Functional Testing          ☐ Unit Testing (Partial)", font: "Calibri", size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: "☑ Integration Testing         ☑ System Testing", font: "Calibri", size: 21 })] }),
          new Paragraph({ children: [new TextRun({ text: "☑ Performance Testing         ☑ Database Validation", font: "Calibri", size: 21 })] }),

          // 6. Results and Performance Analysis
          createSectionHeader("6. Results and Performance Analysis"),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: "a) Final / Updated Results:\n", bold: true, size: 22 }),
              new TextRun({ text: "The textile ERP modules completed after Reporting 2 were successfully integrated into the enterprise platform. The system facilitates end-to-end fabric inwarding, machine batch routing, chemical dispensing, 4-point quality inspection, delivery challan dispatch, and real-time lot cost analysis with sub-second responsiveness.", size: 21 })
            ]
          }),

          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: "b) Performance Results", bold: true, size: 22 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Parameter / Metric", true, 30), createCell("Result Obtained", true, 35), createCell("Expected / Target", true, 25), createCell("Status", true, 10)] }),
              new TableRow({ children: [createCell("1. API Latency"), createCell("Average 85ms across endpoints"), createCell("< 200ms"), createCell("Pass")] }),
              new TableRow({ children: [createCell("2. UOM Precision"), createCell("Derived mass matches physical scales ±0.05kg"), createCell("100% precision"), createCell("Pass")] }),
              new TableRow({ children: [createCell("3. PDF Streaming"), createCell("Vector PDF generated in < 280ms"), createCell("< 500ms"), createCell("Pass")] }),
              new TableRow({ children: [createCell("4. UI Responsiveness"), createCell("Clean layout across desktop, tablet, and mobile"), createCell("Responsive layout"), createCell("Pass")] }),
              new TableRow({ children: [createCell("5. DB ACID Integrity"), createCell("Zero orphan records in multi-table batch operations"), createCell("100% ACID compliance"), createCell("Pass")] })
            ]
          }),

          // 7. Challenges & Improvements
          createSectionHeader("7. Challenges, Solutions and Improvements"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Challenge / Problem", true, 32), createCell("Solution Implemented", true, 40), createCell("Final Outcome", true, 28)] }),
              new TableRow({ children: [createCell("1. Dual UOM & Shrinkage Reconciliation", false, 32, true), createCell("Implemented mathematical engine deriving mass from GSM and tracked stage shrinkage."), createCell("Eliminated inventory and billing discrepancies.")] }),
              new TableRow({ children: [createCell("2. Multi-Tenant Data Isolation", false, 32, true), createCell("Built JWT middleware strictly injecting tenant_id on all database queries."), createCell("Guaranteed 100% data security between client mills.")] }),
              new TableRow({ children: [createCell("3. Sequence Counter Drifts", false, 32, true), createCell("Automated sequence resynchronization using pg_get_serial_sequence after seeding."), createCell("Resolved primary key conflicts.")] })
            ]
          }),

          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: "Improvements Made After Reporting 2:", bold: true, size: 22 })]
          }),
          createBullet("1.", "Added inline dynamic creation modals for Machines, Process Templates, and Recipes."),
          createBullet("2.", "Implemented Taka roll-level meterage breakdown and PDFKit QR Lot Traveler Cards."),
          createBullet("3.", "Enhanced Production batch dashboard with shift-wise utility fuel consumption logging."),
          createBullet("4.", "Automated GST Section 143 delivery challans with transporter LR logging."),

          // 8. Current Status
          createSectionHeader("8. Current Project Status"),
          new Paragraph({ children: [new TextRun({ text: "☐ Completed      ☑ Mostly Completed (88%)      ☐ Partially Completed      ☐ Work in Progress", font: "Calibri", size: 21 })] }),
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [new TextRun({ text: "Completed Components:\n", bold: true, size: 21 }), new TextRun({ text: "• Master Data Core (8 tabs)  • Job Orders & Taka Breakdown  • Production & Batch Logs\n• 4-Point QC Audit Matrix  • Inventory & Procurement  • Dispatch & Section 143 Challans\n• Finance Lot Cost Sheets  • Real-Time Commodity Feed", size: 21 })]
          }),
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [new TextRun({ text: "Pending Components:\n", bold: true, size: 21 }), new TextRun({ text: "• High-concurrency load testing  • Cloud production deployment verification  • Final project documentation", size: 21 })]
          }),
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [new TextRun({ text: "Work Planned Before Reporting 4:\n", bold: true, size: 21 }), new TextRun({ text: "• Conduct full end-to-end integration and user acceptance validation.\n• Prepare deployment configurations for cloud production hosting.\n• Finalize the complete project report and presentation slides.", size: 21 })]
          }),

          // 9. Learning & Skills
          createSectionHeader("9. Learning and Skills Acquired"),
          createBullet("• Technical Skills:", "React 18 component-driven architecture, Node.js & Express RESTful API design, PostgreSQL multi-tenant relational modeling, PDFKit vector streaming, JWT token security, and Tailwind CSS responsive styling."),
          createBullet("• Tools / Technologies Learned:", "Visual Studio Code, Neon Cloud Serverless PostgreSQL, Vite, Postman API testing, Git & GitHub version control, and Chrome DevTools performance profiling."),
          createBullet("• Professional Skills:", "Domain requirements engineering for manufacturing clusters, Agile sprint planning, full-stack debugging, and technical documentation."),
          createBullet("• Major Learning from Internship / UDP / Training:", "Gained practical, production-level experience in developing an enterprise-grade ERP system tailored for real-world manufacturing constraints, multi-stage processing, and financial accountability."),

          // 10. References
          createSectionHeader("10. References and Resources Used (APA 7th Edition)"),
          new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [
              new TextRun({ text: "[1] Meta Open Source. (2024). React Documentation. https://react.dev/\n", size: 19 }),
              new TextRun({ text: "[2] PostgreSQL Global Development Group. (2024). PostgreSQL Documentation. https://www.postgresql.org/docs/\n", size: 19 }),
              new TextRun({ text: "[3] ASTM International. (2022). ASTM D5430: Standard Test Methods for Visually Inspecting Fabrics.\n", size: 19 }),
              new TextRun({ text: "[4] Central Board of Indirect Taxes and Customs (CBIC). (2023). GST Guidelines for Job Work under Section 143.", size: 19 })
            ]
          }),

          // Evaluation Table
          createSectionHeader("Evaluation (To be filled by Mentor (Institute))"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({ children: [createCell("Criteria", true, 28), createCell("Excellent", true, 18), createCell("Good", true, 18), createCell("Average", true, 18), createCell("Poor", true, 10), createCell("Marks", true, 8)] }),
              new TableRow({ children: [createCell("Work Completion & Implementation (25)"), createCell("≥90% meaningful work completed"), createCell("75–89%"), createCell("50–74%"), createCell("<50%"), createCell("/25")] }),
              new TableRow({ children: [createCell("Testing, Results & Validation (25)"), createCell("Strong testing with evidence"), createCell("Good testing"), createCell("Limited testing"), createCell("No validation"), createCell("/25")] }),
              new TableRow({ children: [createCell("Technical Understanding (20)"), createCell("Strong conceptual & technical"), createCell("Good"), createCell("Basic"), createCell("Unable to explain"), createCell("/20")] }),
              new TableRow({ children: [createCell("Documentation & Presentation (20)"), createCell("Complete, clear & documented"), createCell("Minor gaps"), createCell("Incomplete"), createCell("Poor"), createCell("/20")] }),
              new TableRow({ children: [createCell("References & Citations (10)"), createCell("Relevant, properly cited"), createCell("Minor issues"), createCell("Limited"), createCell("Missing"), createCell("/10")] }),
              new TableRow({ children: [createCell("TOTAL", true, 92), createCell("", true, 0), createCell("", true, 0), createCell("", true, 0), createCell("", true, 0), createCell("/100", true, 8)] })
            ]
          }),

          // Signature Table
          new Paragraph({ spacing: { before: 160, after: 60 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  createCell("Student Signature\n\n\n\nDeep Patel", false, 33, true),
                  createCell("Mentor (Company) Signature\n\n\n\nMr. Himanshu Prajapati", false, 33, true),
                  createCell("Mentor (Institute) Signature\n\n\n\nMr. Ajay Chouhan", false, 34, true)
                ]
              })
            ]
          }),

          // Mentor Remarks Page
          createSectionHeader("Mentor (Institute) Remarks"),
          new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________\n\n____________________________________________________________________________________________________", color: "8C8C8C", size: 20 })] })
        ]
      }
    ]
  });

  const docxBuffer = await Packer.toBuffer(doc);
  const docxPath = path.join(__dirname, 'reporting_3_textile_erp_report.docx');
  const desktopDocxPath = '/Users/shaileshsingh/Desktop/reporting_3_textile_erp_report.docx';
  
  fs.writeFileSync(docxPath, docxBuffer);
  fs.writeFileSync(desktopDocxPath, docxBuffer);
  console.log('Word DOCX file generated successfully:');
  console.log('1. In project:', docxPath);
  console.log('2. On Desktop:', desktopDocxPath);
}

createDocx().catch(err => console.error(err));
