-- Staff HR profile columns for the numbered EdgeWForce schema.
-- The current RLS policies are managed by later migrations.
BEGIN;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS staff_id TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS work_email TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Nigerian',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS home_address TEXT,
  ADD COLUMN IF NOT EXISTS city_lga TEXT,
  ADD COLUMN IF NOT EXISTS state_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS state_of_residence TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS department_raw TEXT,
  ADD COLUMN IF NOT EXISTS date_of_joining TEXT,
  ADD COLUMN IF NOT EXISTS work_location TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS hobbies_interests TEXT,
  ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'Account Created',
  ADD COLUMN IF NOT EXISTS raw_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_staff_id ON public.employees (staff_id);
CREATE INDEX IF NOT EXISTS idx_employees_work_email ON public.employees (work_email);
CREATE INDEX IF NOT EXISTS idx_employees_personal_email ON public.employees (personal_email);
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees (phone);

DO $migration$
BEGIN
  IF to_regclass('public.public_employee_directory') IS NULL THEN
    EXECUTE $view$
      CREATE VIEW public.public_employee_directory
      WITH (security_invoker = true)
      AS
      SELECT
        id,
        employee_code,
        staff_id,
        first_name,
        last_name,
        COALESCE(full_name, NULLIF(concat_ws(' ', first_name, last_name), '')) AS full_name,
        position AS job_title,
        department,
        COALESCE(work_email, personal_email) AS work_email,
        phone AS work_phone,
        supervisor_name,
        work_location,
        status
      FROM public.employees
      WHERE status = 'active'
    $view$;
  END IF;
END
$migration$;

COMMIT;
