-- ==============================================================================
-- EDGEWFORCE - STAFF HR MANAGEMENT, PROFILE EXPANSION & GRANULAR RLS (005_staff_hr_management_and_rls.sql)
-- ==============================================================================

-- 1. EXTEND EMPLOYEES TABLE
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_email TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Nigerian';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS city_lga TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS state_of_origin TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS state_of_residence TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department_raw TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS date_of_joining TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_location TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS hobbies_interests TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created';

-- 2. EXTEND USERS TABLE
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS raw_phone TEXT;

-- 3. CREATE HR AUDIT LOGS INDEXES
CREATE INDEX IF NOT EXISTS idx_employees_staff_id ON public.employees(staff_id);
CREATE INDEX IF NOT EXISTS idx_employees_work_email ON public.employees(work_email);
CREATE INDEX IF NOT EXISTS idx_employees_personal_email ON public.employees(personal_email);
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);

-- 4. PUBLIC EMPLOYEE DIRECTORY PROJECTION (Safe for normal employee view)
CREATE OR REPLACE VIEW public.public_employee_directory AS
SELECT
    id,
    employee_code,
    staff_id,
    first_name,
    last_name,
    COALESCE(full_name, first_name || ' ' || last_name) AS full_name,
    position AS job_title,
    department,
    COALESCE(work_email, personal_email) AS work_email,
    phone AS work_phone,
    supervisor_name,
    work_location,
    status
FROM public.employees
WHERE status = 'active';

-- 5. GRANULAR ROW-LEVEL SECURITY POLICIES
-- HR & Super Admin can read and write all employee rows
DROP POLICY IF EXISTS "HR and Admins have full access on employees" ON public.employees;
CREATE POLICY "HR and Admins have full access on employees" ON public.employees
FOR ALL USING (
    (auth.jwt() ->> 'role' IN ('service_role', 'SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'CEO')) OR
    ((SELECT role_code FROM public.users WHERE id = (auth.jwt() ->> 'sub')::bigint) IN ('SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'CEO'))
);

-- Employees can read their own complete profile
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employees;
CREATE POLICY "Employees can view their own profile" ON public.employees
FOR SELECT USING (
    user_id = (auth.jwt() ->> 'sub')::bigint
);

-- Employees can update their own non-sensitive profile information
DROP POLICY IF EXISTS "Employees can update their own profile" ON public.employees;
CREATE POLICY "Employees can update their own profile" ON public.employees
FOR UPDATE USING (
    user_id = (auth.jwt() ->> 'sub')::bigint
);
