-- ==============================================================================
-- EDGEWFORCE - AUTHORITATIVE PRODUCTION DATABASE SEED & SCHEMA MIGRATION
-- Migration: 006_authoritative_staff_seed.sql
-- Contains complete tables DDL, columns extension, and full 66 staff seed records.
-- ==============================================================================

BEGIN;

-- 1. EXTEND TABLES COLUMNS SAFELY
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS raw_phone TEXT;

ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS work_email TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Nigerian';
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS city_lga TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS state_of_origin TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS state_of_residence TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS department_raw TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS date_of_joining TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS work_location TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS hobbies_interests TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created';

-- Application roles evolve independently of the original demo role list.
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_code_check;

-- Seed referenced lookup rows before the authoritative employee records.
INSERT INTO public.departments (id, name, code, description) VALUES
  (1, 'Commercial Sales', 'SALES', 'Retail distribution and accounts'),
  (2, 'Field Operations', 'FIELD', 'Store audits and route execution'),
  (3, 'Human Resources', 'HR', 'People operations and welfare'),
  (4, 'Finance and Accounts', 'FINANCE', 'Treasury, collections and payroll'),
  (5, 'Technology and IT', 'TECH', 'Portal administration and security'),
  (6, 'Executive Management', 'EXEC', 'Executive leadership')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ranks (id, code, name, level, active) VALUES
  (1, 'CEO', 'Chief Executive Officer', 1, TRUE),
  (2, 'IT_ADMIN', 'IT Administrator', 2, TRUE),
  (3, 'CTO', 'Chief Technology Officer', 3, TRUE),
  (4, 'HR', 'Head of Human Resources', 4, TRUE),
  (5, 'SENIOR_ACCOUNTANT', 'Senior Accountant', 5, TRUE),
  (6, 'ACCOUNTANT', 'Accountant', 6, TRUE),
  (7, 'MANAGER', 'Manager', 7, TRUE),
  (8, 'SUPERVISOR', 'Supervisor', 8, TRUE),
  (9, 'STAFF', 'Staff Member', 9, TRUE),
  (10, 'STAFF_MEMBER', 'Staff Member', 10, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.departments', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.departments), 1), 1), true);
SELECT setval(pg_get_serial_sequence('public.ranks', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.ranks), 1), 1), true);

