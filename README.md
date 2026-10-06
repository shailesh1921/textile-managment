# 🏭 Textile Production & Dyeing Management System (Surat Textile ERP)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render_Deployment-success?style=for-the-badge&logo=render)](https://textile-managment.onrender.com/production)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN_%2B_MySQL_%2B_Neon-blue?style=for-the-badge&logo=react)](https://github.com/shailesh1921/textile-managment)
[![License](https://img.shields.io/badge/Deployment-Production_Client-orange?style=for-the-badge)](https://textile-managment.onrender.com/production)

> An end-to-end, multi-tier Enterprise Resource Planning (ERP) platform architected for a live Surat textile manufacturing and dyeing mill. Replaced legacy manual paper ledgers with automated production tracking, chemical inventory monitoring, cost engines, and multi-channel order dispatch pipelines.

---

## 🌟 Live Demo & Architecture

- **Live URL**: [https://textile-managment.onrender.com/production](https://textile-managment.onrender.com/production)
- **Target Industry**: Textile Manufacturing, Dyeing & Weaving Mills (Surat, Gujarat)

---

## 🚀 Key Modules & Engineering Features

### 1. ⚙️ Automated Production Workflow Engine
- **Multi-Status Pipeline**: Real-time order lifecycle tracking across stages: `Pending` ➔ `In Process` ➔ `Completed` ➔ `Dispatched` ➔ `Delivered`.
- **Machine & Loom Allocation**: Tracks active machine runtimes, yarn lots, and job cards across shifts to optimize shop-floor throughput.

### 2. 🧪 Chemical & Dye Inventory Tracking with Low-Stock Triggers
- Real-time stock deduction based on fabric weight and recipe ratios.
- Automated low-stock threshold alerts to prevent dye depletion during running dyeing shifts.

### 3. 💰 Accurate Production Cost Calculation Engine
- Multi-variable cost engine dynamically computing unit cost per meter:
  $$\text{Unit Cost} = \text{Raw Yarn} + \text{Dyes/Chemicals} + \text{Direct Labor} + \text{Power/Electricity}$$
- Generates GST-compliant invoice summaries with automated CGST/SGST ledger breakdowns.

### 4. 📲 Automated WhatsApp Dispatch & Payment Alerts
- Integrated transactional notifications (via Twilio WhatsApp Gateway) triggered automatically when lots are dispatched or payment balances are overdue.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js (REST API Architecture, 20+ Endpoints) |
| **Database** | Normalized MySQL / Cloud Neon PostgreSQL |
| **Authentication** | Role-Based Access Control (Admin, Mill Manager, Floor Operator) |
| **DevOps & Hosting** | Render, CI/CD Pipeline, Environment-isolated secrets |

---

## 💻 Local Setup & Development

```bash
# 1. Clone the repository
git clone https://github.com/shailesh1921/textile-managment.git
cd textile-managment

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file with your PORT, DATABASE_URL, and TWILIO credentials
cp .env.example .env

# 4. Initialize database schema
npm run db:init

# 5. Start the development server
npm run dev
```

---

## 👤 Author

**Shailesh Singh**  
Final-Year B.Tech IT, P.P. Savani University, Surat  
- **Portfolio**: [shaileshsingh1.netlify.app](https://shaileshsingh1.netlify.app)  
- **GitHub**: [@shailesh1921](https://github.com/shailesh1921)  
- **LinkedIn**: [linkedin.com/in/shailesh-singh](https://linkedin.com/in/shailesh-singh)  
- **Email**: singh44shailesh@gmail.com
