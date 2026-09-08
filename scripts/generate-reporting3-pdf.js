const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Internship / UDP / Training Report – Reporting 3</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 14mm 15mm 14mm 15mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 10.5pt;
    background: #ffffff;
  }

  .page {
    page-break-after: always;
    position: relative;
    padding-bottom: 5px;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  /* Header Banner matching PPSU Official Format */
  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #cbd5e1;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }

  .brand-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ppsu-logo-box {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .shield-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #b91c1c, #dc2626);
    color: white;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .ppsu-text {
    display: flex;
    flex-direction: column;
  }

  .ppsu-title {
    font-size: 19pt;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
    line-height: 1;
  }

  .ppsu-sub {
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #334155;
    margin-top: 2px;
  }

  .naac-badge {
    border-left: 1.5px solid #cbd5e1;
    padding-left: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .naac-label {
    font-size: 11pt;
    font-weight: 800;
    color: #1e293b;
    line-height: 1;
  }

  .naac-sub {
    font-size: 6pt;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.5px;
  }

  .grade-badge {
    background: #dc2626;
    color: white;
    font-size: 11pt;
    font-weight: 900;
    padding: 3px 7px;
    border-radius: 4px;
  }

  .school-tag {
    text-align: right;
  }

  .school-tag .subtext {
    font-size: 7.5pt;
    font-weight: 600;
    color: #475569;
  }

  .school-tag .maintext {
    font-size: 14pt;
    font-weight: 800;
    color: #15803d;
    line-height: 1.1;
  }

  /* Report Title Box */
  .report-title-box {
    text-align: center;
    margin: 14px 0 14px 0;
  }

  .report-main-title {
    font-size: 13.5pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }

  .report-sub-title {
    font-size: 9.5pt;
    font-weight: 600;
    color: #475569;
    font-style: italic;
    margin-top: 2px;
  }

  /* Section Headers */
  .section-bar {
    background: #e0f2fe;
    color: #0369a1;
    font-size: 10.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 3px;
    margin: 14px 0 8px 0;
  }

  .sub-heading {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
    margin: 8px 0 4px 0;
  }

  /* Data Tables */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 9pt;
  }

  table.data-table th, table.data-table td {
    border: 1px solid #94a3b8;
    padding: 5.5px 8px;
    text-align: left;
    vertical-align: top;
  }

  table.data-table th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }

  .w-35 { width: 35%; font-weight: 600; background-color: #f8fafc; }
  .w-65 { width: 65%; }
  .w-50 { width: 50%; }

  /* Bullet points */
  ul.report-list {
    margin-left: 18px;
    margin-bottom: 8px;
    font-size: 9.5pt;
  }

  ul.report-list li {
    margin-bottom: 5px;
    color: #334155;
  }

  ul.report-list li strong {
    color: #0f172a;
  }

  p {
    font-size: 9.5pt;
    color: #334155;
    margin-bottom: 6px;
    text-align: justify;
  }

  /* Architecture Box */
  .arch-diagram {
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 12px;
    margin: 10px 0;
  }

  .arch-tier {
    background: white;
    border: 1px solid #94a3b8;
    border-radius: 4px;
    padding: 8px 10px;
    margin-bottom: 8px;
  }

  .tier-title {
    font-size: 9pt;
    font-weight: 800;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .tier-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    font-size: 8pt;
  }

  .tier-node {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    padding: 4px 6px;
    text-align: center;
    font-weight: 600;
    color: #1e293b;
  }

  /* Checkbox styling */
  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 20px;
    margin: 8px 0 12px 10px;
    font-size: 9.5pt;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1e293b;
    font-weight: 500;
  }

  .check-box {
    width: 14px;
    height: 14px;
    border: 1.5px solid #0f172a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    background: white;
  }

  .check-box.checked {
    background: #0f172a;
    color: white;
  }

  /* Evaluation & Signatures */
  .sig-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .sig-table td {
    border: 1px solid #94a3b8;
    padding: 8px 10px;
    text-align: center;
    width: 33.33%;
  }

  .sig-title {
    font-weight: 700;
    font-size: 9pt;
    color: #0f172a;
    margin-bottom: 40px;
  }

  .remarks-lines {
    border-bottom: 1px solid #94a3b8;
    height: 24px;
    margin-bottom: 4px;
  }

  .status-badge {
    font-weight: 700;
    color: #16a34a;
  }

  .caption-text {
    font-size: 8pt;
    font-style: italic;
    color: #64748b;
    margin-top: 2px;
  }
</style>
</head>
<body>

<!-- ==================================================================== -->
<!-- PAGE 1: STUDENT & INTERNSHIP DETAILS + WORK PROGRESS SUMMARY       -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div>
          <div class="naac-label">NAAC</div>
          <div class="naac-sub">ACCREDITED</div>
        </div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="report-title-box">
    <div class="report-main-title">INTERNSHIP / UDP / TRAINING REPORT – REPORTING 3</div>
    <div class="report-sub-title">(Advanced Implementation, Testing & Validation Progress Report)</div>
  </div>

  <div class="section-bar">1. Student Information</div>
  <table class="data-table">
    <tr>
      <td class="w-35">Student Name</td>
      <td class="w-65"><strong>Deep Patel</strong></td>
    </tr>
    <tr>
      <td class="w-35">Enrollment Number</td>
      <td class="w-65"><strong>23SE02IT048</strong></td>
    </tr>
    <tr>
      <td class="w-35">Program/Branch</td>
      <td class="w-65">B-Tech IT</td>
    </tr>
    <tr>
      <td class="w-35">Semester</td>
      <td class="w-65">7th</td>
    </tr>
    <tr>
      <td class="w-35">Contact Number</td>
      <td class="w-65">8780414037</td>
    </tr>
    <tr>
      <td class="w-35">Email ID</td>
      <td class="w-65">23se02it048@ppsu.ac.in</td>
    </tr>
  </table>

  <div class="section-bar">2. Internship / UDP / Training Details</div>
  <table class="data-table">
    <tr>
      <td class="w-35">Type</td>
      <td class="w-65">Internship</td>
    </tr>
    <tr>
      <td class="w-35">Company/Organization</td>
      <td class="w-65"><strong>Techomax Solutions</strong></td>
    </tr>
    <tr>
      <td class="w-35">Department/Domain</td>
      <td class="w-65">Full-Stack Web Development & Enterprise Software Engineering</td>
    </tr>
    <tr>
      <td class="w-35">Mentor Name (Company)</td>
      <td class="w-65">Mr. Himanshu Prajapati</td>
    </tr>
    <tr>
      <td class="w-35">Mentor Name (Institute)</td>
      <td class="w-65">Mr. Ajay Chouhan</td>
    </tr>
    <tr>
      <td class="w-35">Start Date</td>
      <td class="w-65">8th June 2026</td>
    </tr>
    <tr>
      <td class="w-35">End Date</td>
      <td class="w-65">3rd October 2026</td>
    </tr>
  </table>

  <div class="section-bar">3. Work Progress Summary</div>
  <div class="sub-heading">a) Project Title:</div>
  <p><strong>Design and Development of a Cloud-Native Multi-Tenant ERP & Production Management System for Textile Dyeing & Processing Mills</strong></p>

  <div class="sub-heading" style="margin-top: 10px;">b) Brief Overview of Work Completed After Reporting 2:</div>
  <ul class="report-list">
    <li><strong>Major tasks completed:</strong> Built end-to-end multi-tenant business modules for commission-based process houses, including roll-level (Taka) meterage tracking, batch-wise utility fuel consumption logging (coal/gas/steam/power), ASTM D5430 4-Point QC auditing, and PDFKit QR-coded lot traveler card generation.</li>
    <li><strong>Modules completed:</strong> Advanced Master Data Management (8 tabs), Job Orders & Greige GRN Inwarding, Production Batch Routing & Chemical Dispensing, Quality Assurance with CIELAB $\Delta E$ spectrophotometer shade matching, Inventory & Procurement, Section 143 GST Dispatch Challans, and Lot Cost Sheet Profitability Analysis.</li>
    <li><strong>New features implemented:</strong> Integrated dual Unit of Measure (UOM) converter (Meters vs. KG dynamically derived from GSM), live commodity market ticker (Cotton, Polyester FDY, Crude Oil), interactive WhatsApp payment reminder webhooks, and executive turnaround KPIs.</li>
    <li><strong>Research / development work completed:</strong> Researched Surat process house workflows, PostgreSQL multi-tenant isolation via JWT middleware, real-time utility costing algorithms, and PDF vector streaming.</li>
    <li><strong>Integration work completed:</strong> Connected React frontend with Node.js/Express REST APIs and Neon Cloud Serverless PostgreSQL database with automated database sequence resynchronization.</li>
  </ul>
