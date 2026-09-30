-- Repair installations that used the earlier migration bundle. Never reseed staff.
BEGIN;

DO $$
DECLARE
  col RECORD;
BEGIN
  -- Older 011/012 files retained NOT NULL on retired numeric references.
  FOR col IN
    SELECT old.table_name, old.column_name
    FROM information_schema.columns old
    JOIN information_schema.columns current_col
      ON current_col.table_schema = old.table_schema
      AND current_col.table_name = old.table_name
      AND current_col.column_name = substring(old.column_name FROM 8)
      AND current_col.data_type = 'uuid'
    WHERE old.table_schema = 'public' AND old.column_name LIKE 'legacy\_%' ESCAPE '\'
      AND old.is_nullable = 'NO'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', col.table_name, col.column_name);
  END LOOP;
END;
$$;

-- These superseded policies can be left behind by manual legacy SQL execution.
DROP POLICY IF EXISTS "HR and Admins have full access on employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employees;
DROP POLICY IF EXISTS "Employees can update their own profile" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own record via auth_user_id" ON public.employees;
DROP POLICY IF EXISTS "Employees can update own record via auth_user_id" ON public.employees;
DROP POLICY IF EXISTS "Users can read their own account" ON public.users;
DROP POLICY IF EXISTS "Users can update their own account" ON public.users;

-- Older installations created this view with the default definer semantics.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'public_employee_directory'
      AND c.relkind = 'v'
  ) THEN
    ALTER VIEW public.public_employee_directory SET (security_invoker = true);
  END IF;
END;
$$;

UPDATE public.employees e
SET auth_user_id = u.auth_user_id
FROM public.users u
WHERE e.user_id = u.uuid AND e.auth_user_id IS NULL AND u.auth_user_id IS NOT NULL;

-- Restore UUID-aware linking even if a legacy Auth script was run manually.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  matching_user_uuid UUID;
BEGIN
  SELECT u.uuid INTO matching_user_uuid FROM public.users u
  WHERE lower(u.email) = lower(NEW.email) LIMIT 1;
  IF matching_user_uuid IS NOT NULL THEN
    UPDATE public.users SET auth_user_id = NEW.id, updated_at = now()
    WHERE uuid = matching_user_uuid;
    UPDATE public.employees SET auth_user_id = NEW.id, updated_at = now()
    WHERE user_id = matching_user_uuid;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;
