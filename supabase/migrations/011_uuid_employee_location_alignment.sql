-- =============================================================================
-- EDGEWFORCE - MIGRATION 011: UUID EMPLOYEE LOCATION ALIGNMENT
-- Safely moves workplace assignment employee references from legacy bigint ids to
-- stable UUID identifiers without dropping the legacy numeric values.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add stable UUID identities beside any existing bigint employee/user ids.
--    This avoids a destructive primary-key rewrite while giving new code a UUID
--    target for Supabase-safe employee references.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS uuid UUID;

DO $$
DECLARE
  employee_id_type TEXT;
BEGIN
  SELECT data_type
  INTO employee_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'id';

  IF employee_id_type = 'uuid' THEN
    UPDATE public.employees
    SET uuid = COALESCE(uuid, id, auth_user_id, gen_random_uuid())
    WHERE uuid IS NULL;
  ELSE
    UPDATE public.employees
    SET uuid = COALESCE(uuid, auth_user_id, gen_random_uuid())
    WHERE uuid IS NULL;
  END IF;
END $$;

ALTER TABLE public.employees
  ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_uuid_unique
  ON public.employees(uuid);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS uuid UUID;

DO $$
DECLARE
  user_id_type TEXT;
BEGIN
  SELECT data_type
  INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'id';

  IF user_id_type = 'uuid' THEN
    UPDATE public.users
    SET uuid = COALESCE(uuid, id, auth_user_id, gen_random_uuid())
    WHERE uuid IS NULL;
  ELSE
    UPDATE public.users
    SET uuid = COALESCE(uuid, auth_user_id, gen_random_uuid())
    WHERE uuid IS NULL;
  END IF;
END $$;

ALTER TABLE public.users
  ALTER COLUMN uuid SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid_unique
  ON public.users(uuid);

COMMENT ON COLUMN public.employees.uuid IS
  'Stable UUID public identifier used by Supabase-facing features. Legacy bigint id is preserved where present.';

-- 2. Remove dependent policies/indexes before reshaping assignment columns.
DROP POLICY IF EXISTS employee_location_assignments_tenant_isolation ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_read_access ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_write ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_insert ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_update ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_delete ON public.employee_location_assignments;
DROP POLICY IF EXISTS "Service role full access on employee_location_assignments" ON public.employee_location_assignments;

DROP POLICY IF EXISTS location_assignment_history_tenant_isolation ON public.location_assignment_history;
DROP POLICY IF EXISTS location_assignment_history_read_access ON public.location_assignment_history;
DROP POLICY IF EXISTS "Service role full access on location_assignment_history" ON public.location_assignment_history;

DROP INDEX IF EXISTS public.idx_emp_loc_assign_employee;
DROP INDEX IF EXISTS public.idx_emp_loc_assign_active;
DROP INDEX IF EXISTS public.idx_loc_history_employee;
DROP INDEX IF EXISTS public.idx_one_active_primary_location_per_employee;

-- 3. Convert employee_location_assignments.employee_id to UUID when it is still
--    bigint/text. The old value is retained in legacy_employee_id for audit and
--    rollback comfort.
DO $$
DECLARE
  column_type TEXT;
  fk_name TEXT;
  missing_count BIGINT;