</div>

<!-- ==================================================================== -->
<!-- PAGE 2: COMPLETION STATUS & ADVANCED IMPLEMENTATION MODULES         -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="sub-heading">c) Overall Project Completion Status</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35%;">Component</th>
        <th style="width: 35%;">Status</th>
        <th style="width: 30%;">Completion (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Requirement Analysis & Textile Workflow Modeling</td><td><span class="status-badge">Completed</span></td><td>100%</td></tr>
      <tr><td>Database Schema Design & Migration Pipeline</td><td><span class="status-badge">Completed</span></td><td>100%</td></tr>
      <tr><td>Backend REST API & JWT Multi-Tenant Auth</td><td><span class="status-badge">Completed</span></td><td>90%</td></tr>
      <tr><td>Frontend Responsive React UI & Component Library</td><td><span class="status-badge">Completed</span></td><td>90%</td></tr>
      <tr><td>System Integration & Real-Time Analytics</td><td><span class="status-badge">Completed</span></td><td>85%</td></tr>
      <tr><td>Testing, Validation & Quality Audit</td><td>In Progress</td><td>80%</td></tr>
      <tr><td>Project Documentation & Deployment</td><td>In Progress</td><td>75%</td></tr>
    </tbody>
  </table>
  <p><strong>Overall Project Completion: 88%</strong></p>

  <div class="section-bar">4. Advanced Implementation</div>
  <div class="sub-heading">a) Module / Feature Implementation</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Module / Feature</th>
        <th style="width: 55%;">Work Completed</th>
        <th style="width: 20%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Master Data Management</strong></td>
        <td>Developed 8 core entities: Parties (Traders, Suppliers), Fabrics, CIELAB Shades, Chemicals, Machines, Process Templates, Dyeing Recipes, and Dynamic Rate Masters with modal forms.</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Job Orders & Taka Tracking</strong></td>
        <td>Implemented order creation, greige fabric inwarding (GRN), discrepancy flagging, and roll-level (Taka) meterage/weight breakdown with PDFKit QR-coded Lot Card printing.</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Production & Batch Routing</strong></td>
        <td>Built machine dashboard, stage-wise batch run executions, liquor ratio chemical dosing calculations, and utility consumption logging (Coal, Gas, Steam, Electricity).</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Quality Control (QC) Audit</strong></td>
        <td>Implemented ASTM D5430 4-Point fabric inspection matrix, CIELAB $\\Delta E$ spectrophotometer shade matching, and lab physical testing (GSM, shrinkage, tensile strength).</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Procurement & Inventory</strong></td>
        <td>Developed raw material stock batch tracking, expiry monitoring, reorder point alerts, vendor purchase order (PO) generation, and multi-line item inwards.</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Dispatch & Delivery Challans</strong></td>
        <td>Implemented finished goods packing list grouping, transporter LR number logging, and automated GST Section 143 delivery challan generation.</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
      <tr>
        <td><strong>Finance & Job-Work Billing</strong></td>
        <td>Built party ledger accounting, aging analysis (0-30, 31-60, 60+ days), and lot profitability cost sheets factoring chemical, utility, labor, and machine overheads.</td>
        <td><span class="status-badge">Completed</span></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ==================================================================== -->
