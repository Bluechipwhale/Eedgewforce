-- ============================================================================
-- EDGEWFORCE - MIGRATION 010: TRUSTED AUTHORIZATION & LOCATION RLS HARDENING
-- Compatible with bigint public IDs and auth_user_id UUID mappings.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_company_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.company_id
    FROM public.users AS u
    WHERE u.auth_user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.current_role_code()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.role_code
    FROM public.users AS u
    WHERE u.auth_user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_location_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT (SELECT private.current_role_code()) IN
      ('SUPER_ADMIN', 'ADMIN', 'IT_ADMIN', 'CEO', 'CTO', 'HR_MANAGER', 'HR', 'MANAGER', 'SUPERVISOR');
$$;

REVOKE ALL ON FUNCTION private.current_company_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_role_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_location_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_role_code() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_location_admin() TO authenticated;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_assignment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on employees" ON public.employees;
CREATE POLICY "Service role full access on employees" ON public.employees
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
CREATE POLICY "Service role full access on users" ON public.users
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS companies_read_same_tenant ON public.companies;
CREATE POLICY companies_read_same_tenant ON public.companies
FOR SELECT TO authenticated
USING (
    id = (SELECT private.current_company_id())
    OR (SELECT private.current_role_code()) = 'SUPER_ADMIN'
);

DROP POLICY IF EXISTS "Service role full access on companies" ON public.companies;
CREATE POLICY "Service role full access on companies" ON public.companies
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
FOR SELECT TO authenticated
USING (
    employees.auth_user_id = (SELECT auth.uid())
    OR (SELECT private.current_role_code()) IN ('SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'CEO', 'CTO')
);

DROP POLICY IF EXISTS "Employees can update own record" ON public.employees;
CREATE POLICY "Employees can update own record" ON public.employees
FOR UPDATE TO authenticated
USING (
    employees.auth_user_id = (SELECT auth.uid())
    OR (SELECT private.current_role_code()) IN ('SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER')
)
WITH CHECK (
    (
      employees.auth_user_id = (SELECT auth.uid())
      AND employees.auth_user_id IS NOT DISTINCT FROM (SELECT auth.uid())
    )
    OR (SELECT private.current_role_code()) IN ('SUPER_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER')
);

DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
FOR SELECT TO authenticated
USING (
    users.auth_user_id = (SELECT auth.uid())
    OR (SELECT private.current_role_code()) IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'CEO')
);

DROP POLICY IF EXISTS work_locations_tenant_isolation ON public.work_locations;
DROP POLICY IF EXISTS work_locations_read_same_company ON public.work_locations;
DROP POLICY IF EXISTS work_locations_admin_write ON public.work_locations;
DROP POLICY IF EXISTS work_locations_admin_insert ON public.work_locations;
DROP POLICY IF EXISTS work_locations_admin_update ON public.work_locations;
DROP POLICY IF EXISTS work_locations_admin_delete ON public.work_locations;
DROP POLICY IF EXISTS "Service role full access on work_locations" ON public.work_locations;

CREATE POLICY work_locations_read_same_company ON public.work_locations
FOR SELECT TO authenticated
USING (company_id = (SELECT private.current_company_id()));

CREATE POLICY work_locations_admin_insert ON public.work_locations
FOR INSERT TO authenticated
WITH CHECK (
    company_id = (SELECT private.current_company_id())
    AND (SELECT private.is_location_admin())
);

CREATE POLICY work_locations_admin_update ON public.work_locations
FOR UPDATE TO authenticated
USING (
    company_id = (SELECT private.current_company_id())
    AND (SELECT private.is_location_admin())
)
WITH CHECK (
    company_id = (SELECT private.current_company_id())
    AND (SELECT private.is_location_admin())
);

CREATE POLICY work_locations_admin_delete ON public.work_locations
FOR DELETE TO authenticated
USING (
    company_id = (SELECT private.current_company_id())
    AND (SELECT private.is_location_admin())
);

CREATE POLICY "Service role full access on work_locations" ON public.work_locations
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS employee_location_assignments_tenant_isolation ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_read_access ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_write ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_insert ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_update ON public.employee_location_assignments;
DROP POLICY IF EXISTS employee_location_assignments_admin_delete ON public.employee_location_assignments;
DROP POLICY IF EXISTS "Service role full access on employee_location_assignments" ON public.employee_location_assignments;

CREATE POLICY employee_location_assignments_read_access ON public.employee_location_assignments
FOR SELECT TO authenticated
USING (
    company_id = (SELECT private.current_company_id())
    AND (
      (SELECT private.is_location_admin())
      OR EXISTS (
        SELECT 1
        FROM public.employees AS e
        WHERE e.id = employee_location_assignments.employee_id
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
      WHERE e.id = employee_location_assignments.employee_id
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

CREATE POLICY "Service role full access on employee_location_assignments" ON public.employee_location_assignments
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS location_assignment_history_tenant_isolation ON public.location_assignment_history;
DROP POLICY IF EXISTS location_assignment_history_read_access ON public.location_assignment_history;
DROP POLICY IF EXISTS "Service role full access on location_assignment_history" ON public.location_assignment_history;

CREATE POLICY location_assignment_history_read_access ON public.location_assignment_history
FOR SELECT TO authenticated
USING (
    company_id = (SELECT private.current_company_id())
    AND (
      (SELECT private.is_location_admin())
      OR EXISTS (
        SELECT 1
        FROM public.employees AS e
        WHERE e.id = location_assignment_history.employee_id
          AND e.auth_user_id = (SELECT auth.uid())
      )
    )
);

CREATE POLICY "Service role full access on location_assignment_history" ON public.location_assignment_history
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_primary_location_per_employee
ON public.employee_location_assignments(employee_id)
WHERE is_active = true AND is_primary = true;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS work_locations_set_updated_at ON public.work_locations;
CREATE TRIGGER work_locations_set_updated_at
BEFORE UPDATE ON public.work_locations
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS employee_location_assignments_set_updated_at ON public.employee_location_assignments;
CREATE TRIGGER employee_location_assignments_set_updated_at
BEFORE UPDATE ON public.employee_location_assignments
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

REVOKE ALL ON TABLE public.employees, public.users FROM anon;
REVOKE ALL ON TABLE public.work_locations, public.employee_location_assignments, public.location_assignment_history FROM anon;
GRANT SELECT, UPDATE ON public.employees TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.work_locations, public.employee_location_assignments, public.location_assignment_history TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.work_locations, public.employee_location_assignments TO authenticated;
GRANT ALL ON public.companies, public.employees, public.users, public.work_locations, public.employee_location_assignments, public.location_assignment_history TO service_role;

-- Seed the requested offices without overwriting existing location IDs.
INSERT INTO public.work_locations
  (company_id, name, location_type, address, state, lga, city, latitude, longitude, geofence_radius_meters, status)
SELECT 1, 'Head Officer', 'Office', '15 Atiba Osborne Mende Maryland Lagos', 'Lagos', 'Maryland', 'Lagos', 6.3418700, 3.2231000, 150, 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.work_locations WHERE company_id = 1 AND name = 'Head Officer'
);

INSERT INTO public.work_locations
  (company_id, name, location_type, address, state, lga, city, latitude, longitude, geofence_radius_meters, status)
SELECT 1, 'Ogba Office', 'Office', '9 Emmanuel Olorunfemi street off college road Ogba', 'Lagos', 'Ikeja', 'Lagos', 6.6381454, 3.3311149, 200, 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.work_locations WHERE company_id = 1 AND name = 'Ogba Office'
);

COMMIT;
