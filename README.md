# Textile ERP - Enterprise Resource Planning

A modern, high-fidelity Enterprise Resource Planning (ERP) suite designed specifically for textile trading and manufacturing. Replicated from the Python target repository but built on a cutting-edge JavaScript web ecosystem.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons (Twilio console white/light theme)
- **Backend**: Node.js + Express
- **Database**: Cloud Neon PostgreSQL
- **Alerts Gateway**: Twilio WhatsApp API (with Simulation Fallback mode)

---

## 🚀 Getting Started (Local Development)

### 1. Configure Environment Credentials
Create a `.env` file in the root folder with the following variables:
```env
PORT=5005
DATABASE_URL=postgresql://neondb_owner:npg_Ug2vJoAZfs1K@ep-summer-term-atmd3fge.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require

# Twilio Credentials (Optional - Falls back to Simulation if empty)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Install Dependencies
Install all backend and frontend packages:
```bash
npm install
```

### 3. Initialize Cloud Neon Database Tables
Run the database migrations and seeding script to deploy all 26 tables and seed default mock profiles directly onto your Neon database:
```bash
npm run db:init
```

### 4. Launch Development Environment
Start both the Express backend server (port 5005) and the Vite frontend (port 5174) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** in your web browser.

---

## 🔐 Credentials for Testing

Use the following default accounts to log in and test role-based access:
- **Admin Administrator**:
  - Username: `admin`
  - Password: `admin123`
- **Manager Operations**:
  - Username: `manager1`
  - Password: `manager123`
- **Machine Operator**:
  - Username: `operator1`
  - Password: `operator123`

---

## 📲 Automated WhatsApp Notification System

The ERP includes automatic transactional alerts for customers:
1. **Order Placed**: Sent when a new Sales Order is submitted.
2. **Order Confirmed**: Triggered when the order status changes to `confirmed`.
3. **Yield Started**: Triggered when loom work order changes to `in_progress`.
4. **Order Dispatched**: Fired when dispatched status is updated.
5. **Overdue payment reminders**: Calculate outstanding balances + CGST/SGST + 1% overdue interest automatically and log message dispatch to Neon database.