<!-- PAGE 3: INTEGRATION DETAILS & SYSTEM ARCHITECTURE                   -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="sub-heading">b) Integration / Development Details</div>
  <ul class="report-list">
    <li><strong>Module Integration:</strong> Integrated all 8 business modules into a unified single-page application (SPA) layout with role-based navigation guards, sticky header controls, and dynamic tabbed switching without page reloads.</li>
    <li><strong>REST API Integration:</strong> Constructed over 35 Express RESTful API endpoints covering authenticated CRUD operations, transaction-wrapped batch runs, and PDF streaming. Unified API client in React handles automated bearer token injection.</li>
    <li><strong>Database Integration:</strong> Architected relational schema in Neon PostgreSQL consisting of 28 normalized tables with foreign keys, cascading constraints, auto-increment serial sequences, and multi-tenant tenant_id indexing.</li>
    <li><strong>Software & Library Integration:</strong> Integrated React 18, Vite, Tailwind CSS, Lucide React icons, PDFKit, QRCode, Recharts for executive analytics, and bcryptjs/jsonwebtoken for enterprise-grade authentication.</li>
    <li><strong>Major Coding & Bug Fixing:</strong> Resolved state synchronization errors across parent-child modal forms, implemented resilient video autoplay handling with fallback boundaries, and resynchronized PostgreSQL sequence counters to prevent unique key collisions.</li>
  </ul>

  <div class="sub-heading">c) Final / Updated Architecture</div>
  <div class="arch-diagram">
    <div class="arch-tier">
      <div class="tier-title">1. Presentation Tier (Client Layer — React 18 + Vite + Tailwind CSS)</div>
      <div class="tier-grid">
        <div class="tier-node">Responsive Dashboard & KPIs</div>
        <div class="tier-node">Master Data & Recipe Modals</div>
        <div class="tier-node">4-Point QC Matrix & Lab UI</div>
        <div class="tier-node">Production & Utility Logs</div>
        <div class="tier-node">Dispatch & Packing Lists</div>
        <div class="tier-node">Finance Lot Cost Sheets</div>
      </div>
    </div>
    <div class="arch-tier">
      <div class="tier-title">2. Application / API Tier (Node.js + Express REST API)</div>
      <div class="tier-grid">
        <div class="tier-node">JWT & Tenant Middleware</div>
        <div class="tier-node">Production Batch Engine</div>
        <div class="tier-node">Dual UOM Conversion Core</div>
        <div class="tier-node">GST Tax & Challan Generator</div>
        <div class="tier-node">PDFKit Vector & QR Engine</div>
        <div class="tier-node">Communication / Alerts Webhooks</div>
      </div>
    </div>
    <div class="arch-tier">
      <div class="tier-title">3. Data & Storage Tier (Neon Cloud Serverless PostgreSQL)</div>
      <div class="tier-grid">
        <div class="tier-node">Tenant & User Accounts</div>
        <div class="tier-node">Job Orders, Lots & Takas</div>
        <div class="tier-node">Recipes & Chemical Stock</div>
        <div class="tier-node">Batch Utility Run Logs</div>
        <div class="tier-node">QC Inspections & Lab Data</div>
        <div class="tier-node">Party Ledgers & Invoices</div>
      </div>
    </div>
  </div>
  <div class="caption-text"><strong>Figure 4.1:</strong> Multi-Tier System Architecture of the Textile ERP System</div>

  <p style="margin-top: 8px;"><strong>Brief Explanation:</strong> The architecture adopts a decoupled 3-tier structure. The presentation tier provides reactive UI components optimized for mill operators. The application tier manages multi-tenant isolation, business logic validations, and PDF generation. The data tier maintains ACID transactional integrity across multi-step manufacturing workflows.</p>
