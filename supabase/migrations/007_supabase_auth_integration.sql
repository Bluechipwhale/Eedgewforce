-- ==============================================================================
-- EDGEWFORCE - SUPABASE AUTH INTEGRATION & IDENTITY LINKING (007_supabase_auth_integration.sql)
-- Connects Supabase Auth (auth.users) directly to public.users & public.employees
-- ==============================================================================

-- 1. ADD AUTH_USER_ID FOREIGN KEYS
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_employees_work_email_lower ON public.employees(LOWER(work_email));
CREATE INDEX IF NOT EXISTS idx_employees_personal_email_lower ON public.employees(LOWER(personal_email));

-- 3. AUTO-LINKING TRIGGER FOR NEW SUPABASE AUTH USERS
-- Automatically links auth_user_id when an auth.users record is created matching an existing staff email
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    matching_user_id BIGINT;
    matching_emp_id BIGINT;
BEGIN
    -- Look for matching record in public.users by email
    SELECT id INTO matching_user_id
    FROM public.users
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF matching_user_id IS NOT NULL THEN
        UPDATE public.users
        SET auth_user_id = NEW.id,
            updated_at = NOW()
        WHERE id = matching_user_id;

        UPDATE public.employees
        SET auth_user_id = NEW.id,
            updated_at = NOW()
        WHERE user_id = matching_user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. GRANULAR ROW LEVEL SECURITY POLICIES FOR SUPABASE AUTH TOKENS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Remove earlier policies that cast Supabase UUID subjects to bigint.
DROP POLICY IF EXISTS "HR and Admins have full access on employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employees;
DROP POLICY IF EXISTS "Employees can update their own profile" ON public.employees;

-- Users table policies
DROP POLICY IF EXISTS "Users can read their own account" ON public.users;
CREATE POLICY "Users can read their own account" ON public.users
FOR SELECT USING (
    auth_user_id = auth.uid() OR
    (auth.jwt() ->> 'role' IN ('service_role', 'SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'CEO'))
);

DROP POLICY IF EXISTS "Users can update their own account" ON public.users;
CREATE POLICY "Users can update their own account" ON public.users
FOR UPDATE USING (
    auth_user_id = auth.uid() OR
    (auth.jwt() ->> 'role' IN ('service_role', 'SUPER_ADMIN', 'ADMIN'))
);

-- Employees table policies
DROP POLICY IF EXISTS "Employees can view own record via auth_user_id" ON public.employees;
CREATE POLICY "Employees can view own record via auth_user_id" ON public.employees
FOR SELECT USING (
    auth_user_id = auth.uid() OR
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' IN ('service_role', 'SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'CEO'))
);

DROP POLICY IF EXISTS "Employees can update own record via auth_user_id" ON public.employees;
CREATE POLICY "Employees can update own record via auth_user_id" ON public.employees
FOR UPDATE USING (
    auth_user_id = auth.uid() OR
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    (auth.jwt() ->> 'role' IN ('service_role', 'SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER'))
);
