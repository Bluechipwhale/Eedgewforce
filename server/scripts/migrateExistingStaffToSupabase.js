// ==============================================================================
// EDGEWFORCE - AUTHORITATIVE STAFF TO SUPABASE MIGRATION SCRIPT
// Migrates offline staff records to Supabase Auth and public.employees
// ==============================================================================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const storePath = path.resolve(__dirname, '../../server/data/store.json');
if (!fs.existsSync(storePath)) {
  console.error(`ERROR: Local store file not found at ${storePath}`);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const employees = store.employees || [];
const users = store.users || [];

console.log(`\n===============================================================`);
console.log(`EDGEWFORCE — AUTHORITATIVE STAFF MIGRATION TO SUPABASE`);
console.log(`Target Supabase URL: ${supabaseUrl}`);
console.log(`Total staff in local store: ${employees.length}`);
console.log(`===============================================================\n`);

const summary = {
  total: employees.length,
  migrated: 0,
  alreadyExists: 0,
  failed: 0,
  missingEmail: 0,
  errors: []
};

const DEFAULT_PASSWORD = 'ChangeMe123!';

async function migrate() {
  // 1. Fetch existing Supabase Auth users to prevent unnecessary duplication
  const existingAuthUsersMap = new Map();
  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      const list = data?.users || [];
      list.forEach(u => {
        if (u.email) existingAuthUsersMap.set(u.email.toLowerCase().trim(), u);
      });
      if (list.length < 100) hasMore = false;
      else page++;
    }
  } catch (err) {
    console.warn(`Note: Could not list existing auth users: ${err.message}. Will check per-user.`);
  }

  // 1b. Ensure companies exist
  try {
    const companiesList = store.companies || [];
    for (const c of companiesList) {
      await supabaseAdmin.from('companies').upsert({
        id: c.id,
        name: c.name,
        business_type: c.business_type || 'Commercial Sales',
        industry: c.industry || 'Workforce',
        registration_number: c.registration_number || null,
        email: c.email || null,
        phone: c.phone || null,
        address: c.address || null,
        country: c.country || 'Nigeria',
        state: c.state || 'Lagos',
        city: c.city || 'Lagos',
        status: c.status || 'active'
      }, { onConflict: 'id' });
    }
    console.log(`Synchronized ${companiesList.length} companies to Supabase.`);
  } catch (cErr) {
    console.warn('Companies sync note:', cErr.message);
  }

  // 2. Iterate through each staff record
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const user = users.find(u => Number(u.id) === Number(emp.user_id)) || {};

    const rawEmail = emp.work_email || emp.email || user.email || emp.personal_email;
    if (!rawEmail) {
      console.warn(`[SKIP] Staff ${emp.first_name} ${emp.last_name} (${emp.employee_code}) has no email address.`);
      summary.missingEmail++;
      summary.failed++;
      summary.errors.push({ employee: emp.employee_code, reason: 'Missing email' });
      continue;
    }

    const email = rawEmail.toLowerCase().trim();
    const phone = emp.phone || user.phone || null;
    const roleCode = user.role_code || (
      emp.rank_code === 'CEO' ? 'CEO' :
      emp.rank_code === 'IT_ADMIN' ? 'SUPER_ADMIN' :
      emp.rank_code === 'HR' ? 'HR_MANAGER' :
      emp.rank_code === 'ACCOUNTANT' ? 'ACCOUNTANT' :
      emp.rank_code === 'SUPERVISOR' ? 'SUPERVISOR' :
      emp.department?.toLowerCase().includes('sales') ? 'SALES_AGENT' :
      emp.department?.toLowerCase().includes('field') ? 'FIELD_AGENT' : 'EMPLOYEE'
    );
    const fullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || user.full_name || 'Staff Member';
    const employeeCode = emp.employee_code || (emp.staff_id ? `EMP-${emp.staff_id}` : `EMP-${1000 + (emp.id || i + 1)}`);

    try {
      let authUserId = null;
      let isExisting = false;

      // Check if user already exists in auth
      const existingUser = existingAuthUsersMap.get(email);
      if (existingUser) {
        authUserId = existingUser.id;
        isExisting = true;
      } else {
        // Create user in Supabase Auth
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role_code: roleCode,
            employee_code: employeeCode,
            phone
          }
        });

        if (authError) {
          if (authError.message?.includes('already registered') || authError.code === 'email_exists') {
            // Retrieve user by email if possible
            const { data: lookup } = await supabaseAdmin.auth.admin.listUsers();
            const found = lookup?.users?.find(u => u.email?.toLowerCase() === email);
            if (found) {
              authUserId = found.id;
              isExisting = true;
            } else {
              throw authError;
            }
          } else {
            throw authError;
          }
        } else {
          authUserId = newAuthUser.user.id;
        }
      }

      if (!authUserId) {
        throw new Error('Could not obtain Supabase Auth UUID.');
      }

      // Upsert into public.employees with UUID as id and auth_user_id
      const employeePayload = {
        id: authUserId,
        user_id: authUserId,
        auth_user_id: authUserId,
        company_id: Number(emp.company_id || 1),
        employee_code: employeeCode,
        first_name: emp.first_name || fullName.split(' ')[0] || 'Staff',
        last_name: emp.last_name || fullName.split(' ').slice(1).join(' ') || 'Member',
        full_name: fullName,
        email,
        work_email: emp.work_email || email,
        personal_email: emp.personal_email || null,
        phone,
        department: emp.department || 'Operations',
        job_title: emp.position || emp.job_title || 'Staff Member',
        position: emp.position || emp.job_title || 'Staff Member',
        rank_code: emp.rank_code || 'STAFF',
        work_location: emp.work_location || emp.territory || 'Headquarters',
        address: emp.address || '15 Atiba Osborne, Mende, Maryland, Lagos',
        city_lga: emp.city_lga || emp.city || 'Lagos',
        state_of_residence: emp.state_of_residence || emp.state || 'Lagos',
        base_salary: Number(emp.base_salary || 0),
        status: 'active',
        onboarding_status: 'Active',
        requires_password_change: false,
        updated_at: new Date().toISOString()
      };

      let empError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await supabaseAdmin
          .from('employees')
          .upsert(employeePayload, { onConflict: 'id' });
        empError = res.error;
        if (!empError) break;
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
      }

      if (empError) {
        throw new Error(`employees table upsert error: ${empError.message}`);
      }

      // Upsert into public.users for backward-compatibility lookup
      const userPayload = {
        uuid: authUserId,
        auth_user_id: authUserId,
        company_id: Number(emp.company_id || 1),
        full_name: fullName,
        email,
        phone,
        password_hash: user.password_hash || '$2b$10$350LLaMVBQnjBGtP7kuFMOXHi0p685bbIClJw35dc5cr6s9JM1YyO',
        role_code: roleCode,
        status: 'active',
        requires_password_change: false,
        updated_at: new Date().toISOString()
      };

      const { error: userError } = await supabaseAdmin
        .from('users')
        .upsert(userPayload, { onConflict: 'email' });

      if (userError) {
        console.warn(`[WARN] users table sync note for ${email}: ${userError.message}`);
      }

      // Initialize leave balances if not exists
      try {
        await supabaseAdmin.from('leave_balances').upsert({
          employee_id: authUserId,
          year: new Date().getFullYear(),
          annual: 20,
          sick: 12,
          casual: 5
        }, { onConflict: 'employee_id,year' });
      } catch {}

      if (isExisting) {
        summary.alreadyExists++;
        console.log(`[SYNCED] ${employeeCode} - ${fullName} (${email}) [Auth UUID: ${authUserId}]`);
      } else {
        summary.migrated++;
        console.log(`[MIGRATED] ${employeeCode} - ${fullName} (${email}) [Auth UUID: ${authUserId}]`);
      }

    } catch (err) {
      summary.failed++;
      summary.errors.push({ employee: employeeCode, email, reason: err.message });
      console.error(`[FAILED] ${employeeCode} - ${email}: ${err.message}`);
    }
  }

  console.log(`\n===============================================================`);
  console.log(`MIGRATION SUMMARY`);
  console.log(`===============================================================`);
  console.log(`Total staff found:        ${summary.total}`);
  console.log(`Successfully migrated:    ${summary.migrated + summary.alreadyExists}`);
  console.log(`Newly created in Auth:    ${summary.migrated}`);
  console.log(`Existing updated in DB:   ${summary.alreadyExists}`);
  console.log(`Missing email:            ${summary.missingEmail}`);
  console.log(`Failed:                   ${summary.failed}`);
  console.log(`===============================================================\n`);

  if (summary.errors.length > 0) {
    console.log('Error Details:');
    summary.errors.forEach(e => console.log(` - ${e.employee || 'Unknown'} (${e.email || 'No email'}): ${e.reason}`));
  }
}

migrate().then(() => {
  console.log('Migration process completed.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal migration script failure:', err);
  process.exit(1);
});
