import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const sql = file => fs.readFileSync(`supabase/${file}`, 'utf8')
  .replace(/CREATE EXTENSION IF NOT EXISTS "?(?:uuid-ossp|pgcrypto)"?;/g, '');
const migrations = fs.readdirSync('supabase/migrations').filter(f => /^\d{3}_.*\.sql$/.test(f)).sort();
const installer = () => sql('supabase_production_schema.sql');
const fixture = async () => {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT, raw_user_meta_data JSONB DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE SQL STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE SQL STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    CREATE TABLE storage.buckets(id TEXT PRIMARY KEY, name TEXT, public BOOLEAN);
    CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT REFERENCES storage.buckets(id), name TEXT, owner UUID);
  `);
  return db;
};
async function historical(db, through) {
  for (const file of migrations.filter(f => Number(f.slice(0, 3)) <= through)) await db.exec(sql(`migrations/${file}`));
}
async function snapshot(db) {
  return (await db.query(`SELECT e.id,e.uuid,e.user_id,e.full_name,u.password_hash,u.uuid AS user_uuid
    FROM employees e JOIN users u ON e.user_id=u.uuid ORDER BY e.id`)).rows;
}
async function assertWrites(db) {
  await db.exec(`
    INSERT INTO work_locations(company_id,name,latitude,longitude,geofence_radius) VALUES (1,'Installer test workplace',6.4,3.4,150);
    INSERT INTO employee_location_assignments(company_id,employee_id,location_id,is_primary)
      SELECT 1,e.uuid,l.id,true FROM employees e CROSS JOIN work_locations l WHERE e.id=11 AND l.name='Installer test workplace';
    INSERT INTO location_assignment_history(company_id,employee_id,new_location_id)
      SELECT company_id,employee_id,location_id FROM employee_location_assignments;
    INSERT INTO attendance(employee_id,date) SELECT uuid, '2026-09-29' FROM employees WHERE id=11;
    INSERT INTO tasks(company_id,title,assigned_to,assigned_by,priority,status)
      SELECT 1,'Installer test task',e.uuid,u.uuid,'normal','pending' FROM employees e CROSS JOIN users u WHERE e.id=11 AND u.id=1;
    INSERT INTO notifications(company_id,employee_id,title,body,type)
      SELECT 1,uuid,'Test notification','Test','Tasks' FROM employees WHERE id=11;
    INSERT INTO task_comments(task_id,author_id,comment)
      SELECT t.id,u.uuid,'Test comment' FROM tasks t CROSS JOIN users u WHERE u.id=1;
    INSERT INTO auth.users(email) SELECT email FROM public.users WHERE id=1;
    UPDATE tasks SET acknowledged_by=(SELECT uuid FROM users WHERE id=1),
      completed_by=(SELECT uuid FROM users WHERE id=1)
      WHERE title='Installer test task';
    INSERT INTO products(sku,name,category,price,cost_price)
      VALUES ('INSTALLER-001','Installer product','Testing',100,50);
    INSERT INTO inventory_movements(company_id,product_id,movement_type,quantity,recorded_by)
      SELECT 1,id,'RESTOCK',1,(SELECT uuid FROM users WHERE id=1) FROM products WHERE sku='INSTALLER-001';
    INSERT INTO customers(code,name,address) VALUES ('INSTALLER-001','Installer customer','Lagos');
    INSERT INTO orders(order_number,customer_id,sales_agent_id,approved_by)
      SELECT 'INSTALLER-001',c.id,e.uuid,u.uuid FROM customers c CROSS JOIN employees e
      CROSS JOIN users u WHERE c.code='INSTALLER-001' AND e.id=11 AND u.id=1;
    INSERT INTO order_approvals(company_id,order_id,approver_id,action)
      SELECT 1,o.id,u.uuid,'APPROVED' FROM orders o CROSS JOIN users u
      WHERE o.order_number='INSTALLER-001' AND u.id=1;
  `);
  const linked = (await db.query('SELECT count(*) AS n FROM employees e JOIN users u ON e.user_id=u.uuid WHERE e.auth_user_id=u.auth_user_id AND u.id=1')).rows[0];
  assert.equal(Number(linked.n), 1);
  await assert.rejects(db.exec("INSERT INTO attendance(employee_id,date) SELECT uuid,'2026-09-29' FROM employees WHERE id=11"), { code: '23505' });
}

test('all four SQL entry points install and rerun without changing staff or assignments', async () => {
  const db = await fixture();
  try {
    await db.exec(installer());
    assert.equal((await snapshot(db)).length, 68);
    await assertWrites(db);
    await db.exec("UPDATE users SET password_hash='keep-changed-password' WHERE id=1; UPDATE employees SET full_name='Keep HR edited name' WHERE id=11;");
    const before = await snapshot(db);
    for (const file of ['seed.sql', 'schema.sql', 'migrations/all.sql', 'supabase_production_schema.sql']) {
      assert.equal(sql(file), installer());
      await db.exec(sql(file));
      assert.deepEqual(await snapshot(db), before, file);
    }
    assert.equal(Number((await db.query('SELECT count(*) AS n FROM employee_location_assignments')).rows[0].n), 1);
    assert.equal(Number((await db.query('SELECT count(*) AS n FROM private.edgewforce_migrations')).rows[0].n), migrations.length);
    await db.exec('DELETE FROM employees WHERE id=68');
    await db.exec(sql('seed.sql'));
    assert.equal(Number((await db.query('SELECT count(*) AS n FROM employees')).rows[0].n), 67, 'A rerun must not recreate deleted staff');
    const damagedBundle = installer().replace(/checksum <> '[a-f0-9]{64}'/, "checksum <> 'changed-checksum'");
    await assert.rejects(db.exec(damagedBundle), /edited after installation/);
    await db.exec('ROLLBACK');
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('SELECT * FROM private.edgewforce_migrations'), {code: '42501'});
  } finally { await db.close(); }
});

for (const through of [10, 11, 14]) {
  test(`upgrade existing untracked migration-${through} database without resetting staff`, async () => {
    const db = await fixture();
    try {
      await historical(db, through);
      await db.exec("UPDATE users SET password_hash='preserved-password' WHERE id=1; UPDATE employees SET full_name='Preserved staff name' WHERE id=11;");
      const oldIds = through >= 11 ? (await db.query('SELECT id,uuid FROM employees ORDER BY id')).rows : null;
      if (through === 14) {
        await db.exec("UPDATE storage.buckets SET public=false WHERE id='edgewforce-media'");
        await db.exec('ALTER TABLE employee_location_assignments ALTER COLUMN legacy_employee_id SET NOT NULL');
        // The approved 005 must also run alone against an existing UUID schema.
        await db.exec(sql('migrations/005_staff_hr_management_and_rls.sql'));
        await db.exec(`
          INSERT INTO products(sku,name,category,price,cost_price) VALUES ('OLD-001','Old product','Testing',100,50);
          INSERT INTO inventory_movements(company_id,product_id,movement_type,quantity,recorded_by)
            SELECT 1,id,'RESTOCK',1,1 FROM products WHERE sku='OLD-001';
          INSERT INTO customers(code,name,address) VALUES ('OLD-001','Old customer','Lagos');
          INSERT INTO orders(order_number,customer_id,sales_agent_id,approved_by)
            SELECT 'OLD-001',c.id,e.uuid,1 FROM customers c CROSS JOIN employees e
            WHERE c.code='OLD-001' AND e.id=11;
          INSERT INTO order_approvals(company_id,order_id,approver_id,action)
            SELECT 1,id,1,'APPROVED' FROM orders WHERE order_number='OLD-001';
          INSERT INTO tasks(title,assigned_to,assigned_by,acknowledged_by,completed_by)
            SELECT 'Old task',e.uuid,u.uuid,1,1 FROM employees e CROSS JOIN users u
            WHERE e.id=11 AND u.id=1;
        `);
        await assert.rejects(db.exec("INSERT INTO employees(user_id,employee_code,first_name,last_name) VALUES (1,'BAD','Bad','Seed')"), {code: '42804'});
        await assert.rejects(db.exec('CREATE TABLE broken_field_visits (employee_id UUID REFERENCES employees(id))'), {code: '42804'});
      }
      await db.exec(installer());
      if (through === 14) {
        assert.equal((await db.query("SELECT public FROM storage.buckets WHERE id='edgewforce-media'")).rows[0].public, false);
        const view = (await db.query("SELECT reloptions FROM pg_class WHERE oid='public.public_employee_directory'::regclass")).rows[0];
        assert.ok(view.reloptions.includes('security_invoker=true'));
        for (const [table, column] of [
          ['inventory_movements', 'recorded_by'], ['orders', 'approved_by'],
          ['order_approvals', 'approver_id'], ['tasks', 'acknowledged_by'],
          ['tasks', 'completed_by']
        ]) {
          const rows = (await db.query(`SELECT ${column} AS current_id, legacy_${column} AS old_id
            FROM ${table} WHERE legacy_${column} IS NOT NULL`)).rows;
          assert.equal(rows.length, 1, `${table}.${column}`);
          assert.equal(Number(rows[0].old_id), 1);
          assert.equal(rows[0].current_id, (await db.query('SELECT uuid FROM users WHERE id=1')).rows[0].uuid);
        }
      }
      assert.equal((await snapshot(db)).length, 68);
      assert.equal((await db.query('SELECT password_hash FROM users WHERE id=1')).rows[0].password_hash, 'preserved-password');
      assert.equal((await db.query('SELECT full_name FROM employees WHERE id=11')).rows[0].full_name, 'Preserved staff name');
      if (oldIds) assert.deepEqual((await db.query('SELECT id,uuid FROM employees ORDER BY id')).rows, oldIds);
      await assertWrites(db);
      const before = await snapshot(db);
      await db.exec(installer());
      assert.deepEqual(await snapshot(db), before);
    } finally { await db.close(); }
  });
}

test('an unmapped identity aborts the entire upgrade without leaving a half-converted schema', async () => {
  const db = await fixture();
  try {
    await historical(db, 10);
    await db.exec('ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_fkey; INSERT INTO tasks(title,assigned_to,assigned_by) VALUES (\'Unmapped test identity\',999999,1)');
    await assert.rejects(db.exec(installer()), /Cannot migrate|could not be mapped/i);
    await db.exec('ROLLBACK');
    const result = await db.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='user_id'");
    assert.equal(result.rows[0].data_type, 'bigint');
    assert.equal((await db.query("SELECT to_regclass('private.edgewforce_migrations') AS ledger")).rows[0].ledger, null);
    assert.equal(Number((await db.query('SELECT count(*) AS n FROM employees')).rows[0].n), 68);
  } finally { await db.close(); }
});

test('an unmapped runtime actor leaves migration 016 and existing staff unchanged', async () => {
  const db = await fixture();
  try {
    await historical(db, 14);
    await db.exec(`INSERT INTO tasks(title,assigned_to,assigned_by,acknowledged_by)
      SELECT 'Unmapped runtime actor',e.uuid,u.uuid,999999
      FROM employees e CROSS JOIN users u WHERE e.id=11 AND u.id=1`);
    await assert.rejects(db.exec(installer()), /Cannot map tasks\.acknowledged_by to users\.uuid/);
    await db.exec('ROLLBACK');
    const type = (await db.query("SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='acknowledged_by'")).rows[0].data_type;
    assert.equal(type, 'bigint');
    assert.equal((await db.query("SELECT to_regclass('private.edgewforce_migrations') AS ledger")).rows[0].ledger, null);
    assert.equal(Number((await db.query('SELECT count(*) AS n FROM employees')).rows[0].n), 68);
  } finally { await db.close(); }
});

test('incompatible alternative UUID primary-key layouts are refused without destroying data', async () => {
  const db = await fixture();
  try {
    await db.exec("CREATE TABLE employees(id UUID PRIMARY KEY DEFAULT gen_random_uuid()); INSERT INTO employees DEFAULT VALUES");
    const original = (await db.query('SELECT id FROM employees')).rows;
    await assert.rejects(db.exec(installer()), /Unsupported primary key/);
    await db.exec('ROLLBACK');
    assert.deepEqual((await db.query('SELECT id FROM employees')).rows, original);
  } finally { await db.close(); }
});
