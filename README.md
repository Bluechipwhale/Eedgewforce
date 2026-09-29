# EDGEWFORCE
## Enterprise Commercial Sales, Field Operations & Workforce Automation Platform
**Powered by Experiential Edge / Integrated Marketing Solutions**

---

## 🌟 Executive Overview
**EdgeWForce** is a unified, production-grade enterprise workforce operating system designed for high-velocity commercial sales distribution, field marketing operations, GPS telemetry, employee self-service, and organizational intelligence across Nigeria.

The platform eliminates operational blind spots by unifying:
1. **Commercial Sales Force Automation**: 12-section cockpit, POS order execution with Nigerian **7.5% VAT**, merchant credit control, receipt printing, debt collections, and an automated **5% Take-Home Commission Engine**.
2. **Field Operations & GPS Telemetry**: Route manifests, Leaflet OpenStreetMap telemetry with radar markers, **Strict 150-Meter Geofence Verification** (Haversine formula), store audits with HTML5 canvas customer signatures, and an unmutable **Emergency SOS Panic Beacon**.
3. **Corporate Employee Self-Service**: GPS attendance timesheet clock-in, biometric facial verification with confidence scoring, leave applications with working days calculation (excluding weekends), official downloadable payslips (Basic + Housing + Transport − PAYE & 8% Pension), and OKRs.
4. **HR Command Center & Governance**: Real-time workforce overview, live attendance monitoring, **10-minute non-invasive browser inactivity monitoring**, leave approvals, hierarchical task assignments (preventing upward assignment), SOS emergency queue, and an interactive organization chart.
5. **Sales AI Copilot**: Real-time tactical assistant for objection handling, cross-selling bundles, competitive pricing intelligence, and debt recovery dialogue.

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
Clone or open the project root directory and install dependencies:
```bash
# In the root repository
npm install

# Install client and server packages
cd server && npm install
cd ../client && npm install
```

### Local Configuration and Login Troubleshooting

Keep credentials in ignored environment files, never in GitHub:

- Configure `server/.env` from `server/.env.example`. When starting with `npm start` from the repository root, the root `.env` must use the same Supabase project and application secret.
- Set `DATABASE_MODE=supabase` and `SUPABASE_SCHEMA_VARIANT=numbered` for the numbered migrations in this repository.
- Configure `client/.env.local` with `VITE_SUPABASE_URL`, the public `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL=/api`. Never put a service-role key in a `VITE_` variable.
- For local development, use `NODE_ENV=development` and allow `http://127.0.0.1:5173` in `CLIENT_URL`. Restart the backend after changing environment files.
- On Windows systems that require the operating system certificate store, use Node 24 and `SUPABASE_USE_SYSTEM_CA=true`; never disable TLS certificate verification.

Run `npm run dev` from the root and keep it running while using the app. Open `http://127.0.0.1:5173/`. Both `http://127.0.0.1:3000/api/health` and `http://127.0.0.1:5173/api/health` should report `healthy` with `database: supabase`. A Vite login proxy error can mean the backend is stopped; a 503 health response means the live database configuration or connection needs attention.

GitHub stores the source code; it does not run the backend. Public hosting needs its own private environment variables. Replace seeded default passwords and any exposed secrets before public deployment.

### 3. Running the Test Suite
The automated test suite covers strict 150m boundary calculations, 7.5% VAT, 5% commission, working days, payroll deductions, and end-to-end integration workflows:
```bash
cd server
npm test
```

### 4. Running the Development Server
You can launch both the backend API server and frontend Vite application concurrently:
```bash
# From the root directory:
npm run dev

# Or launch independently:
# Backend (Port 3000):
cd server && npm run dev

# Frontend (Port 5173):
cd client && npm run dev
```

### 5. Building for Production
```bash
cd client
npm run build
```
Once built, starting the server (`cd server && npm start`) automatically serves both the backend REST APIs and the built production SPA on `http://localhost:3000`.

---

## 👥 Seed Accounts & Credentials
All accounts are pre-seeded with realistic Nigerian enterprise data.
- **Default Password**: `ChangeMe123!`

