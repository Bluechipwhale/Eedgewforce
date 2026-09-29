-- =============================================================================
-- EDGEWFORCE - MIGRATION 012: UUID IDENTITY REFERENCES GLOBAL ALIGNMENT
-- Converts employee/user reference columns across the app schema to UUID-backed
-- references while retaining old numeric values as legacy_* columns.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uuid UUID;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS uuid UUID;

UPDATE public.users
SET uuid = COALESCE(uuid, auth_user_id, gen_random_uuid())
WHERE uuid IS NULL;

UPDATE public.employees
SET uuid = COALESCE(uuid, auth_user_id, gen_random_uuid())
WHERE uuid IS NULL;

ALTER TABLE public.users
  ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE public.employees
  ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid_unique ON public.users(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_uuid_unique ON public.employees(uuid);

CREATE SCHEMA IF NOT EXISTS private;

DROP FUNCTION IF EXISTS private.convert_identity_reference_to_uuid(REGCLASS, TEXT, TEXT);

CREATE OR REPLACE FUNCTION private.convert_identity_reference_to_uuid(
  p_table TEXT,
  p_column TEXT,
  p_ref_table TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_schema TEXT;
  v_table TEXT;
  v_table_regclass REGCLASS;
  v_type TEXT;
  v_tmp TEXT;
  v_legacy TEXT;
  v_fk_name TEXT;
  v_index_name TEXT;
  v_on_delete TEXT := 'NO ACTION';
  v_column_not_null BOOLEAN := FALSE;
  v_column_unique BOOLEAN := FALSE;
  v_unique_constraints JSONB;
  v_missing BIGINT;
  v_constraint RECORD;
BEGIN
  v_table_regclass := to_regclass(p_table);
  IF v_table_regclass IS NULL THEN
    RAISE NOTICE 'Skipping missing table %', p_table;
    RETURN;
  END IF;

  SELECT n.nspname, c.relname
  INTO v_schema, v_table
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = v_table_regclass;

  IF v_schema IS NULL THEN
    RAISE NOTICE 'Skipping missing table %', p_table;
    RETURN;
  END IF;

  SELECT data_type
  INTO v_type
  FROM information_schema.columns
  WHERE table_schema = v_schema
    AND table_name = v_table
    AND column_name = p_column;

  IF v_type IS NULL THEN
    RAISE NOTICE 'Skipping missing column %.%', p_table, p_column;
    RETURN;
  END IF;

  IF v_type = 'uuid' THEN
    RETURN;
  END IF;

  SELECT att.attnotnull
  INTO v_column_not_null
  FROM pg_attribute AS att
  WHERE att.attrelid = v_table_regclass
    AND att.attname = p_column
    AND NOT att.attisdropped;

  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = con.conkey[1]
    WHERE con.conrelid = v_table_regclass
      AND con.contype = 'u'
      AND cardinality(con.conkey) = 1
      AND att.attname = p_column
  )
  INTO v_column_unique;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('conname', con.conname, 'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
  INTO v_unique_constraints
  FROM pg_constraint AS con
  JOIN pg_attribute AS att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
  WHERE con.conrelid = v_table_regclass AND con.contype = 'u' AND att.attname = p_column;

  SELECT CASE con.confdeltype
      WHEN 'c' THEN 'CASCADE'
      WHEN 'r' THEN 'RESTRICT'
      WHEN 'n' THEN 'SET NULL'
      WHEN 'd' THEN 'SET DEFAULT'
      ELSE 'NO ACTION'
    END
  INTO v_on_delete
  FROM pg_constraint AS con
  JOIN pg_attribute AS att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY(con.conkey)
  WHERE con.conrelid = v_table_regclass
    AND con.contype = 'f'
    AND att.attname = p_column
  ORDER BY con.oid
  LIMIT 1;

  v_on_delete := COALESCE(v_on_delete, 'NO ACTION');

  v_tmp := p_column || '_uuid';
  v_legacy := 'legacy_' || p_column;
  v_fk_name := replace(v_table || '_' || p_column || '_' || p_ref_table || '_uuid_fkey', '.', '_');
  v_index_name := left('idx_uuidref_' || v_table || '_' || p_column, 63);

  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS %I UUID', v_table_regclass, v_tmp);

  IF p_ref_table = 'employees' THEN
    EXECUTE format(
      'UPDATE %s AS target
       SET %I = source.uuid
       FROM public.employees AS source
       WHERE target.%I IS NULL
         AND target.%I IS NOT NULL
         AND target.%I::TEXT = source.id::TEXT',
      v_table_regclass, v_tmp, v_tmp, p_column, p_column
    );

    EXECUTE format(
      'UPDATE %s AS target
       SET %I = source.uuid
       FROM public.employees AS source
       WHERE target.%I IS NULL
         AND target.%I IS NOT NULL
         AND target.%I::TEXT = source.user_id::TEXT',
      v_table_regclass, v_tmp, v_tmp, p_column, p_column
    );

    EXECUTE format(
      'UPDATE %s AS target
       SET %I = target.%I::TEXT::UUID
       WHERE target.%I IS NULL
         AND target.%I IS NOT NULL
         AND target.%I::TEXT ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$''',
      v_table_regclass, v_tmp, p_column, v_tmp, p_column, p_column
    );
  ELSIF p_ref_table = 'users' THEN
    EXECUTE format(
      'UPDATE %s AS target
       SET %I = source.uuid
       FROM public.users AS source
       WHERE target.%I IS NULL
         AND target.%I IS NOT NULL
         AND target.%I::TEXT = source.id::TEXT',
      v_table_regclass, v_tmp, v_tmp, p_column, p_column
    );

    EXECUTE format(
      'UPDATE %s AS target
       SET %I = target.%I::TEXT::UUID
       WHERE target.%I IS NULL
         AND target.%I IS NOT NULL
         AND target.%I::TEXT ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$''',
      v_table_regclass, v_tmp, p_column, v_tmp, p_column, p_column
    );
  ELSE
    RAISE EXCEPTION 'Unsupported identity reference table: %', p_ref_table;
  END IF;

  EXECUTE format(
    'SELECT COUNT(*) FROM %s WHERE %I IS NOT NULL AND %I IS NULL',
    v_table_regclass, p_column, v_tmp
  )
  INTO v_missing;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Cannot convert %.% to UUID: % row(s) could not be mapped to %.uuid.',
      p_table, p_column, v_missing, p_ref_table;
  END IF;

  IF v_column_not_null THEN
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I SET NOT NULL', v_table_regclass, v_tmp);
  END IF;

  FOR v_constraint IN
    SELECT con.conname
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = v_table_regclass
      AND con.contype = 'f'
      AND att.attname = p_column
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', v_table_regclass, v_constraint.conname);
  END LOOP;

  FOR v_constraint IN SELECT * FROM jsonb_to_recordset(v_unique_constraints) AS x(conname TEXT, definition TEXT)
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', v_table_regclass, v_constraint.conname);
  END LOOP;

  EXECUTE format('ALTER TABLE %s RENAME COLUMN %I TO %I', v_table_regclass, p_column, v_legacy);
  EXECUTE format('ALTER TABLE %s ALTER COLUMN %I DROP NOT NULL', v_table_regclass, v_legacy);
  EXECUTE format('ALTER TABLE %s RENAME COLUMN %I TO %I', v_table_regclass, v_tmp, p_column);

  FOR v_constraint IN SELECT * FROM jsonb_to_recordset(v_unique_constraints) AS x(conname TEXT, definition TEXT)
  LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', v_table_regclass, v_constraint.conname, v_constraint.definition);
  END LOOP;

  IF p_ref_table = 'employees' THEN
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.employees(uuid) ON DELETE %s NOT VALID',
      v_table_regclass, v_fk_name, p_column, v_on_delete
    );
  ELSE
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(uuid) ON DELETE %s NOT VALID',
      v_table_regclass, v_fk_name, p_column, v_on_delete
    );
  END IF;

  IF v_column_unique THEN
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %s (%I)', v_index_name, v_table_regclass, p_column);
  ELSE
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)', v_index_name, v_table_regclass, p_column);
  END IF;

  EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', v_table_regclass, v_fk_name);