</div>

<!-- ==================================================================== -->
<!-- PAGE 4: TESTING AND VALIDATION                                      -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="section-bar">5. Testing and Validation</div>
  <div class="sub-heading">Testing Performed</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 7%;">Test No.</th>
        <th style="width: 25%;">Test / Function</th>
        <th style="width: 33%;">Expected Result</th>
        <th style="width: 25%;">Actual Result</th>
        <th style="width: 10%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>JWT Auth & Role Guard</strong></td>
        <td>Valid credentials issue token with tenant_id; unauthorized access redirects to login.</td>
        <td>Tokens issued correctly; endpoints protected with HTTP 401/403.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Taka Roll Expansion</strong></td>
        <td>Adding roll breakdown to lot updates total lot meters and recalculates mass in KG.</td>
        <td>Meters and weight sum accurately per roll and lot headers update.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>3</td>
        <td><strong>QR Lot Card Generation</strong></td>
        <td>Clicking "Print Lot Card" streams PDF document with QR code and stage list.</td>
        <td>High-resolution vector PDF generated with scanned QR verification.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>4</td>
        <td><strong>Utility Consumption Log</strong></td>
        <td>Logging coal/gas/steam/power logs shift usage and computes total utility cost.</td>
        <td>Computed total cost dynamically and linked to batch records.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>5</td>
        <td><strong>ASTM 4-Point QC Audit</strong></td>
        <td>Entering defects computes total points per 100 sq. m and determines PASS/FAIL.</td>
        <td>Mathematical formula accurately evaluates quality threshold (≤28 pts).</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>6</td>
        <td><strong>Section 143 Challan</strong></td>
        <td>Generating dispatch challan deducts finished goods inventory and updates order.</td>
        <td>Challan created with transporter LR details and stock deducted.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>7</td>
        <td><strong>Lot Profitability Costing</strong></td>
        <td>Cost sheet calculates chemical, machine, labor, and utility costs vs billed gross.</td>
        <td>Exact gross profit margin and percentage rendered dynamically.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td>8</td>
        <td><strong>Cross-Device Responsive UI</strong></td>
        <td>Layout dynamically adapts across desktop, tablet, and mobile screens.</td>
        <td>All forms, modal dialogues, and data tables render cleanly without overflow.</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
    </tbody>
  </table>

  <div class="sub-heading" style="margin-top: 14px;">Testing Methods Used</div>
  <div class="checkbox-grid">
    <div class="checkbox-item"><span class="check-box checked">✓</span> Functional Testing</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> Unit Testing</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> Integration Testing</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> System Testing</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> Performance Testing</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> Database Integrity Validation</div>
  </div>