| Role / Designation | Name | Email | Default Dashboard |
| :--- | :--- | :--- | :--- |
| **Sales Agent** | Adebanjo Adeleke | `sales@edgewforce.com` | Commercial Sales Cockpit |
| **Field Lead** | Babatunde Odesina | `field@edgewforce.com` | Field Operations Cockpit |
| **Corporate Staff** | Tariq Al-Mansoor | `staff@edgewforce.com` | Employee Self-Service |
| **HR Head** | Ngozi Eze | `hr@edgewforce.com` | HR Command Center |
| **CEO** | Folashade Balogun | `ceo@edgewforce.com` | Executive Management |
| **Commercial Finance** | Olumide Bakare | `accountant@edgewforce.com` | Accounting & Settlements |
| **Regional Manager** | Chinedu Nwosu | `manager@edgewforce.com` | Management & HR |
| **Field Supervisor** | Amina Bello | `supervisor@edgewforce.com` | Field Operations & HR |

---

## 📐 Core Business Rules & Formulas

### 1. Strict 150-Meter Geofence Verification
Field check-ins require proximity verified mathematically using the **Haversine formula** with Earth Radius $R = 6,371,000\text{ m}$:
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
- **Rule**: Check-in is allowed **only** if $d \le 150.0\text{ meters}$.
- Verified and enforced on both client and backend.

### 2. 5% Commercial Sales Commission Engine
$$\text{Take-Home Commission} = \text{Closed/Delivered Sales} \times 5\%$$
- Real-time milestone tracker shows current take-home earnings alongside quota achievement percentage.

### 3. POS Order Financial Calculations (Nigerian VAT)
$$\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount})$$
$$\text{VAT (7.5\%)} = \text{Taxable Amount} \times 0.075$$
$$\text{Grand Total} = \text{Taxable Amount} + \text{VAT}$$

### 4. Employee Payroll Deductions (Nigerian Labour & Tax Law)
- **Gross Pay**: $\text{Basic Salary} + \text{Housing} + \text{Transport} + \text{Other Allowances}$
- **Pension Contribution**: $8\%$ of $(\text{Basic} + \text{Housing} + \text{Transport})$
- **PAYE Income Tax**: Progressive tax bands with statutory consolidated relief
- **Net Pay**: $\text{Gross Pay} - (\text{PAYE} + \text{Pension} + \text{Other Deductions})$

### 5. 10-Minute Non-Invasive Workstation Idle Monitoring
- Workstation inactivity is tracked at 10 minutes (600,000 ms).
- **Ethics Guarantee**: No keylogging, no screen captures, no webcam recording.
- Non-invasive prompt allows staff to categorize inactive periods (*Break, Meeting, Field Work, Reading/Research, System Issue, Other*) with optional explanation for management review.

---

## 🗄️ Database Architecture & Migrations
The database layer is located in `supabase/migrations/`:
- `001_initial_schema.sql`: 32+ relational PostgreSQL tables with indexes, foreign keys, constraints, and audit tables.
- `002_security_rls.sql`: Row-Level Security (RLS) policies enforcing multi-tenant role permissions.
- `003_audit_triggers.sql`: Automated PostgreSQL audit triggers logging user actions.
- `seed.sql`: Realistic Nigerian commercial retail seed data.

*Dual Data-Access Engine*: In local development or offline environments without active Supabase credentials, the backend automatically uses the ACID-compliant atomic local transactional store (`server/data/store.json`).

---

## 🛡️ Security & Quality Assurance
- **Strict Role-Based Access Control (RBAC)** across 24 distinct permission categories.
- **Hierarchy Invalidation**: Supervisors and managers can assign tasks down to staff, but upward task assignment is rejected.
- **Biometric Identity Security**: Face verification generates biometric hashes; raw video streams are never transmitted or retained.
- **Offline Idempotency**: Queue keys (`IDEMP-ACTION-...`) ensure offline order bookings and check-ins never duplicate on network recovery.

---
*© 2026 Experiential Edge Nigeria Limited. All rights reserved.*