END;
$$;

-- Employee references
SELECT private.convert_identity_reference_to_uuid('public.employees', 'user_id', 'users');
SELECT private.convert_identity_reference_to_uuid('public.employees', 'reporting_manager_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.employees', 'supervisor_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.customers', 'registered_by', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.customers', 'assigned_agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.customers', 'assigned_supervisor_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.orders', 'sales_agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.collections', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.visits', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.competitor_intel', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.location_tracking', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.visit_reports', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.attendance', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.leave_balances', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.leave_requests', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.leave_requests', 'reviewed_by', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.payslips', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.settlements', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.sos', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.idle_alerts', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.face_events', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.okrs', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.tasks', 'assigned_to', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.schedules', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.schedules', 'assigned_agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.store_requests', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.location_alerts', 'agent_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.employee_idle_sessions', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.push_subscriptions', 'employee_id', 'employees');
SELECT private.convert_identity_reference_to_uuid('public.notifications', 'employee_id', 'employees');

-- User references
SELECT private.convert_identity_reference_to_uuid('public.inventory_transactions', 'created_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.payslips', 'generated_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.settlements', 'reviewed_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.sos', 'acknowledged_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.sos', 'resolved_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.idle_alerts', 'reviewed_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.tasks', 'assigned_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.task_comments', 'author_id', 'users');
SELECT private.convert_identity_reference_to_uuid('public.announcements', 'created_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.store_requests', 'reviewed_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.location_alerts', 'acknowledged_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.location_alerts', 'resolved_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.employee_idle_sessions', 'reviewed_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.audit_logs', 'actor_id', 'users');
SELECT private.convert_identity_reference_to_uuid('public.file_uploads', 'uploaded_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.file_attachments', 'uploaded_by', 'users');
SELECT private.convert_identity_reference_to_uuid('public.ai_conversations', 'user_id', 'users');

-- employee.user_id is UUID-backed after the conversion above; keep Auth linking
-- compatible with that new reference type for future sign-ups.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  matching_user_uuid UUID;
BEGIN
  SELECT u.uuid
  INTO matching_user_uuid
  FROM public.users AS u
  WHERE lower(u.email) = lower(NEW.email)
  LIMIT 1;

  IF matching_user_uuid IS NOT NULL THEN
    UPDATE public.users
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE uuid = matching_user_uuid;

    UPDATE public.employees
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE user_id = matching_user_uuid;
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS private.convert_identity_reference_to_uuid(TEXT, TEXT, TEXT);

COMMIT;