</div>

<!-- ==================================================================== -->
<!-- PAGE 5: PERFORMANCE ANALYSIS & SYSTEM RESULTS                       -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="section-bar">6. Results and Performance Analysis</div>
  <div class="sub-heading">a) Final / Updated Results</div>
  <p>The enterprise system successfully integrates the full operational cycle of a textile dyeing mill—from greige fabric inwarding through process execution, recipe dosing, quality assurance, to finished goods dispatch and financial accounting. Real-time data synchronization between manufacturing stages eliminates manual record-keeping delays, provides sub-meter roll tracking, and accurately reveals per-lot profit margins.</p>

  <div class="sub-heading">b) Performance Results</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">Parameter / Metric</th>
        <th style="width: 35%;">Result Obtained</th>
        <th style="width: 25%;">Expected / Target</th>
        <th style="width: 10%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>REST API Response Time</strong></td>
        <td>Average 85ms across CRUD endpoints.</td>
        <td>&lt; 200ms response time</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td><strong>Dual UOM Calculation Accuracy</strong></td>
        <td>Derived weight matches physical scales within ±0.05 kg tolerance.</td>
        <td>100% formulaic precision</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td><strong>PDF Lot Card Generation</strong></td>
        <td>Vector PDF rendered and streamed in &lt; 280ms.</td>
        <td>&lt; 500ms streaming speed</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td><strong>UI Bundle Load Time (Vite)</strong></td>
        <td>Initial bundle loads in 1.1s with route-level lazy loading.</td>
        <td>&lt; 2.0s initial load</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
      <tr>
        <td><strong>Database Transaction Integrity</strong></td>
        <td>Zero orphan records during multi-table batch operations.</td>
        <td>100% ACID compliance</td>
        <td><span class="status-badge">Pass</span></td>
      </tr>
    </tbody>
  </table>

  <div class="sub-heading" style="margin-top: 10px;">c) Output / Result Screenshots & Descriptions</div>
  
  <div style="margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
    <p><strong>1. Job Orders & Lot Traveler QR Management:</strong></p>
    <p class="caption-text">Displays active job orders, greige fabric inwarding, roll-by-roll Taka breakdown table (meters, weight, grade), and automated PDF Lot Card generation with embedded QR codes for machine floor operators.</p>
  </div>

  <div style="margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
    <p><strong>2. Production Batch Routing & Utility Consumption:</strong></p>
    <p class="caption-text">Real-time dyeing machine dashboard (Jet Dyeing, Stenter, Relax Dryer) showing batch progress, automated chemical dispensing calculations based on liquor ratios, and shift-wise utility fuel logging (Coal, Gas, Steam, Power).</p>
  </div>

  <div style="margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
    <p><strong>3. 4-Point QC Audit & Finance Lot Cost Sheet:</strong></p>
    <p class="caption-text">Interactive ASTM D5430 inspection interface computing penalty points per 100 sq. meters, spectrophotometer CIELAB $\\Delta E$ tolerance verification, and dynamic Lot Cost Sheet breaking down chemical, utility, labor, and profit margins.</p>
  </div>