BEGIN
  SELECT data_type
  INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'employee_location_assignments'
    AND column_name = 'employee_id';

  IF column_type IS NOT NULL AND column_type <> 'uuid' THEN
    ALTER TABLE public.employee_location_assignments
      ADD COLUMN IF NOT EXISTS employee_uuid UUID;

    UPDATE public.employee_location_assignments AS a
    SET employee_uuid = e.uuid
    FROM public.employees AS e
    WHERE a.employee_uuid IS NULL
      AND a.employee_id::TEXT = e.id::TEXT;

    UPDATE public.employee_location_assignments AS a
    SET employee_uuid = e.uuid
    FROM public.employees AS e
    WHERE a.employee_uuid IS NULL
      AND e.user_id IS NOT NULL
      AND a.employee_id::TEXT = e.user_id::TEXT;

    SELECT COUNT(*)
    INTO missing_count
    FROM public.employee_location_assignments
    WHERE employee_uuid IS NULL;

    IF missing_count > 0 THEN
      RAISE EXCEPTION 'Cannot migrate employee_location_assignments.employee_id to UUID: % row(s) could not be mapped to public.employees.uuid.', missing_count;
    END IF;

    FOR fk_name IN
      SELECT con.conname
      FROM pg_constraint AS con
      JOIN pg_attribute AS att
        ON att.attrelid = con.conrelid
       AND att.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'public.employee_location_assignments'::REGCLASS
        AND con.contype = 'f'
        AND att.attname = 'employee_id'
    LOOP
      EXECUTE format('ALTER TABLE public.employee_location_assignments DROP CONSTRAINT %I', fk_name);
    END LOOP;

    ALTER TABLE public.employee_location_assignments
      RENAME COLUMN employee_id TO legacy_employee_id;

    ALTER TABLE public.employee_location_assignments
      ALTER COLUMN legacy_employee_id DROP NOT NULL;

    ALTER TABLE public.employee_location_assignments
      RENAME COLUMN employee_uuid TO employee_id;

    ALTER TABLE public.employee_location_assignments
      ALTER COLUMN employee_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.employee_location_assignments'::REGCLASS
      AND conname = 'employee_location_assignments_employee_uuid_fkey'
  ) THEN
    ALTER TABLE public.employee_location_assignments
      ADD CONSTRAINT employee_location_assignments_employee_uuid_fkey
      FOREIGN KEY (employee_id)
      REFERENCES public.employees(uuid)
      ON DELETE CASCADE
      NOT VALID;

    ALTER TABLE public.employee_location_assignments
      VALIDATE CONSTRAINT employee_location_assignments_employee_uuid_fkey;
  END IF;
END $$;

-- 4. Convert location_assignment_history.employee_id the same way.
DO $$
DECLARE
  column_type TEXT;
  fk_name TEXT;
  missing_count BIGINT;
BEGIN
  SELECT data_type
  INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'location_assignment_history'
    AND column_name = 'employee_id';

  IF column_type IS NOT NULL AND column_type <> 'uuid' THEN
    ALTER TABLE public.location_assignment_history
      ADD COLUMN IF NOT EXISTS employee_uuid UUID;

    UPDATE public.location_assignment_history AS h
    SET employee_uuid = e.uuid
    FROM public.employees AS e
    WHERE h.employee_uuid IS NULL
      AND h.employee_id::TEXT = e.id::TEXT;

    UPDATE public.location_assignment_history AS h
    SET employee_uuid = e.uuid
    FROM public.employees AS e
    WHERE h.employee_uuid IS NULL
      AND e.user_id IS NOT NULL
      AND h.employee_id::TEXT = e.user_id::TEXT;

    SELECT COUNT(*)
    INTO missing_count
    FROM public.location_assignment_history
    WHERE employee_uuid IS NULL;

    IF missing_count > 0 THEN
      RAISE EXCEPTION 'Cannot migrate location_assignment_history.employee_id to UUID: % row(s) could not be mapped to public.employees.uuid.', missing_count;
    END IF;

    FOR fk_name IN
      SELECT con.conname
      FROM pg_constraint AS con
      JOIN pg_attribute AS att
        ON att.attrelid = con.conrelid
       AND att.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'public.location_assignment_history'::REGCLASS
        AND con.contype = 'f'
        AND att.attname = 'employee_id'
    LOOP
      EXECUTE format('ALTER TABLE public.location_assignment_history DROP CONSTRAINT %I', fk_name);
    END LOOP;

    ALTER TABLE public.location_assignment_history
      RENAME COLUMN employee_id TO legacy_employee_id;

    ALTER TABLE public.location_assignment_history
      ALTER COLUMN legacy_employee_id DROP NOT NULL;

    ALTER TABLE public.location_assignment_history
      RENAME COLUMN employee_uuid TO employee_id;

    ALTER TABLE public.location_assignment_history
      ALTER COLUMN employee_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.location_assignment_history'::REGCLASS
      AND conname = 'location_assignment_history_employee_uuid_fkey'
  ) THEN
    ALTER TABLE public.location_assignment_history
      ADD CONSTRAINT location_assignment_history_employee_uuid_fkey
      FOREIGN KEY (employee_id)
      REFERENCES public.employees(uuid)
      ON DELETE CASCADE
      NOT VALID;

    ALTER TABLE public.location_assignment_history
      VALIDATE CONSTRAINT location_assignment_history_employee_uuid_fkey;
  END IF;
