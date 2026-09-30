# One Database Installer

Run the complete **supabase_production_schema.sql** in the Supabase SQL Editor as the project database administrator. Take a database backup first.

`schema.sql`, `seed.sql`, and `migrations/all.sql` are byte-identical compatibility copies of that installer. You need only one. Running another copy, or running the same copy again, is supported and does not replay the staff seed or reset passwords.

## Identity Contract

| Column | Type and meaning |
| --- | --- |
| `users.id`, `employees.id` | Existing bigint row IDs, retained for compatibility |
| `users.uuid`, `employees.uuid` | Stable UUID identities; never regenerated during an upgrade |
| `employees.user_id` | UUID foreign key to `users.uuid`, not to `users.id` |
| `employee_location_assignments.employee_id` | UUID foreign key to `employees.uuid` |
| `work_locations.id`, assignment `location_id` | Matching bigint workplace IDs |
| `auth_user_id` | UUID referencing Supabase Auth; separate from the stable application UUID |

Other employee and user references, including task actors, order approvers, and inventory recorders, use these stable UUIDs. Their earlier numeric values remain in `legacy_*` columns where an upgrade converted existing data. Company, workplace, product, order, task, and other operational row IDs remain bigint because the API and related foreign keys use those identifiers throughout the app.

Do not cast numbers such as `11` to UUID. The backend resolves that existing numeric staff ID to the employee's stored UUID before inserting a reference.

## Existing Databases

The installer recognizes the earlier numbered migration layout, including databases that have reached migration 011 or 012 without a migration ledger. It records the historical bootstrap as adopted instead of replaying bigint policies against UUID references.

Existing users and staff prevent the historical seed from overwriting production data. Existing staff names, changed passwords, identity UUIDs, and workplace assignments are preserved. Migration 013 retains its original, explicitly requested removal of the two retired sample workplaces; back up their assignment history if it is still needed.

All changes and migration records commit together. If an identity cannot be mapped, the transaction fails instead of leaving a partially converted database. An unrelated schema with UUID *primary keys* is intentionally rejected without deleting its data; it needs an inspected migration rather than a guessed conversion.

Do not manually rerun historical numbered files, delete the migration ledger, drop tables, or run an old downloaded copy of the schema. The files in `migrations/001_...` onward are chronological source steps, not interchangeable installers.

## Verify

The installer returns `EdgeWForce database ready`, the current staff count, and the number of recorded migrations. A fresh installation seeds 68 employee records; an existing installation retains its own staff count.

```sql
SELECT version, name, source FROM private.edgewforce_migrations ORDER BY version;
SELECT count(*) AS staff_count FROM public.employees;
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('employees', 'user_id'),
    ('employee_location_assignments', 'employee_id'),
    ('location_assignment_history', 'employee_id')
  );
```

Those three reference columns must be `uuid`. Configure the app with `DATABASE_MODE=supabase` and `SUPABASE_SCHEMA_VARIANT=numbered`, restart the backend, and check `/api/health`. Use the same Supabase project for frontend and backend keys.

## Maintaining the SQL

Add a new numbered migration for future changes. Do not edit an installed migration: the checksum guard will reject it.

```sh
npm run db:build
npm run db:check
npm run test:database
```

Database tests execute PostgreSQL using PGlite. Only Supabase-managed Auth/Storage infrastructure and extension creation are stubbed. Tests cover fresh installation, repeated entry points, pre-UUID and partially converted upgrades, data preservation, UUID writes, constraints, Auth linking and atomic rollback.