-- 2. SEED AUTHORITATIVE USERS
INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  1, 1, 'IT Super Admin', 'it@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348000000001', '+2348000000001', 'SUPER_ADMIN', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  2, 1, 'Chief Executive Officer', 'ceo@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348000000002', '+2348000000002', 'CEO', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  3, 1, 'Head of Human Resources', 'hr@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348000000003', '+2348000000003', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  4, 1, 'Commercial Sales Lead', 'sales@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348031234567', '+2348031234567', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  5, 1, 'Godfrey Okorie', 'field@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2347050956271', '07050956271', 'FIELD_AGENT', 'active', TRUE, 'Active', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  6, 1, 'Finance & Accounting Lead', 'accountant@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348000000006', '+2348000000006', 'ACCOUNTANT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  7, 1, 'Field Operations Supervisor', 'supervisor@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348187654321', '+2348187654321', 'SUPERVISOR', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  8, 1, 'Corporate Operations Staff', 'staff@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348145550192', '+2348145550192', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  9, 1, 'Platform Super Administrator', 'admin@edgewforce.com', '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO', '+2348000000000', '+2348000000000', 'SUPER_ADMIN', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.364Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  10, 2, 'Babajide Sanwo', 'jide@apexfmcg.ng', '$2b$10$LODr2vxv.Wbf7ZE8pFwqd.K0dYy7pDjQBPBvqPnk/AtzbX.9iaFEy', '+2348033334444', '+2348033334444', 'ADMIN', 'active', TRUE, 'Account Created', '2026-09-17T23:39:43.852Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  11, 1, 'Olasode Olawale', 'oolasode@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347037924201', '07037924201', 'CTO', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.335Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  12, 1, 'Lucky Loveday', 'lloveday@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348143692166', '08143692166', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.367Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  13, 1, 'Deborah Obadina', 'dobadina@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348139203775', '08139203775', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.393Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  14, 1, 'Egbewole Adewole Kayode', 'a.egbewole@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348066473194', '08066473194', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.410Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  15, 1, 'MARVELLOUS DANIEL-OKE', 'moke@m.experiential-edge', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349041430470', '09041430470', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.420Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  16, 1, 'Ajiboye Taiwo Olayemi', 'tajiboye@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349133313366', '09133313366', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.461Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  17, 1, 'Makinde Shadiat Temitope', 'tmakinde@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348103769573', '08103769573', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.477Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  18, 1, 'Adeyeye oluwatoyosi Adedamola', 'oadeyeye@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348134505006', '08134505006', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.497Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  19, 1, 'Oyewumi Olukunle', 'koyewumi@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348033830324', '08033830324', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.527Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  20, 1, 'Owotomo kehinde iromidayo', 'k.owotomo@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348067505695', '08067505695', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.542Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  21, 1, 'ONYEKACHI STELLA', 's.onyekachi@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348148860221', '08148860221', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.583Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  22, 1, 'AKINOLA OPEYEMI FLORENCE', 'fakinola@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348142880478', '08142880478', 'ACCOUNTANT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.610Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  23, 1, 'Izuchukwu Valentine Nworah', 'valentine.nworah@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348060720372', '08060720372', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.623Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  24, 1, 'Samuel Oyegbade', 's.tosin@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348106156569', '08106156569', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.718Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  25, 1, 'Patricia Dare', 'darepatricia28@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348147382457', '08147382457', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.757Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  26, 1, 'Asukwo Richard', 'richard.asukwo21@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348135032689', '08135032689', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.776Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  27, 1, 'Owolebi Ayomipo', 'aowolebi@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348027208651', '08027208651', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.818Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  28, 1, 'Esu Lynda', 'lynda@edgedirect2u.com.ng', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347064290635', '07064290635', 'ACCOUNTANT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.833Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  29, 1, 'Adebisi Adeyinka Olalekan', 'adebysee2018@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348034540406', '08034540406', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.848Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  30, 1, 'Osere Juliana merciful', 'jullyosere22456@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347061137500', '07061137500', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.901Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  31, 1, 'Adeyemi Vivian', 'adeyemivivianomon@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348060815356', '08060815356', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.949Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  32, 1, 'Nwaeze Chidinma', 'cnwaeze@experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348066693700', '08066693700', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.965Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  33, 1, 'Okorie kemi', 'sophiaokoriee@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347054077721', '07054077721', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:47.999Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  34, 1, 'Ekeocha Ebube Christiana', 'cekeocha@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349034043158', '09034043158', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.031Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  35, 1, 'Albert Rhema', 'arhema@m.experential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347032416493', '07032416493', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.117Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  36, 1, 'Tochukwu Okonta', 'tokonta@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348164809945', '08164809945', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.182Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  37, 1, 'Feyifoluwa Oluwatosin', 'femmanuel@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348163722231', '08163722231', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.259Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  38, 1, 'Oshipelu Onaolapo', 'oayorinde@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348130714369', '08130714369', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.346Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  39, 1, 'Samuel Adeolu Elijah', 'adeolusamuel640@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348142665143', '08142665143', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.361Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  40, 1, 'Babatunde Badirudeen', 'babatunde@edgedirect2u.com.ng', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+447350152791', '+44 7350 152791', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.411Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  41, 1, 'Diepreye Desmond', 'ddiepreye@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347054353032', '07054353032', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.473Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  42, 1, 'Ayomide Tunji-Bello', 'oayomide@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348185306037', '08185306037', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.504Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  43, 1, 'Idowu Jeremiah Olurakinyo', 'iolurakinyo.m-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348033753322', '08033753322', 'ACCOUNTANT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.522Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  44, 1, 'QUEEN ADJOGRI', 'queendavid2222@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348021275017', '08021275017', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.537Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  45, 1, 'Ndidiamaka Ekwueme', 'nekueme@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349056871570', '09056871570', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.584Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  46, 1, 'Peter Obie', 'opeter@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347010759243', '07010759243', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.603Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  47, 1, 'BALA LISAG KOSY', 'princesskbala31@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348063371005', '08063371005', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.679Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  48, 1, 'Ogiri Ann', 'aogiri@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348022536606', '08022536606', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.727Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  49, 1, 'Daniel Zabe', 'zabedaniel8@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348129292596', '08129292596', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.745Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  50, 1, 'Ewuoso Ayoola Joseph', 'ewuoso53@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348064852972', '08064852972', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.761Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  51, 1, 'Odesina Ayodeji Oluwaseye', 'odesinaseye@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348033565543', '08033565543', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.848Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  52, 1, 'Adekunle Opeyemi', 'goldsmile2000@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349150954593', '09150954593', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.872Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  53, 1, 'Simon Hezekiah', 'simonhezekiah67@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349077803201', '09077803201', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.931Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  54, 1, 'ORJI MICHAEL UCHECHI', 'michaeorji222@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349017542793', '09017542793', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:48.959Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  55, 1, 'Jonah Daniel Agada', 'dannyjagas03@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347019147585', '07019147585', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.015Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  56, 1, 'Chiamaka Favour', 'chiamakacf4286046@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348037486841', '08037486841', 'STAFF_MEMBER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.070Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  57, 1, 'David Oyedepo', 'davidoyedepo@eedge', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349077689952', '09077689952', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.116Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  58, 1, 'Prince Donald', 'princedonald34@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348104590850', '08104590850', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.136Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  59, 1, 'Chidinma Mordi (Obidiegwu)', 'ochidinma@edgedirect2u.com.ng', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348037674270', '08037674270', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.202Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  60, 1, 'Uke-Ulim Ekunke-Ogah', 'uogah@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348037169208', '08037169208', 'MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.222Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  61, 1, 'Ajayi Adedayo', 'aajayi@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348140079684', '08140079684', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.275Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  62, 1, 'Ademola Famade', 'adetopemi@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348028487667', '08028487667', 'ACCOUNTANT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.298Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  63, 1, 'Lawal Olufemi Jamiu', 'lolufemi@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348130155784', '08130155784', 'HR_MANAGER', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.387Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  64, 1, 'Chiedozie Joseph Orji', 'corji@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348068349700', '08068349700', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.411Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  65, 1, 'Amadi Amobi Elias', 'aelias@m.experiential-edge.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2348021190284', '08021190284', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.462Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  66, 1, 'Abdulfatai Abdulsalami', 'abdulsalami424@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2347086546219', '07086546219', 'SALES_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.488Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  67, 1, 'Okoye Favour Chidinma', 'okoyefavour16@gmail.com', '$2b$10$k/IQzTORkTMfNekRvhzukuAbgEkrZkX7aSGKP9J5FGrXdP4W.JE/i', '+2349012133017', '09012133017', 'FIELD_AGENT', 'active', TRUE, 'Account Created', '2026-09-17T23:39:49.527Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.users (
  id, company_id, full_name, email, password_hash, phone, raw_phone, role_code, status, requires_password_change, onboarding_status, created_at
) VALUES (
  68, 1, 'Babatunde Babs', 'babs@m.experiential-edge.com', '$2b$10$vecYkPz/BZpW2zXq11feZ.QTc5.vpYWkGxfto29rX6nxyOwT5/ABe', '+2347037924200', '+2347037924200', 'IT_ADMIN', 'active', FALSE, 'Account Created', '2026-09-18T00:01:37.629Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  raw_phone = EXCLUDED.raw_phone,
  role_code = EXCLUDED.role_code,
  status = EXCLUDED.status,
  requires_password_change = EXCLUDED.requires_password_change,
  onboarding_status = EXCLUDED.onboarding_status;

-- 3. SEED AUTHORITATIVE EMPLOYEES
INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  1, 1, 1, 'EMP-1001', NULL, 'IT Admin', 'Service', 'IT Admin Service', NULL, NULL, '+2348000000001', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 5, 'Technology & IT', 'IT Super Admin / System Engineer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'IT_ADMIN', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.394Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  2, 1, 2, 'EMP-1002', NULL, 'Executive', 'Management', 'Executive Management', NULL, NULL, '+2348000000002', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 6, 'Executive Management', 'Chief Executive Officer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CEO', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.395Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  3, 1, 3, 'EMP-1003', NULL, 'HR', 'Manager', 'HR Manager', NULL, NULL, '+2348000000003', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 3, 'Human Resources', 'Head of Human Resources', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'HR', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.395Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  4, 1, 4, 'EMP-1004', NULL, 'Thompson', 'Babatunde', 'Thompson Babatunde', NULL, NULL, '+2348031234567', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 1, 'Commercial Sales', 'Senior Commercial Sales Agent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.395Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  5, 1, 5, 'EMP-1026', NULL, 'Godfrey', 'Okorie', 'Godfrey Okorie', 'gokoriee@gmail.com', 'gokorie.m@experiential-edge.com', '+2347050956271', '1988-12-02', 'Married', 'Nigeria', 'Road 1 house 19 diamond estate igando road', 'Road 1 house 19 diamond estate igando road', 'Lagos', 'Cross river', 'Cross river', 'Diamond estate bstp', NULL, 'Operations', 'Senior operations manager', '2017-04-02', 'Maryland', 'Chidinma Nwaeze', '07054077721', 'Spouse', '08029589181', NULL, 'Parallex bank', '2000388990', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-18T00:17:03.395Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  6, 1, 6, 'EMP-1006', NULL, 'Finance', 'Officer', 'Finance Officer', NULL, NULL, '+2348000000006', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 4, 'Finance & Accounts', 'Head of Accounting & Payroll', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ACCOUNTANT', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.395Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  7, 1, 7, 'EMP-1007', NULL, 'Amina', 'Bello', 'Amina Bello', NULL, NULL, '+2348187654321', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 2, 'Field Operations', 'Field Operations Supervisor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'SUPERVISOR', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.396Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  8, 1, 8, 'EMP-1008', NULL, 'Gloria', 'Iwuh', 'Gloria Iwuh', NULL, NULL, '+2348145550192', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 3, 'Corporate Operations', 'Workforce Operations Analyst', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.396Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  9, 1, 9, 'EMP-1009', NULL, 'Platform', 'Administrator', 'Platform Administrator', NULL, NULL, '+2348000000000', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, 6, 'Executive Governance', 'Super Administrator', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CEO', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:17:03.396Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  10, 2, 10, 'EMP-3855', NULL, 'Admin', 'User', 'Admin User', NULL, NULL, '+2348033334444', NULL, NULL, 'Nigerian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Executive Management', 'Managing Director / Tenant Admin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'STAFF_MEMBER', FALSE, NULL, 'Account Created', 'active', '2026-09-17T23:39:43.855Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  11, 1, 11, 'EMP-1010', NULL, 'Olasode', 'Olawale', 'Olasode Olawale', 'oolasode@m.experiential-edge.com', 'oolasode@m.experiential-edge.com', '+2347037924201', '1993-06-19', 'Married', 'Nigeria', '9 Paseda idi oya ibadan', '9 paseda street idi oya', 'Ibadan', 'Oyo', 'Oyo', 'Living proof supermarket', NULL, 'IT', 'CTO', '2022-09-23', 'Maryland', 'Vivian Osigweh', 'Deborah', 'Wife', '08102649646', 'As', 'Opay', '7037924201', NULL, 'CTO', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.350Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  12, 1, 12, 'EMP-1011', NULL, 'Lucky', 'Loveday', 'Lucky Loveday', 'lovedayopus@gmail.com', 'lloveday@m.experiential-edge.com', '+2348143692166', '1993-10-19', 'Single', 'Nigeria', '1 U gonna Street off Utility street Bako Estate, Irawo Mile 12', '1 U gonna Street off Utility street Bako Estate, Irawo Mile 12', 'Kosofe', 'Rivers/ Lagos', 'Rivers/ Lagos', 'Irawo Busstop', 3, 'HR', 'Capability and operations manager', '2025-05-19', 'Maryland', 'MD', '08063296220', 'Sister', '08063296220', NULL, 'Access', '0725197366', NULL, 'HR', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.373Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  13, 1, 13, 'EMP-1012', NULL, 'Deborah', 'Obadina', 'Deborah Obadina', 'deborahobadina01@gmail.com', 'dobadina@m.experiential-edge.com', '+2348139203775', '1987-06-05', 'Married', 'Nigeria', '34 Greenland street egbeda', '34 Greenland street egbeda', 'Alimosho', 'Lagos', 'Lagos', 'Egbeda', NULL, 'Strategy', 'Account executive', '2025-07-24', 'Maryland', 'Mrs Chidinma', 'Dare otujinrin', 'Brother', '07030746413', NULL, 'Sterling bank', '0107337280', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.401Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  14, 1, 14, 'EMP-1013', NULL, 'Egbewole', 'Adewole Kayode', 'Egbewole Adewole Kayode', 'egbewoleak@yahoo.com', 'a.egbewole@m.experiential-edge.com', '+2348066473194', '1984-09-28', 'Married', 'Nigerian', '49, Adebowale Crescent Ago 40 Estate Aboru', '49, Adebowale Crescent Ago 40 Estate Aboru', 'Alimosho', 'Osun/Lagos', 'Osun/Lagos', 'Nepa Office Ago 40', NULL, 'Operation', 'Compliance Manager', '2024-02-14', 'Lagos', 'Mrs Vivian Osigweh (MD)', 'Egbewole Olubunmi', 'Spouse', '07031510725', 'AA', 'First Bank', '3057047291', 'Traveling', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.415Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  15, 1, 15, 'EMP-1014', NULL, 'MARVELLOUS', 'DANIEL-OKE', 'MARVELLOUS DANIEL-OKE', 'thegreatmarvellousoke@gmail.com', 'moke@m.experiential-edge', '+2349041430470', '2001-02-04', 'Single', 'NIGERIAN', '57, HARRISON SOLACE, AGO PALACE WAY, OKOTA, LAGOS', '57, HARRISON SOLACE, AGO PALACE WAY, OKOTA, LAGOS', 'LAGOS/OSHODI ISOLO', 'OYO/LAGOS', 'OYO/LAGOS', 'OKOTA', NULL, 'COMPLIANCE', 'COMPLIANCE MANAGER', '2025-11-01', 'MARYLAND', 'KAYODE', 'PRAISE OLAJIDE', 'SIBLING', '08181475532', 'O+', 'WEMA', '0410169087', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.430Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  16, 1, 16, 'EMP-019', '019', 'Ajiboye', 'Taiwo Olayemi', 'Ajiboye Taiwo Olayemi', 'ajiboyetayeolayemi2018@gmail.com', 'tajiboye@m.experiential-edge.com', '+2349133313366', '1999-05-12', 'Single', 'Nigerian', '6, dapo sokeye close isolo Lagos', '6, dapo sokeye close isolo Lagos', 'Lagos', 'Osun state', 'Osun state', 'Isolo', NULL, 'Operations', 'Compliance Officer', '2025-01-05', 'Merryland', 'Mr. Kayode', '07087579977', 'Twin brother', '09133313366', 'AA', 'Ajiboye Taye', '2119602047', 'Listening to sermon', 'STAFF', FALSE, '', 'Account Created', 'active', '2026-09-17T23:39:47.469Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  17, 1, 17, 'EMP-1016', NULL, 'Makinde', 'Shadiat Temitope', 'Makinde Shadiat Temitope', 'tmakinde@m.experiential-edge.com', 'tmakinde@m.experiential-edge.com', '+2348103769573', '1997-09-21', 'Single', 'Nigeria', '2,Ganiu lawal street', '2,Ganiu lawal street moricas', 'Alimosho LGA Lagos state', 'Ogun state/Lagos state', 'Ogun state/Lagos state', 'Idimu bustop', NULL, 'Compliance department', 'Compliance officer', '2025-08-11', '15,Atiba Osborne Mende Maryland', 'Mr kayode Adewole Egbewole', '09024413790', 'Mother', '08103769573', '0 positive', 'Makinde shadiat Temitope', '0065791380', 'Planing and organizing, Problem-solving, Leading teams, Tracking progress, Cooking', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.486Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  18, 1, 18, 'EMP-1017', NULL, 'Adeyeye', 'oluwatoyosi Adedamola', 'Adeyeye oluwatoyosi Adedamola', 'adeyeyeoluwatoyosi2000@gmail.com', 'oadeyeye@m.experiential-edge.com', '+2348134505006', '2000-09-23', 'Single', 'Nigeria', 'No 1 tiwalade close bamisile estate', 'No 1 tiwalade close bamisile estate', 'Lagos', 'Ekiti', 'Ekiti', 'Ikeja', NULL, 'Compliance', 'Compliance manager', '2025-09-25', 'Lagos', 'Kayode', '07066420768', 'Sister', '07066420768', NULL, 'UBA', '2386993514', 'Reading', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.513Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  19, 1, 19, 'EMP-1018', NULL, 'Oyewumi', 'Olukunle', 'Oyewumi Olukunle', 'kunleoyewumi@gmail.com', 'koyewumi@m.experiential-edge.com', '+2348033830324', '1970-03-06', 'Married', 'Nigerian', '12, Toyin crescent,Giwa', '12,Toyin Crescent Giwa', 'Ifako-Ijaye', 'Osun', 'Osun', 'Bokuu at Giwa Bus stop', NULL, 'Operations', 'Compliant Manager', '2024-09-09', 'Maryland', 'Chidinma Nwaeze', 'Oyewumi Omolara', 'Wife', '08028103335', 'O', 'FCMB', '0737 460 024', 'Music/singing/movies', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.533Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  20, 1, 20, 'EMP-1019', NULL, 'Owotomo', 'kehinde iromidayo', 'Owotomo kehinde iromidayo', 'owotomokenny@gmail.com', 'k.owotomo@m.experiential-edge.com', '+2348067505695', '1987-07-21', 'Married', 'Nigerian', 'Opposite omotayo hospital ososami oke ado ibadan', 'Opposite omotayo hospital ososami oke ado', 'Ibadan', 'Ondo/oyo', 'Ondo/oyo', 'Ososami', NULL, 'Opration', 'Compliance manager', '2024-03-08', 'Lagos', 'Egbeleye Kayode', '08104794831', 'Wife', '08104794831', 'O+', 'First bank', '3134107490', 'Reading, sport', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.547Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  21, 1, 21, 'EMP-003', '003', 'ONYEKACHI', 'STELLA', 'ONYEKACHI STELLA', 'kachiella9@gmail.com', 's.onyekachi@m.experiential-edge.com', '+2348148860221', '1997-09-08', 'Single', 'NIGERIAN', 'NO 10 INFINITY CLOSE FESTAC TOWN LAGOS', 'NO 10 INFINITY CLOSE FESTAC TOWN LAGOS', 'MAINLAND /LAGOS', 'ANAMBRA/LAGOS', 'ANAMBRA/LAGOS', '6TH AVENUE', NULL, 'COMPLAINCE/OERATIONS', 'COMPLIANCE MANAGER', '2023-08-21', 'IKEJA', 'MR KAYODE', '08033438046', 'FATHER', '08033438046', 'A+', 'FIDELITY', '6550101694', 'NIL', 'MANAGER', FALSE, '', 'Account Created', 'active', '2026-09-17T23:39:47.596Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  22, 1, 22, 'EMP-014', '014', 'AKINOLA', 'OPEYEMI FLORENCE', 'AKINOLA OPEYEMI FLORENCE', 'akinolaopeyemi158@gmail.com', 'fakinola@m.experiential-edge.com', '+2348142880478', '1995-02-18', 'Single', 'NIGERIA', '7 JIDE AKINOLA CLOSE AGBELEKALE', '7 JIDE AKINOLA CLOSE AGBELEKALE', 'LAGOS', NULL, NULL, 'ABULE-EGBA', 4, 'FINANCE', 'FINANCE MANAGER', '2025-01-13', 'MARYLAND', 'MR ID', '09032106013', 'sister', '08142880478', 'O+', 'GTBANK', '0156304321', 'SURFING THE INTERNET', 'ACCOUNTANT', FALSE, '', 'Account Created', 'active', '2026-09-17T23:39:47.617Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  23, 1, 23, 'EMP-1022', NULL, 'Izuchukwu', 'Valentine Nworah', 'Izuchukwu Valentine Nworah', 'valentine.nworah@gmail.com', 'valentine.nworah@gmail.com', '+2348060720372', '1989-09-04', 'Single', 'Nigerian', 'No 3 Adewale Balogun street, Powerline Busstop', 'No 3 Adewale Balogun street, Powerline Busstop', 'Isheri Alimosho', 'Anambra/ Lagos', 'Anambra/ Lagos', 'Powerline Busstop', NULL, 'Operations', 'VSR and Operations Manager', '2026-01-21', 'Ogba', 'Mrs. Vivian Osigweh', 'Nworah Stella', 'Mom', '08064722991', 'A+', 'Sterling Bank', '0036406994', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.629Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  24, 1, 24, 'EMP-1023', NULL, 'Samuel', 'Oyegbade', 'Samuel Oyegbade', 'ohluwatosin@gmail.com', 's.tosin@m.experiential-edge.com', '+2348106156569', '1993-08-04', 'Married', 'Nigeria', '8, Church Close, Olaniyi Abule Egba', '8, Church Close, Olaniyi Abule Egba', 'Ifako Ijaye', 'Lagos', 'Lagos', 'Ijaye', NULL, 'Operations', 'Operations Executive', '2024-05-07', 'Lagos', 'Mr Oluwatoyin', '09039653051', 'Wife', '09039653051', NULL, 'Gtbank', '0136824120', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.747Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  25, 1, 25, 'EMP-1024', NULL, 'Patricia', 'Dare', 'Patricia Dare', 'darepatricia28@gmail.com', NULL, '+2348147382457', '1993-12-28', 'Single', 'Nigerian', 'Beach Area, Nsukka Enugu State', 'Beach Area Nsukka, Enugu State', 'Nsukka', 'Osun', 'Osun', 'Oke odo area,Ejigbo', NULL, 'Compliance', 'Compliance manager', '2025-09-08', 'Eastern region', 'Mr Kayode', '08062208071', 'Aunty', '08062208071', 'AB+', 'First Bank', '3098285540', 'Singing, cooking', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Work email not yet assigned', 'Account Created', 'active', '2026-09-17T23:39:47.763Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  26, 1, 26, 'EMP-005', '005', 'Asukwo', 'Richard', 'Asukwo Richard', 'richard.asukwo21@gmail.com', 'richard.asukwo21@gmail.com', '+2348135032689', '1985-05-21', 'Single', 'Nigerian', 'No 16, Okunu Odunuegbe street, Adexson Ilepo bus stop, Akesan, igando, Lagos.', 'No 16, Okunu Odunuegbe street, Adexson Ilepo bus stop, Akesan.igando,lagos', 'Alimosho', 'Akwa ibom', 'Akwa ibom', 'Adexon ile-epo bistop', NULL, 'Operations', 'Operation Manger', '2024-11-01', 'Operations', 'Manager', '08063114785', 'Brother', '08063114785', 'O+', 'UBA', '2056557615', 'Sport, reading and travelling', 'STAFF', FALSE, '', 'Account Created', 'active', '2026-09-17T23:39:47.793Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  27, 1, 27, 'EMP-1027', NULL, 'Owolebi', 'Ayomipo', 'Owolebi Ayomipo', 'owolebiayomipo@gmail.com', 'aowolebi@m.experiential-edge.com', '+2348027208651', '1996-08-07', 'Single', 'Nigeria', '72, buari street, ogudu, Ojota, Lagos, Nigeria.', '72, buari street, ogudu, ojota, lagos', 'Kosofe', 'Lagos', 'Lagos', 'Ojota', NULL, 'Creative', 'Graphic designer', '2025-01-14', 'office', 'Gloria Iwuh', 'Owolebi Victor', 'brother', '+234 805 339 7016', 'O', 'Owolebi Ayomipo', '2069581014', 'Art', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.825Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  28, 1, 28, 'EMP-1028', NULL, 'Esu', 'Lynda', 'Esu Lynda', 'esulynda88@gmail.com', 'lynda@edgedirect2u.com.ng', '+2347064290635', '1997-10-14', 'Single', 'Nigeria', '12 Olanipekun Street Ogba', '12 Olanipekun Street Ogba', 'Ikeja', 'Lagos', 'Lagos', 'Aguda', 4, 'Finance', 'Senior Finance Manager', '2023-01-02', 'Ogba', 'MD', '+234 706 273 8052', 'Sister', '+234 706 273 8052', 'AB+', 'UBA', '2115115963', 'Financial analysis, budgeting, exploring ways to optimize business operations, studying market trends, personal finance strategies.', 'ACCOUNTANT', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.840Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  29, 1, 29, 'EMP-1029', NULL, 'Adebisi', 'Adeyinka Olalekan', 'Adebisi Adeyinka Olalekan', 'adebysee2018@gmail.com', 'adebysee2018@gmail.com', '+2348034540406', '1967-05-15', 'Married', 'Nigeria', '3B, New World Street, Fatade Estate Ijegun, Lagos', '3b, New World Street, Fatade Estate Ijegun Lagos', 'Alimosho', 'Ekiti/Lagos', 'Ekiti/Lagos', 'Estate Junction', NULL, 'E-EDGE DIRECT 2 YOU', 'Warehouse Manager', '2025-02-03', 'Ibadan', 'Maryjane', 'Adebisi Biliqis Olayiwola', 'Wife', '08029756204', NULL, 'First Bank Nig. Plc', '2000531375', 'Football', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.860Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  30, 1, 30, 'EMP-1030', NULL, 'Osere', 'Juliana merciful', 'Osere Juliana merciful', 'jullyosere22456@gmail.com', 'jullyosere22456@gmail.com', '+2347061137500', '2000-07-19', 'Single', 'Nigerian', '15, soroga street, jumofak bustop ikorodu', '15,soroga street, jumofak bustop ikorodu', 'Ikorodu', 'Edo state', 'Edo state', NULL, NULL, 'Admin', 'Receptionist', '2026-01-12', '15,atiba orsborne street', 'Mr Adedoyin', '09065992314', 'Mother', '09169464791', 'O+', 'GtBank', '0451963926', 'Movies', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.933Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  31, 1, 31, 'EMP-1031', NULL, 'Adeyemi', 'Vivian', 'Adeyemi Vivian', 'adeyemivivianomon@gmail.com', 'adeyemivivianomon@gmail.com', '+2348060815356', '1976-10-09', 'Married', 'Nigerian', 'No 9 mustapha street celeapatha Ayobo', 'No 9 mustapha street celeapatha Ayobo', 'Lagos/ Alimosho', 'Edo state', 'Edo state', 'So east', NULL, 'Chief', 'Chief / ware house manager', '2023-05-24', 'Maryland', 'Osigwe Vivian', 'Adeyemi oluwaseyi', 'Son', '07067186206', 'O +', 'First bank', '3048650541', 'Cooking,singing and reading', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:47.957Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  32, 1, 32, 'EMP-1032', NULL, 'Nwaeze', 'Chidinma', 'Nwaeze Chidinma', 'cnwaeze@experiential-edge.com', 'cnwaeze@experiential-edge.com', '+2348066693700', '1988-04-09', 'Married', 'Nigerian', 'Block 73, flat 4, Jakande Estate, Oke-Afa', 'Block 73, Flat 4, Jakande Estate, Oke-Afa', 'Lagos/Oshodi-Isolo', 'Lagos', 'Lagos', NULL, NULL, 'Strategy', 'Senior Strategy and Communication Manager', '2023-02-03', 'Maryland', 'Gloria Iwuh', 'Uchenna Nwaeze', 'Husband', '08104715159', NULL, 'Access Bank', '0033721742', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:47.994Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  33, 1, 33, 'EMP-1033', NULL, 'Okorie', 'kemi', 'Okorie kemi', 'sophiaokoriee@gmail.com', 'sophiaokoriee@gmail.com', '+2347054077721', '1994-10-16', 'Married', 'Nigeria', 'Road1house 19 diamond estate isheri igando', 'Road1 house 19 diamond estate isheri Igando', 'Alimosho local government', 'Lagos state', 'Lagos state', 'Isheri bus-stop', NULL, 'Procurement', 'Procurement', '2025-11-16', 'Maryland Lagos state', 'Dr Ann ogri', 'Okorie Godfrey', 'Husband', '07050956271', NULL, 'Okorie Sophia ajoke', '2135459924', 'Swimming', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.009Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  34, 1, 34, 'EMP-1034', NULL, 'Ekeocha', 'Ebube Christiana', 'Ekeocha Ebube Christiana', 'nicoleekeocha@gmail.com', 'cekeocha@m.experiential-edge.com', '+2349034043158', '1997-04-19', 'Single', 'Nigerian', '15, Prince Jamaica street, Egan-Igando, Lagos.', '15, Prince Jamaica street, Egan-Igando, Lagos', 'Alimosho', 'Lagos State', 'Lagos State', 'Igando BRT busstop', NULL, 'Strategy and Communication', 'Senior Strategy and Account Manager', '2025-07-14', 'Maryland', 'Line Manager - Ms. Gloria Iwuh. However, I receive directives from Mrs. Chidinma Nwaeze too.', 'Mrs. Veronica Ekeocha', 'Mother', '08033614958', 'O+', 'Stanbic Ibtc', '0059294215', 'Reading, learning new skills and listening to music', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Multiple/complex reporting lines in supervisor field', 'Account Created', 'active', '2026-09-17T23:39:48.042Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  35, 1, 35, 'EMP-1035', NULL, 'Albert', 'Rhema', 'Albert Rhema', 'remy.bertt@gmail.com', 'arhema@m.experential-edge.com', '+2347032416493', '1999-12-07', 'Single', 'Nigerian', '4, Bisiriyu Lawal Street, Jaiyeoba, Shasha', '4, Bisiriyu Lawal Street, Jaiyeoba, Shasha', 'Lagos', 'Lagos', 'Lagos', 'Jaiyeoba', NULL, 'Strategy', 'Business Development Strategist', '2025-12-08', 'Onsite', 'Ms. Chidinma Nwaeze', '07036300971', 'Mother', '07036300971', NULL, 'GTBank', '0470317241', 'Reading, Learning, Singing, Business', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.149Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  36, 1, 36, 'EMP-1036', NULL, 'Tochukwu', 'Okonta', 'Tochukwu Okonta', 'tokonta@m.experiential-edge.com', 'tokonta@m.experiential-edge.com', '+2348164809945', '1993-08-17', 'Single', 'Nigeria', 'Ejigbo', '8 Jimoh Oke', 'Ejigbo', 'Delta', 'Delta', 'NNPC', NULL, 'Strategy', 'Strategist', '1993-06-03', 'Remote', 'Ms Gloria', 'Grace ifeoma', 'Sister', '08028101028', NULL, 'Zenith', '2468440950', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.245Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  37, 1, 37, 'EMP-1037', NULL, 'Feyifoluwa', 'Oluwatosin', 'Feyifoluwa Oluwatosin', 'oluwatosinfeyifoluwa16@gmail.com', 'femmanuel@m.experiential-edge.com', '+2348163722231', '2002-08-16', 'Single', 'Nigerian', '10, Ogooluwa Ayanbode street, Oke-Ira, Ogba, Lagos.', '10, Ogooluwa Ayanbode street, Oke-Ira, Ogba, Lagos.', 'Lagos', 'Ekiti state', 'Ekiti state', NULL, NULL, 'Strategy', 'Business development strategist', '2025-12-01', '9, Emmanuel Olorunfemi street off ajenifuja Street off college road ogba', 'Miss Glo', '08033960838', 'Mother', '08033960838', NULL, 'Guaranty Trust Bank', '0559528171', 'Football', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.329Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  38, 1, 38, 'EMP-1038', NULL, 'Oshipelu', 'Onaolapo', 'Oshipelu Onaolapo', 'oayorinde@m.experiential-edge.com', 'oayorinde@m.experiential-edge.com', '+2348130714369', '2002-10-26', 'Single', 'Nigerian', 'No. 2 Ogunsehinde street, ketu, Lagos.', 'No. 2 Ogunsehinde street', 'Ketu', 'Ogun/lagos', 'Ogun/lagos', 'Tipper', NULL, 'Strategy', 'Senior Strategy and Operations Manager', '2025-11-10', 'Maryland', 'Ms Glow', '08033333817', 'Bro', '08130714369', 'O+', 'Stanbic IBTC', '0040165476', 'Sleeping', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.355Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  39, 1, 39, 'EMP-1039', NULL, 'Samuel', 'Adeolu Elijah', 'Samuel Adeolu Elijah', 'samueladeolu1133@yahoo.com', 'adeolusamuel640@gmail.com', '+2348142665143', '1992-04-12', 'Married', 'Nigerian', 'Road Safety', 'Road Safety Ogbomosho', 'Ogbomosho South', 'Oyo State', 'Oyo State', 'Road Safety junction', 1, 'Sales', 'Van Sales Rep', '2026-02-01', 'Ognomosho', 'Mr Ayoola', 'Oyekale Timilehin', 'Wife', '08103148550', NULL, 'Zenith Bank plc', '2122564774', 'Business', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.367Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  40, 1, 40, 'EMP-1040', NULL, 'Babatunde', 'Badirudeen', 'Babatunde Badirudeen', 'babatunde@edgedirect2u.com.ng', 'babatunde@edgedirect2u.com.ng', '+447350152791', '1995-10-26', 'Married', 'Nigerian', 'Birmingham, UK', '1, Goodman street', 'Birmingham', 'Ogun state', 'Ogun state', NULL, NULL, 'Information Technology', 'IT Manager', '2023-11-27', 'Remote', 'MD', 'Aderonke Badirudeen', 'Wife', '+44 7350 164925', NULL, 'Wema Bank', '0245946172', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.464Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  41, 1, 41, 'EMP-1041', NULL, 'Diepreye', 'Desmond', 'Diepreye Desmond', 'diepreyeyazzy@gmail.com', 'ddiepreye@m.experiential-edge.com', '+2347054353032', '2002-03-23', 'Single', 'Nigerian', 'Block 8 Flat 5 Airforce base shasha', 'Block 8 Flat 5 Airforce base shasha', 'Lagos', 'Bayelsa', 'Bayelsa', 'Oguntade', NULL, 'Strategy', 'Brand Development strategist', '2025-11-24', '15 Atiba Osborne street mende Maryland, Lagos, Nigeria,', 'Mrs Chidima', 'Mrs Diepreye Dinipere', 'Mother', '07037119544', 'O+', 'Gtbank', '0612300236', 'Art', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.481Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  42, 1, 42, 'EMP-1042', NULL, 'Ayomide', 'Tunji-Bello', 'Ayomide Tunji-Bello', 'ayomidetunjibello@gmail.com', 'oayomide@m.experiential-edge.com', '+2348185306037', '2000-01-19', 'Single', 'Nigerian', '2 fatai close off Hon olufemi adebanjo street Egbeda akowonjo Lagos', 'No 2 Fatai Close Off Hon Olufemi Adebanjo Street Egbeda Akowonjo Lagos', 'Alimosho', 'Oyo /Lagos', 'Oyo /Lagos', 'Vulcanizer', NULL, 'Strategy', 'Strategy and operations manager', '2025-11-10', 'Maryland', 'MD', 'Tunji-Bello Oyeniyi', 'Brother', '08072610140', 'A positive', 'Tunji-Bello Ayomide Oyelowo', '0361280104', 'Listen to music , traveling,', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.514Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  43, 1, 43, 'EMP-012', '012', 'Idowu', 'Jeremiah Olurakinyo', 'Idowu Jeremiah Olurakinyo', 'idowuolurakinyo1@gmail.com', 'iolurakinyo.m-edge.com', '+2348033753322', '1981-02-18', 'Married', 'Nigeria', '6, Progressive Close Obabiyi Olambe Akute-Lagos', '6, Progressive Close', 'Akute-Ifo', 'Ondo State/Lagos', 'Ondo State/Lagos', 'Lambe Junction', NULL, 'Finance Department', 'Finance Manager', '2025-01-10', 'Maryland Office', 'Mrs Vivian-MD', 'Mrs Bola A. Olurakinyo', 'Wife', '07061981142', 'O', 'Zenith Bank', '4234743801', 'Football/Reading', 'ACCOUNTANT', FALSE, '', 'Account Created', 'active', '2026-09-17T23:39:48.529Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  44, 1, 44, 'EMP-1044', NULL, 'QUEEN', 'ADJOGRI', 'QUEEN ADJOGRI', 'queendavid2222@gmail.com', 'queendavid2222@gmail.com', '+2348021275017', '2002-09-19', 'Single', 'Nigerian', 'Egbeda, Lagos', 'Odo eran, Egbeda', 'Lagos/Alimosho LGA', 'Delta State/ Lagos State', 'Delta State/ Lagos State', 'Pab Bus Stop', NULL, 'E edge direct2u', 'Warehouse Operation- Stock control Intern', '2026-01-21', '9 Emmanuel Olorunfemi str Ogba, Lagos', 'Miss Lynda', 'Blessing Adjogri', 'Sister', '+234 808 036 3531', '0+', 'Zenith Bank', '2256266458', 'Reading Novels', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.575Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  45, 1, 45, 'EMP-1045', NULL, 'Ndidiamaka', 'Ekwueme', 'Ndidiamaka Ekwueme', 'ndidiie@gmail.com', 'nekueme@m.experiential-edge.com', '+2349056871570', '1980-07-08', 'Married', 'Nigerian', '12 Ojelade Street, Fadeyi', '12 Ojelade Street, Fadeyi', 'Mushin/ Lagos', 'Anambra/', 'Anambra/', 'Agip Bus', NULL, 'Accounts/Strategy', 'Business/Account Manager', '2024-10-07', 'Maryland', 'Chidimma Nwaeze', 'Gogo Sofiri Peterside', 'Husband', '07035412747', '0+', 'GTB', '0010646501', 'Sight seeing', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.592Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  46, 1, 46, 'EMP-1046', NULL, 'Peter', 'Obie', 'Peter Obie', 'obiepeter2@gmail.com', 'opeter@m.experiential-edge.com', '+2347010759243', '1984-09-30', 'Married', 'Nigerian', '321 road g close house 8 Festac town Lagos', '321 road g close house 8 Festac town', 'Amuwo-Odofin', 'Lagos', 'Lagos', NULL, NULL, 'Design', 'Creative Designer', '2025-11-07', 'Remote', 'Gloria', 'Winifred obie', 'Wife', '0803 596 0847', 'NA', 'GT bank', '0107058406', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.648Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  47, 1, 47, 'EMP-1047', NULL, 'BALA', 'LISAG KOSY', 'BALA LISAG KOSY', 'princesskbala31@gmail.com', 'princesskbala31@gmail.com', '+2348063371005', '2000-07-22', 'Single', 'Nigerian', '23 mopol barracks behind police workshop off mobolaji bank Anthony way ikeja', '23 mopol barracks behind police workshop off mobolaji bank Anthony way ikeja', 'Ikeja', 'Kaduna', 'Kaduna', NULL, NULL, 'Warehouse Operations', 'Assistant', '2026-02-03', 'No 9 Emmanuel Olorunfemi street. Ogba', 'Mr Theophilus Ayodeji', '08034346517', 'Mother', '08122286586', 'O+', 'First City Monument Bank(FCMB)', '4310688016', 'Movies', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.694Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  48, 1, 48, 'EMP-1048', NULL, 'Ogiri', 'Ann', 'Ogiri Ann', 'annogiri22@gmail.com', 'aogiri@m.experiential-edge.com', '+2348022536606', '1987-04-22', 'Single', 'Nigerian', 'War College Quarters Gwarimpa Abuja', 'War College Quarters Gwarimpa Abuja', 'Yala', 'Cross River', 'Cross River', NULL, NULL, 'Procurement', 'Senior Procurement Manager', '2024-10-23', 'Abuja', 'Vivian Osigweh', '08060873342', 'Sister', '08060873342', 'O+', 'Access bank', '0025493926', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.738Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  49, 1, 49, 'EMP-1049', NULL, 'Daniel', 'Zabe', 'Daniel Zabe', 'zabedaniel8@gmail.com', 'zabedaniel8@gmail.com', '+2348129292596', '1995-03-25', 'Single', 'Nigeria', 'Road 2 1A Diamond Estate Igando', 'Road 1A Diamond Estate Igando', 'Lagos Alimosho', 'Bauchi state', 'Bauchi state', NULL, NULL, 'Procurement', 'Procurement', '2026-01-12', 'Atiba Osborne 15', 'Loveday', '0812 601 7260', 'Brother', '0812 601 7260', 'O+', 'Zabe Daniel', '2105297756', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.753Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  50, 1, 50, 'EMP-1050', NULL, 'Ewuoso', 'Ayoola Joseph', 'Ewuoso Ayoola Joseph', 'ewuoso53@gmail.com', 'ewuoso53@gmail.com', '+2348064852972', '1986-09-17', 'Married', 'Nigeria', 'No 7 seye ogunsina close, new airport, alakia, ibadan', 'No 7 seye ogunsina close, nw airport', 'Ibadan', 'Ogun/oyo', 'Ogun/oyo', 'New airport', NULL, 'Sales and marketing', 'Regional sales manager', '2025-11-24', 'Ibadan', 'Mrs vivian', 'Ogunsina funmike', 'Wife', '07069606688', NULL, 'Access Bank', '0067979913', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:48.769Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  51, 1, 51, 'EMP-1051', NULL, 'Odesina', 'Ayodeji Oluwaseye', 'Odesina Ayodeji Oluwaseye', 'odesinaseye@gmail.com', 'odesinaseye@gmail.com', '+2348033565543', '1985-08-23', 'Married', 'Nigerian', 'Ayandokun Compound behind Abiodun Atiba Grammar School Kosobo area, Oyo', 'Ayandokun Compound behind Abiodun Atiba Grammar School Kosobo area, Oyo', 'Oyo/ Oyo East', 'Oyo State', 'Oyo State', 'Durbar Police station', NULL, 'Regional Sales manager', 'VSR', '2025-11-25', 'Oyo town', 'Mr Ayoola', '08132527432', 'Wife', '08057833148', 'B+', 'GTB', '0845111036', 'Football', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.861Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  52, 1, 52, 'EMP-1052', NULL, 'Adekunle', 'Opeyemi', 'Adekunle Opeyemi', 'goldsmile2000@gmail.com', 'goldsmile2000@gmail.com', '+2349150954593', '2001-08-13', 'Single', 'Nigerian', '36 oduduwa street, Oworoshoki lagos', 'Hse 9, Rd 1 lekki Atlantic garden, Ajah Lagos', 'Eti osa', 'Oyo state', 'Oyo state', 'Lekki garden phase 4', 3, 'Human resources', 'Admin and facility officer', '2026-02-02', 'Maryland', 'Mr Adedoyin', 'Yinka', 'Sister', '08133723804', 'B+', 'UBA', '2386005862', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.881Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  53, 1, 53, 'EMP-1053', NULL, 'Simon', 'Hezekiah', 'Simon Hezekiah', 'simonhezekiah67@gmail.com', 'simonhezekiah67@gmail.com', '+2349077803201', '1997-08-24', 'Single', 'Nigerian', 'No 7, Adebayo street, peace avenue, araromi bus stop. Adiyan, Ogun state', 'No 9, Adebayo street,peace avenue, araromi bus stop, Adiyan ,Ogun state', 'Adiyan', 'Akwaibom state/ Ogun state', 'Akwaibom state/ Ogun state', 'Agbado Oja', NULL, 'Modern Trade', 'Logistics Executive', '2025-10-06', 'Maryland', 'Mrs Chidinma Mordi', '+234 902 007 9467', 'Mother', '0913 755 8229', 'O+', 'Access Bank', '1834001540', 'Cooking', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.946Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  54, 1, 54, 'EMP-1054', NULL, 'ORJI', 'MICHAEL UCHECHI', 'ORJI MICHAEL UCHECHI', 'michaeorji222@gmail.com', 'michaeorji222@gmail.com', '+2349017542793', '2002-05-20', 'Single', 'NIGERIAN', '23, BAJULAYE SREET, SHOMOLU', '23, BAJULAYIE STREET', 'SHOMOLU/LAGOS', 'ABIA/BENDE', 'ABIA/BENDE', 'ONIPANU', NULL, 'CREATIVE', 'SOCIAL MEDIA/ GRAPHICS DESIGNER', '2026-02-12', 'MARYLAND', 'Head Of Creative', 'ORJI MICHAEL UCHECHI', 'BROTHER', '08038908818', '0-', 'Guaranty Trust Bank (GTB)', '0595274519', 'reading', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:48.966Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  55, 1, 55, 'EMP-1055', NULL, 'Jonah', 'Daniel Agada', 'Jonah Daniel Agada', 'dannyjagas03@gmail.com', 'dannyjagas03@gmail.com', '+2347019147585', '1982-04-03', 'Married', 'Nigeria', '25 Fasali street Abar', '25 fasali street Abaranji ikotun lagos', 'Alimosho', 'Kogi state', 'Kogi state', 'Agbaduma Allom opposite UEC church', NULL, 'Driving', 'SUPERNUMERARY POLICE', '2026-01-21', 'Maryland', 'MR LOVEDAY', '0705 407 0771', 'Brother', '0705 407 0771', 'AA', 'Zenith Bank', '2282251026', 'Driving', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.061Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  56, 1, 56, 'EMP-1056', NULL, 'Chiamaka', 'Favour', 'Chiamaka Favour', 'chiamakacf4286046@gmail.com', 'chiamakacf4286046@gmail.com', '+2348037486841', '1989-01-04', 'Married', 'Nigerian', 'Igando', 'Igando', 'Alimosho', 'Abia state', 'Abia state', 'Igando', NULL, 'Househelp', 'Househelp', '2024-12-02', 'Igando', 'MD', 'Chukwu', 'Brother', '+234 806 848 6193', 'No idea', 'Uba', '2356669429', 'Music', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation); Blood group unconfirmed', 'Account Created', 'active', '2026-09-17T23:39:49.077Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  57, 1, 57, 'EMP-1057', NULL, 'David', 'Oyedepo', 'David Oyedepo', 'tosinoyedepo5@gmail.com', 'davidoyedepo@eedge', '+2349077689952', '1977-07-13', 'Married', 'Nigerian', '12,Soore Close Orile Agege Lagos off jibowu street', '12, Soore Close Orile Agege off Old Ota Road', 'Orile Agege', 'Kwara/Lagos', 'Kwara/Lagos', 'Ilepo Bus stop', NULL, 'E-Edge Direct 2 you', 'VSR', '2021-11-12', 'Surulere', 'Valentine', '08125546996', 'Wife', '08125546996', 'O+', 'Opay', '08178044846', 'Basketball', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.128Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  58, 1, 58, 'EMP-1058', NULL, 'Prince', 'Donald', 'Prince Donald', 'princedonald34@gmail.com', 'princedonald34@gmail.com', '+2348104590850', '2003-10-23', 'Single', 'Nigeria', 'No 31 onajimi street off Pedro road bariga', 'No 31 onajimi street off Pedro road bariga', 'Bariga', 'Abia state / Lagos', 'Abia state / Lagos', 'Onajimi street', NULL, 'Human Resource', 'HR / operations and capability executive', '2026-03-16', '15 Atiba Osborne street', 'Loveday lucky', 'Chief Emeka peters', 'Cousin', '+234 803 070 4448', 'O+', 'First bank plc', '3186057707', NULL, 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.146Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  59, 1, 59, 'EMP-1059', NULL, 'Chidinma', 'Mordi (Obidiegwu)', 'Chidinma Mordi (Obidiegwu)', 'chidima.obidiegwu@gmail.com', 'ochidinma@edgedirect2u.com.ng', '+2348037674270', '1986-11-26', 'Married', 'Nigerian', 'No. 31B surulere street, Alagbole', 'No. 31B surulere street, Alagbole', 'Ogun state', 'Anambra /Ogun state', 'Anambra /Ogun state', NULL, NULL, 'Supply Chain/ Distribution', 'Customer services & Warehouse Manager', '2024-10-14', 'Maryland', 'Mrs Vivian Osigweh (MD)', 'Mr Nkem Mordi', 'Husband', '08064829379', 'AB+', 'Keystone bank', '6020627995', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.211Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  60, 1, 60, 'EMP-1060', NULL, 'Uke-Ulim', 'Ekunke-Ogah', 'Uke-Ulim Ekunke-Ogah', 'ogahuke@gmail.com', 'uogah@m.experiential-edge.com', '+2348037169208', '1992-09-07', 'Married', 'Nigerian', '296 Murtala Muhammed Way, Yaba. Lagos', '296 Murtala Muhammed Way, Yaba, Lagos Mainland.', 'Lagos', NULL, NULL, 'Alagomeji/ Mobolaji Johnson Railway Station', NULL, 'Strategy/Accounts', 'Senior Strategy and Account Manager', '2026-04-01', 'Mende/Maryland', 'ED - Mrs Vivian Osigwe', 'Toritsefe Aigbedion', 'Family friend', '0902 231 8723', 'O+', 'Zenith Bank PLC', '1005096128', NULL, 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.231Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  61, 1, 61, 'EMP-1061', NULL, 'Ajayi', 'Adedayo', 'Ajayi Adedayo', 'dedasco11@gmail.com', 'aajayi@m.experiential-edge.com', '+2348140079684', '1995-02-08', 'Single', 'Nigerian', '17 Oyemomilara, Off command road, Ile iwe bus stop.', '17, Oyemomilara street, Meiran Lagos', 'Meiran', 'Ekiti', 'Ekiti', 'Ile iwe bus stop, Command', NULL, 'Human Resource', 'HR Manager', '2026-03-30', 'Ikeja, Maryland', 'MD', '08163182050', 'Single', '08140079784', 'OO+', 'Opay', '8140079684', NULL, 'HR', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.287Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  62, 1, 62, 'EMP-1062', NULL, 'Ademola', 'Famade', 'Ademola Famade', 'adetopemi@gmail.com', 'adetopemi@gmail.com', '+2348028487667', '1971-04-16', 'Married', 'Nigerian', '3, Platinum Street, God''s Own Estate, Elepete, Ikorodu', '3, Platinum Street, God''s Own Estate, Elepete, Ikorodu', 'Ikorodu', 'Lagos', 'Lagos', 'Transformer Bustop', 4, 'Finance', 'Head of Finance', '2026-04-07', 'Maryland', 'Managing Director', 'Ademola Famade', 'Self', '08028487667', 'AA', 'Wema Bank', '0121553763', 'Farming', 'ACCOUNTANT', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.313Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  63, 1, 63, 'EMP-1063', NULL, 'Lawal', 'Olufemi Jamiu', 'Lawal Olufemi Jamiu', 'lawalolufemijamiu@gmail.com', 'lolufemi@m.experiential-edge.com', '+2348130155784', '1989-05-05', 'Married', 'Nigeria', 'No 5, Itun Dega Quarters, Erinlu Ijebu Ode, Ogun State', 'No 5, Itun Dega Quarters, Erinlu Ijebu Ode, Ogun State', 'Ijebu/ Ijebu Ode', 'Ogun / Ogun', 'Ogun / Ogun', NULL, NULL, 'Human Resource', 'Logistics/Fleet Manager', '2026-04-13', 'Maryland', 'MD', '07055543374', 'Brother', '07055543374', 'A+', 'UBA', '2296314449', 'Travelling', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.398Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  64, 1, 64, 'EMP-1064', NULL, 'Chiedozie', 'Joseph Orji', 'Chiedozie Joseph Orji', 'chiedozieorji7@gmail.com', 'corji@m.experiential-edge.com', '+2348068349700', '1982-03-14', 'Married', 'Nigerian', '20, Diffri road abaranje ikotun', '20, Diffri road abaranje ikotun', 'Ikotun alimosho', 'Enugu State', 'Enugu State', NULL, NULL, 'Operations', 'Project executive', '2026-05-04', 'Maryland', 'Chiedozie Joseph Orji', 'Benita chiedozie', 'Spouse', '081375333020', 'O', 'GTB', '0041943284', 'Traveling, farming and electrical hardware', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.451Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  65, 1, 65, 'EMP-1065', NULL, 'Amadi', 'Amobi Elias', 'Amadi Amobi Elias', 'amad17amobi@gmail.com', 'aelias@m.experiential-edge.com', '+2348021190284', '1980-02-09', 'Married', 'Nigeria', 'Road 2 house 1 Diamond estate isheri olofin Alimosho Lagos', 'Road 2 house 1 Diamond estate isheri olofin Alimosho', 'Alimosho', 'Lagos', 'Lagos', 'Diamond', NULL, 'Operations', 'Senior project & Operations Manager', '2026-05-04', 'Lagos', 'MD', 'Amadi Anita odinakachukwu', 'Sister', '08121194621', 'O+', 'Amadi Amobi Elias', '6000056636', 'Football, reading, travelling and music', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.477Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  66, 1, 66, 'EMP-1066', NULL, 'Abdulfatai', 'Abdulsalami', 'Abdulfatai Abdulsalami', 'aabdulsslami424@gmail.com', 'abdulsalami424@gmail.com', '+2347086546219', '1975-02-13', 'Married', 'Nigerian', '17 oyinbo orunmila street unity estate ojodu', '17 oyinbo orunmila unity estate ojodu', 'ikeja', 'kogi', 'kogi', 'Grammar school ojodu', NULL, 'Sales4', 'ASM', '2026-05-04', 'lagos', 'MD', 'Faisal lawal', 'friends', '08143240257', 'AA', 'zenith bank', '2001743672', 'Reading and jogging', 'STAFF', TRUE, 'Missing official Staff ID (flagged for HR generation)', 'Account Created', 'active', '2026-09-17T23:39:49.512Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  67, 1, 67, 'EMP-1067', NULL, 'Okoye', 'Favour Chidinma', 'Okoye Favour Chidinma', 'okoyefavour16@gmail.com', NULL, '+2349012133017', '2003-12-22', 'Single', 'Nigerian', 'No 6 dapson road , okeira ogba Lagos state', 'No 6 dapson road okeira ogba Lagos state', 'Ogba/ifako Ijaiye local government', 'Anambra/ Lagos', 'Anambra/ Lagos', 'Ogba bus stop', NULL, 'Operation and Account department', 'Account manager', '2026-05-11', '15 Atiba Mende Maryland', 'Madam Chidinma', '08075584571', 'Single', '09012133017', 'O+', 'United bank of Africa', '2366011740', 'Watching movies', 'MANAGER', TRUE, 'Missing official Staff ID (flagged for HR generation); Work email not yet assigned', 'Account Created', 'active', '2026-09-17T23:39:49.537Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

