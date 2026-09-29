# EDGEWFORCE - Production Deployment & Migration Guide (Vercel + Supabase + GitHub)

This guide provides step-by-step instructions for deploying the **EdgeWForce** enterprise platform to **Vercel** (Frontend & Serverless API) and **Supabase** (PostgreSQL Database, Authentication, Cloud Storage, and Row Level Security).

---

## 1. Architecture Overview

`
                         USERS (Mobile, Tablet, Desktop)
                                       │
                                       ▼
                       Custom Domain / Cloudflare DNS
                        (e.g., https://app.yourdomain.com)
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │                    VERCEL                     │
               │  - Single Page Application (React 19 + Vite)  │
               │  - Serverless API Routes (/api/*)             │
               │  - Background Crons (/api/tasks/worker/cycle) │
               │  - Global CDN & Automatic SSL                 │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │                   SUPABASE                    │
               │  - Managed PostgreSQL Database (300+ Users)   │
               │  - Row Level Security (Tenant Isolation RLS)  │
               │  - Cloud Storage Bucket: edgewforce-media     │
               │  - Auth & Security Engine                     │
               └───────────────────────────────────────────────┘
`

---

## 2. What Was Changed & Hostinger Dependencies Removed

1. **Hostinger Apache / PM2 Removed**:
   - Removed .htaccess (Apache rewrite rules) in favor of standard ercel.json rewrites and HTTP security headers.
   - Removed ecosystem.config.cjs (PM2 cluster configuration) in favor of Vercel Serverless Function on-demand scaling.
   - Replaced hardcoded smtp.hostinger.com in emailService.js with standard configurable environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).
   - Updated the IT Admin Dashboard infrastructure card to reflect Vercel Edge Network + Supabase Cloud PostgreSQL.

2. **Ephemeral Local Disk Storage Removed**:
   - Replaced local disk file writes (server/uploads/) with **Supabase Storage Service** (server/src/services/storageService.js) using multer.memoryStorage().
   - All proofs of delivery, custom payslips, store photos, and competitor intel are now streamed directly to the Supabase Cloud Storage bucket (edgewforce-media) and served via global Supabase CDN URLs.

3. **Vercel Serverless Function & Cron Scheduling**:
   - Created pi/index.js which exports the Express app directly into the Vercel Node runtime.
   - Configured Vercel Cron in ercel.json to trigger /api/tasks/worker/cycle every 10 minutes for task reminders and telemetry checks.

4. **Security & Git Repository Protection**:
   - Created root .gitignore ensuring that .env, .env.local, 
ode_modules, client/dist, logs, and temporary files are never exposed to GitHub.

---

## 3. Step 1: Set Up Supabase (Database & Storage)

### A. Create Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, select your organization, enter a project name (e.g. edgewforce-prod), and set a strong database password.
3. Choose the region closest to your users (e.g., Europe (Frankfurt) or Europe (London) for Nigerian and West African traffic).

### B. Run Schema & Seed SQL
1. In the Supabase Dashboard left menu, click **SQL Editor**.
2. Click **New query**.
3. For a **new, empty project**, run `supabase/migrations/001_initial_schema.sql` through `014_application_runtime_schema.sql` in numeric order. Do not run `supabase/schema.sql` first; it is an alternate schema with incompatible employee ID types.
   - Alternatively, run `supabase/migrations/all.sql` once on an empty project. Do not run the bundle and the individual files together.
   - Migration 006 seeds the authoritative staff records. Do not rerun it on an existing production database without reviewing conflicts and taking a backup.
   - Migration 013 deletes the two retired sample workplaces and their assignment/history rows. Review that data effect before applying it to any database containing real assignments.
   - Migrations 011-012 retain legacy numeric primary keys while moving application-facing user/staff references to UUIDs. Migration 014 adds backend runtime tables and restricts media uploads to authenticated users.
4. For an **existing Supabase project**, do not run `all.sql` or replay the full list. Back up the database, inspect the live schema, and apply only migrations that have not already been applied.
   Set `SUPABASE_SCHEMA_VARIANT=numbered` for this migration chain and `DATABASE_MODE=supabase` to prevent failed cloud queries from using local sample data. The browser's public settings belong in `client/.env.local`; keep server secrets in the root/server private environment files.
5. Do not rely on `supabase/seed.sql` alone for production staff data. It contains only the small demo dataset; migration 006 is the authoritative staff seed for a fresh install.
6. Verify the online staff count in the SQL Editor:
   ```sql
   SELECT COUNT(*) AS users FROM public.users;
   SELECT COUNT(*) AS employees FROM public.employees;
   SELECT id, employee_code, full_name, work_email, status
   FROM public.employees
   ORDER BY id;
   ```
   The employee count should be at least 68 after the migration.

### C. Verify Cloud Storage Bucket
1. In the Supabase Dashboard, click **Storage** in the left menu.
2. Confirm the edgewforce-media bucket is visible and marked as **Public Bucket** (for avatar and delivery proof viewing).

