-- Convert the user references introduced after migration 012. Keep numeric row
-- IDs and the original values in legacy_* columns for compatibility and audit.
BEGIN;

DO $migration$
DECLARE
  ref RECORD;
  current_type TEXT;
  missing_count BIGINT;
  fk_name TEXT;
BEGIN
  FOR ref IN SELECT * FROM (VALUES
    ('inventory_movements', 'recorded_by'),
    ('orders', 'approved_by'),
    ('order_approvals', 'approver_id'),
    ('tasks', 'acknowledged_by'),
    ('tasks', 'completed_by')
  ) AS refs(table_name, column_name)
  LOOP
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ref.table_name
      AND column_name = ref.column_name;

    IF current_type NOT IN ('bigint', 'integer', 'uuid') OR current_type IS NULL THEN
      RAISE EXCEPTION 'Unexpected identity type %.%: %',
        ref.table_name, ref.column_name, current_type;
    END IF;

    IF current_type <> 'uuid' THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I UUID',
        ref.table_name, ref.column_name || '_uuid');
      EXECUTE format(
        'UPDATE public.%I AS target SET %I = source.uuid
         FROM public.users AS source WHERE target.%I = source.id',
        ref.table_name, ref.column_name || '_uuid', ref.column_name
      );
      EXECUTE format(
        'SELECT count(*) FROM public.%I WHERE %I IS NOT NULL AND %I IS NULL',
        ref.table_name, ref.column_name, ref.column_name || '_uuid'
      ) INTO missing_count;
      IF missing_count <> 0 THEN
        RAISE EXCEPTION 'Cannot map %.% to users.uuid: % row(s). No changes were committed.',
          ref.table_name, ref.column_name, missing_count;
      END IF;
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I',
        ref.table_name, ref.column_name, 'legacy_' || ref.column_name);
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I',
        ref.table_name, ref.column_name || '_uuid', ref.column_name);
    END IF;

    fk_name := ref.table_name || '_' || ref.column_name || '_users_uuid_fkey';
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = fk_name
      AND conrelid = format('public.%I', ref.table_name)::regclass) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I)
         REFERENCES public.users(uuid) ON DELETE SET NULL NOT VALID',
        ref.table_name, fk_name, ref.column_name
      );
    END IF;
    EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', ref.table_name, fk_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
      'idx_uuidref_' || ref.table_name || '_' || ref.column_name,
      ref.table_name, ref.column_name);
  END LOOP;
END;
$migration$;

COMMIT;