INSERT INTO public.employees (
  id, company_id, user_id, employee_code, staff_id, first_name, last_name, full_name, personal_email, work_email,
  phone, date_of_birth, marital_status, nationality, address, home_address, city_lga, state_of_origin, state_of_residence,
  landmark, department_id, department, position, date_of_joining, work_location, supervisor_name,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, blood_group, bank_name,
  account_number, hobbies_interests, rank_code, flagged_for_review, review_reason, onboarding_status, status, created_at
) VALUES (
  68, 1, 68, 'EMP-3856', NULL, 'Babatunde', 'Babs', 'Babatunde Babs', 'babs@m.experiential-edge.com', 'babs@m.experiential-edge.com', '+2347037924200', '1995-05-15', NULL, 'Nigerian', '15 Atiba Osborne, Mende, Maryland, Lagos', NULL, NULL, NULL, NULL, NULL, 1, 'Technology & IT', 'CTO', NULL, 'Lagos - Ikeja', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'IT_ADMIN', FALSE, NULL, 'Account Created', 'active', '2026-09-18T00:01:38.515Z'
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  personal_email = EXCLUDED.personal_email,
  work_email = EXCLUDED.work_email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  marital_status = EXCLUDED.marital_status,
  nationality = EXCLUDED.nationality,
  address = EXCLUDED.address,
  home_address = EXCLUDED.home_address,
  city_lga = EXCLUDED.city_lga,
  state_of_origin = EXCLUDED.state_of_origin,
  state_of_residence = EXCLUDED.state_of_residence,
  landmark = EXCLUDED.landmark,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  date_of_joining = EXCLUDED.date_of_joining,
  work_location = EXCLUDED.work_location,
  supervisor_name = EXCLUDED.supervisor_name,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  blood_group = EXCLUDED.blood_group,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  status = EXCLUDED.status,
  onboarding_status = EXCLUDED.onboarding_status;

-- 4. RESET SEQUENCE COUNTERS
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 1));
SELECT setval(pg_get_serial_sequence('public.employees', 'id'), COALESCE((SELECT MAX(id) FROM public.employees), 1));

COMMIT;