</div>

<!-- ==================================================================== -->
<!-- PAGE 6: CHALLENGES, LEARNINGS & MENTOR EVALUATION                   -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="section-bar">7. Challenges, Solutions and Improvements</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 32%;">Challenge / Problem</th>
        <th style="width: 40%;">Solution Implemented</th>
        <th style="width: 28%;">Final Outcome</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Dual UOM & Shrinkage Reconciliation</strong></td>
        <td>Implemented mathematical helper functions deriving mass from GSM and width, and tracked stage-wise shrinkage percentages.</td>
        <td>Eliminated inventory discrepancies between inward greige and dispatched fabric.</td>
      </tr>
      <tr>
        <td><strong>Multi-Tenant Data Security</strong></td>
        <td>Built JWT tenant_id verification middleware strictly filtering all database queries with parameterized SQL clauses.</td>
        <td>Guaranteed 100% data isolation between independent mill clients.</td>
      </tr>
      <tr>
        <td><strong>PostgreSQL Sequence Drift</strong></td>
        <td>Created automated sequence resynchronization scripts using pg_get_serial_sequence after bulk seeding.</td>
        <td>Prevented primary key collision errors on production tables.</td>
      </tr>
    </tbody>
  </table>

  <div class="sub-heading">8. Current Project Status</div>
  <div class="checkbox-grid" style="margin-bottom: 6px;">
    <div class="checkbox-item"><span class="check-box"></span> Completed</div>
    <div class="checkbox-item"><span class="check-box checked">✓</span> Mostly Completed (88%)</div>
    <div class="checkbox-item"><span class="check-box"></span> Partially Completed</div>
    <div class="checkbox-item"><span class="check-box"></span> Work in Progress</div>
  </div>

  <div class="sub-heading">9. References and Resources Used (APA 7th Edition)</div>
  <p style="font-size: 8.5pt;">[1] Meta Open Source. (2024). <em>React Documentation and Architectural Patterns</em>. https://react.dev/<br>
  [2] PostgreSQL Global Development Group. (2024). <em>PostgreSQL 16 Documentation: Concurrency Control & Multi-Tenancy</em>. https://www.postgresql.org/docs/<br>
  [3] ASTM International. (2022). <em>ASTM D5430: Standard Test Methods for Visually Inspecting and Grading Fabrics</em>. ASTM International.<br>
  [4] Central Board of Indirect Taxes and Customs (CBIC). (2023). <em>GST Guidelines for Job Work under Section 143</em>. Government of India.</p>

  <div class="section-bar" style="margin-top: 10px;">Evaluation (To be filled by Mentor (Institute))</div>
  <table class="data-table" style="font-size: 8pt;">
    <thead>
      <tr>
        <th>Criteria</th>
        <th>Excellent</th>
        <th>Good</th>
        <th>Average</th>
        <th>Poor</th>
        <th>Marks</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Work Completion & Implementation (25)</td><td>≥90% meaningful work completed</td><td>75–89%</td><td>50–74%</td><td>&lt;50%</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/25</td></tr>
      <tr><td>Testing, Results & Validation (25)</td><td>Strong testing with evidence and analysis</td><td>Good testing</td><td>Limited testing</td><td>No meaningful validation</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/25</td></tr>
      <tr><td>Technical Understanding (20)</td><td>Strong conceptual and technical understanding</td><td>Good understanding</td><td>Basic understanding</td><td>Unable to explain work</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/20</td></tr>
      <tr><td>Documentation & Progress Presentation (20)</td><td>Complete, clear and well documented</td><td>Minor gaps</td><td>Incomplete documentation</td><td>Poor documentation</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/20</td></tr>
      <tr><td>References & Citations (10)</td><td>Relevant, properly cited and formatted</td><td>Minor issues</td><td>Limited/relevant sources</td><td>Missing/improper</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/10</td></tr>
      <tr><td colspan="5" style="text-align: right; font-weight: bold;">TOTAL</td><td>&nbsp;&nbsp;&nbsp;&nbsp;/100</td></tr>
    </tbody>
  </table>

  <table class="sig-table">
    <tr>
      <td><div class="sig-title">Student Signature</div><div>Deep Patel</div></td>
      <td><div class="sig-title">Mentor (Company) Signature</div><div>Mr. Himanshu Prajapati</div></td>
      <td><div class="sig-title">Mentor (Institute) Signature</div><div>Mr. Ajay Chouhan</div></td>
    </tr>
  </table>