END $$;

-- 5. Recreate indexes on the UUID employee references.
CREATE INDEX IF NOT EXISTS idx_emp_loc_assign_employee
  ON public.employee_location_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_emp_loc_assign_active
  ON public.employee_location_assignments(employee_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_primary_location_per_employee
  ON public.employee_location_assignments(employee_id)
  WHERE is_active = true AND is_primary = true;

CREATE INDEX IF NOT EXISTS idx_loc_history_employee
  ON public.location_assignment_history(employee_id);

-- 6. Recreate RLS policies using employees.uuid, avoiding bigint/uuid casts.
CREATE POLICY employee_location_assignments_read_access ON public.employee_location_assignments
FOR SELECT TO authenticated
USING (
  company_id = (SELECT private.current_company_id())
  AND (
    (SELECT private.is_location_admin())
    OR EXISTS (
      SELECT 1
      FROM public.employees AS e
      WHERE e.uuid = employee_location_assignments.employee_id
        AND e.auth_user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY employee_location_assignments_admin_insert ON public.employee_location_assignments
FOR INSERT TO authenticated
WITH CHECK (
  employee_location_assignments.company_id = (SELECT private.current_company_id())
  AND (SELECT private.is_location_admin())
  AND EXISTS (
    SELECT 1
    FROM public.work_locations AS l
    WHERE l.id = employee_location_assignments.location_id
      AND l.company_id = employee_location_assignments.company_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.employees AS e
    WHERE e.uuid = employee_location_assignments.employee_id
      AND e.company_id = employee_location_assignments.company_id
  )
);

CREATE POLICY employee_location_assignments_admin_update ON public.employee_location_assignments
FOR UPDATE TO authenticated
USING (
  company_id = (SELECT private.current_company_id())
  AND (SELECT private.is_location_admin())
)
WITH CHECK (
  company_id = (SELECT private.current_company_id())
  AND (SELECT private.is_location_admin())
);

CREATE POLICY employee_location_assignments_admin_delete ON public.employee_location_assignments
FOR DELETE TO authenticated
USING (
  company_id = (SELECT private.current_company_id())
  AND (SELECT private.is_location_admin())
);

CREATE POLICY "Service role full access on employee_location_assignments"
ON public.employee_location_assignments
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY location_assignment_history_read_access ON public.location_assignment_history
FOR SELECT TO authenticated
USING (
  company_id = (SELECT private.current_company_id())
  AND (
    (SELECT private.is_location_admin())
    OR EXISTS (
      SELECT 1
      FROM public.employees AS e
      WHERE e.uuid = location_assignment_history.employee_id
        AND e.auth_user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Service role full access on location_assignment_history"
ON public.location_assignment_history
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.work_locations, public.employee_location_assignments, public.location_assignment_history TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.work_locations, public.employee_location_assignments TO authenticated;
GRANT ALL ON public.employees, public.users, public.work_locations, public.employee_location_assignments, public.location_assignment_history TO service_role;

COMMIT;
