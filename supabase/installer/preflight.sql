-- A single transaction owns both schema changes and the migration ledger.
SELECT pg_advisory_xact_lock(735013, 15001);
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.edgewforce_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('applied', 'adopted')),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON private.edgewforce_migrations FROM PUBLIC, anon, authenticated;

CREATE TEMP TABLE edgewforce_install_state (
  adopt_through INTEGER NOT NULL,
  preserve_existing_staff BOOLEAN NOT NULL
) ON COMMIT DROP;

DO $preflight$
DECLARE
  item RECORD;
  has_staff BOOLEAN := FALSE;
  uuid_stage BOOLEAN := FALSE;
  adopt_through INTEGER := 0;
BEGIN
  FOR item IN
    SELECT table_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'id'
      AND table_name IN ('companies', 'users', 'employees', 'work_locations')
  LOOP
    IF item.data_type <> 'bigint' THEN
      RAISE EXCEPTION 'Unsupported primary key %.id (%). No changes were committed. This installer preserves bigint primary keys and uses users.uuid/employees.uuid for identity references; do not cast or drop existing data.', item.table_name, item.data_type;
    END IF;
  END LOOP;

  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.users)' INTO has_staff;
  END IF;
  IF to_regclass('public.employees') IS NOT NULL THEN
    EXECUTE 'SELECT $1 OR EXISTS (SELECT 1 FROM public.employees)' INTO has_staff USING has_staff;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'uuid'
      AND ((table_name = 'employees' AND column_name IN ('uuid', 'user_id'))
        OR (table_name = 'employee_location_assignments' AND column_name = 'employee_id'))
  ) INTO uuid_stage;

  IF uuid_stage AND NOT EXISTS (SELECT 1 FROM private.edgewforce_migrations) THEN
    IF to_regprocedure('private.is_location_admin()') IS NULL
       OR to_regclass('public.users') IS NULL
       OR to_regclass('public.employees') IS NULL
       OR to_regclass('public.location_assignment_history') IS NULL THEN
      RAISE EXCEPTION 'Unrecognized partial UUID schema. No changes were committed. Preserve the database and inspect its columns before attempting an upgrade.';
    END IF;
    adopt_through := 10;
    IF to_regclass('public.task_reminders') IS NOT NULL
       AND to_regclass('public.reminder_delivery_logs') IS NOT NULL
       AND to_regclass('public.employee_idle_sessions') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='user_id' AND data_type='uuid')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_location_assignments' AND column_name='employee_id' AND data_type='uuid')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='due_at')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_locations' AND column_name='geofence_radius')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='company_id') THEN
      adopt_through := 14;
    END IF;
    RAISE NOTICE 'Adopting the existing UUID database. Historical bigint policies and staff seed will not be replayed.';
  END IF;
  INSERT INTO edgewforce_install_state VALUES (adopt_through, has_staff);
END;
$preflight$;