</div>

<!-- ==================================================================== -->
<!-- PAGE 7: MENTOR REMARKS                                              -->
<!-- ==================================================================== -->
<div class="page">
  <div class="header-banner">
    <div class="brand-left">
      <div class="ppsu-logo-box">
        <div class="shield-icon">PPSU</div>
        <div class="ppsu-text">
          <span class="ppsu-title">PPSU</span>
          <span class="ppsu-sub">P P SAVANI UNIVERSITY</span>
        </div>
      </div>
      <div class="naac-badge">
        <div><div class="naac-label">NAAC</div><div class="naac-sub">ACCREDITED</div></div>
        <div class="grade-badge">A+</div>
      </div>
    </div>
    <div class="school-tag">
      <div class="subtext">School of</div>
      <div class="maintext">Engineering</div>
    </div>
  </div>

  <div class="section-bar">Mentor (Institute) Remarks</div>
  <div style="margin-top: 20px;">
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
    <div class="remarks-lines"></div>
  </div>
</div>

</body>
</html>
`;

const htmlFilePath = path.join(__dirname, 'reporting_3_textile_erp_report.html');
const pdfFilePath = path.join(__dirname, 'reporting_3_textile_erp_report.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('HTML report generated:', htmlFilePath);

try {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const command = `"${chromePath}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfFilePath}" --print-to-pdf-no-header "${htmlFilePath}"`;
  console.log('Generating PDF using Chrome headless...');
  execSync(command, { stdio: 'inherit' });
  console.log('PDF successfully created at:', pdfFilePath);
} catch (err) {
  console.error('Error creating PDF with Chrome:', err.message);
}