### D. Copy Supabase API Keys
1. Go to **Project Settings** &rarr; **API**.
2. Copy the following values:
   - **Project URL**: https://<project-ref>.supabase.co
   - **anon (public)** key: eyJhbGci...
   - **service_role (secret)** key: eyJhbGci... *(Keep this secret! Never expose to client-side code)*

---

## 4. Step 2: Push Codebase to GitHub

1. Initialize git and commit the codebase (ensure .gitignore is in place):
   `ash
   git add .
   git commit -m "feat: migrate EdgeWForce to Vercel and Supabase architecture"
   `
2. Create a private repository on GitHub (e.g., https://github.com/your-username/edgewforce).
3. Link and push to GitHub:
   `ash
   git branch -M main
   git remote add origin https://github.com/your-username/edgewforce.git
   git push -u origin main
   `

---

## 5. Step 3: Deploy to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository (edgewforce).
4. In the Project Configuration screen:
   - **Framework Preset**: Vite (or Other)
   - **Root Directory**: ./ (leave as root)
   - **Build Command**: 
pm --workspace client run build (or leave default from ercel.json)
   - **Output Directory**: client/dist (configured in ercel.json)
5. Open the **Environment Variables** section and add:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| NODE_ENV | production | Production mode |
| CLIENT_URL | https://your-custom-domain.com | Allowed CORS origins |
| JWT_SECRET | *(A random, private application session secret)* | Signs application-issued sessions. Supabase-issued sessions are verified through Supabase Auth, including ES256 signing keys. A signing key ID is not a secret. |
| SUPABASE_JWT_SECRET | *(Leave empty when JWT_SECRET is configured)* | Legacy fallback alias; never expose it in Vite/client variables |
| SUPABASE_URL | https://<your-project-ref>.supabase.co | Supabase endpoint |
| SUPABASE_ANON_KEY | *(Your Supabase anon key)* | Supabase public key |
| SUPABASE_SERVICE_ROLE_KEY | `sb_secret_...` from this same Supabase project | **Required by the Vercel API for registration and database writes; never expose it in Vite/client variables. Verify it is accepted by the project before deploying.** |
| SUPABASE_STORAGE_BUCKET | edgewforce-media | Storage bucket name |
| PAYSTACK_SECRET_KEY | sk_live_... | Paystack payments |
| PAYSTACK_PUBLIC_KEY | pk_live_... | Paystack public key |
| SMTP_HOST | smtp.resend.com | Email delivery host |
| SMTP_PORT | 465 | SMTP SSL Port |
| SMTP_USER | resend | SMTP username |
| SMTP_PASS | re_... | SMTP API key / password |
| EMAIL_FROM | operations@your-custom-domain.com | Sender email address |

6. Click **Deploy**. Vercel will build the frontend assets and deploy the serverless API.

---

## 6. Step 4: Custom Domain & DNS Configuration

To link your custom domain (e.g., edgewforce.yourdomain.com or pp.yourdomain.com):

1. In your **Vercel Project Settings**, go to **Domains**.
2. Click **Add**, type your domain (e.g., pp.yourdomain.com), and click **Add**.
3. In your DNS Provider (Cloudflare, Namecheap, GoDaddy, or Registrar), add the DNS record indicated by Vercel:

| Type | Name / Host | Target / Value | TTL | Proxy Status (Cloudflare) |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | pp | cname.vercel-dns.com | Auto | DNS Only (or Proxied) |
| **A** *(if apex domain)* | @ | 76.76.21.21 | Auto | DNS Only (or Proxied) |

4. Vercel will automatically provision a free, auto-renewing **Let's Encrypt SSL/TLS Certificate** within 2–5 minutes.

---

## 7. Default System Accounts & Testing

Once deployed, you can verify using the pre-seeded accounts (Password: ChangeMe123!):

| Role | Email | Mobile Number | Access Area |
| :--- | :--- | :--- | :--- |
| **Chief Executive Officer (CEO)** | ceo@edgewforce.com | +2348099887766 | Full Executive Cockpit & Financials |
| **IT Super Admin** | it@edgewforce.com | +2348077665544 | System Configuration & Telemetry |
| **Head of HR** | hr@edgewforce.com | +2348055443322 | Workforce, Leave & SOS Resolution |
| **Head of Accounting** | ccountant@edgewforce.com | +2348033221100 | Payroll, Ledgers & Settlements |
| **Field Supervisor** | supervisor@edgewforce.com | +2348187654321 | Store Requests, Route Maps & Overrides |
| **Commercial Sales Agent** | sales@edgewforce.com | +2348031234567 | POS Orders, Customer Register & Ledger |
| **Field Lead Agent** | ield@edgewforce.com | +2348029876543 | Shift GPS Check-in & Store Audits |

---

## 8. Verification & Health Check

- **API Health Endpoint**: https://<your-domain>/api/health
  - Returns { "status": "healthy", "service": "EDGEWFORCE Enterprise Backend" }
- **Frontend SPA**: https://<your-domain>/
  - Loads login screen with Nigerian phone normalization, email auth, and multi-factor capabilities.
