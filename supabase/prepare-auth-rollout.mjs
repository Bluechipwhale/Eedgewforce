import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('server/.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, quiet: true });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function allRows(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await client.from(table).select(columns).range(from, from + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

async function allAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 500 });
    if (error) throw new Error(`Supabase Auth: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 500) return users;
  }
}

const [users, employees, authUsers] = await Promise.all([
  allRows('users', 'id,uuid,email,auth_user_id,password_hash'),
  allRows('employees', 'id,employee_code,user_id,auth_user_id'),
  allAuthUsers()
]);
const authByEmail = new Map(authUsers.map(user => [user.email?.toLowerCase(), user]));
const authById = new Map(authUsers.map(user => [user.id, user]));
const employeeByUser = new Map(employees.map(employee => [employee.user_id, employee]));
const manifest = [];

for (const user of users) {
  const email = user.email?.trim().toLowerCase() || '';
  const employee = employeeByUser.get(user.uuid);
  const authAccount = authByEmail.get(email);
  const hasDefaultPassword = Boolean(user.password_hash && await bcrypt.compare('ChangeMe123!', user.password_hash));
  let action = 'none';
  if (!email || !email.includes('@')) action = 'review-email';
  else if (!employee || employee.auth_user_id !== user.auth_user_id) action = 'review-link';
  else if (user.auth_user_id && !authById.has(user.auth_user_id)) action = 'review-link';
  else if (authAccount && authAccount.id !== user.auth_user_id) action = 'review-link';
  else if (!authAccount && !user.auth_user_id) action = 'invite';
  else if (hasDefaultPassword) action = 'reset';
  manifest.push({ employee_code: employee?.employee_code || '', email, action, default_password: hasDefaultPassword });
}

const counts = Object.fromEntries([...new Set(manifest.map(row => row.action))].sort().map(action => [
  action, manifest.filter(row => row.action === action).length
]));
console.log(JSON.stringify({ total: manifest.length, actions: counts, exposedDefaultPasswords: manifest.filter(row => row.default_password).length }, null, 2));

if (process.argv.includes('--write-manifest')) {
  const file = path.resolve('scratch/auth-rollout.csv');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const csv = ['employee_code,email,action,default_password', ...manifest
    .sort((a, b) => a.action.localeCompare(b.action) || a.email.localeCompare(b.email))
    .map(row => Object.values(row).map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n') + '\n';
  fs.writeFileSync(file, csv, { mode: 0o600 });
  console.log('Private review manifest written to scratch/auth-rollout.csv. No invitations or resets were sent.');
}
