// ==============================================================================
// EDGEWFORCE - ADMIN & MULTI-TENANT ONBOARDING SERVICE
// ==============================================================================

import { db, supabase } from '../config/database.js';
import { supabaseAuthService } from './supabaseAuthService.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { findEmployeeByAnyId, userRef } from '../utils/id.js';
import { isTestMode } from '../utils/runtime.js';

async function auditActorRef(actor) {
  if (!actor) return null;
  if (actor.uuid) return actor.uuid;
  const account = actor.id ? await db.findById('users', actor.id) : null;
  return account?.uuid || (isTestMode ? userRef(actor) : null);
}

export const adminService = {
  /**
   * 5-Step Company Onboarding Wizard
   */
  async onboardCompany(payload, user) {
    const {
      companyInfo,
      structure,
      modules,
      adminUser,
      operationalSettings
    } = payload;

    const initialPassword = adminUser?.password?.trim() || (isTestMode ? 'ChangeMe123!' : '');
    if (adminUser && (initialPassword.length < 8 || (!isTestMode && initialPassword === 'ChangeMe123!'))) {
      throw new Error('Set a unique initial administrator password of at least 8 characters.');
    }

    return await db.transaction(async (trx) => {
      // Step 1: Create Company
      const company = await trx.insert('companies', {
        name: companyInfo.name,
        business_type: companyInfo.business_type || 'FMCG Distribution',
        industry: companyInfo.industry || 'Consumer Goods',
        registration_number: companyInfo.registration_number || `RC-${Date.now().toString().slice(-6)}`,
        email: companyInfo.email,
        phone: companyInfo.phone,
        address: companyInfo.address,
        country: companyInfo.country || 'Nigeria',
        state: companyInfo.state || 'Lagos',
        city: companyInfo.city || 'Lagos',
        logo_url: companyInfo.logo_url || null,
        status: 'active'
      });

      const companyId = company.id;

      // Step 2: Create Settings & Active Modules
      const settings = await trx.insert('company_settings', {
        company_id: companyId,
        working_days: operationalSettings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        working_hours_start: operationalSettings?.working_hours_start || '08:00',
        working_hours_end: operationalSettings?.working_hours_end || '17:00',
        geofence_radius: Number(operationalSettings?.geofence_radius || 150),
        attendance_rules: operationalSettings?.attendance_rules || { require_gps: true, require_selfie: false, auto_checkout: true },
        visit_rules: operationalSettings?.visit_rules || { min_duration_minutes: 15, require_photo: true, require_signature: true },
        sales_targets: operationalSettings?.sales_targets || { monthly_target_ngn: 10000000, commission_percent: 5 },
        currency: operationalSettings?.currency || 'NGN',
        timezone: operationalSettings?.timezone || 'Africa/Lagos',
        active_modules: modules || {
          workforce: true,
          attendance: true,
          field: true,
          sales: true,
          crm: true,
          payments: true,
          inventory: true,
          delivery: true,
          reports: true,
          tracking: true
        }
      });

      // Step 3: Create Organization Structure
      const regionsList = structure?.regions || [{ name: 'Headquarters Region', code: 'HQ-REG' }];
      for (const reg of regionsList) {
        const createdReg = await trx.insert('regions', {
          company_id: companyId,
          name: reg.name,
          code: reg.code || 'REG-1',
          description: reg.description || ''
        });

        if (reg.territories && Array.isArray(reg.territories)) {
          for (const terr of reg.territories) {
            await trx.insert('territories', {
              company_id: companyId,
              region_id: createdReg.id,
              name: terr.name,
              code: terr.code || 'TERR-1'
            });
          }
        }
      }

      // Step 4: Create Company Admin User if provided
      if (adminUser) {
        const passwordHash = bcrypt.hashSync(initialPassword, 10);
        const newUser = await trx.insert('users', {
          company_id: companyId,
          full_name: adminUser.full_name || 'Company Administrator',
          email: adminUser.email,
          password_hash: passwordHash,
          phone: adminUser.phone || '',
          role_code: 'ADMIN',
          status: 'active',
          requires_password_change: true
        });

        await trx.insert('employees', {
          company_id: companyId,
          user_id: userRef(newUser),
          employee_code: `EMP-${Date.now().toString().slice(-4)}`,
          first_name: adminUser.first_name || 'Admin',
          last_name: adminUser.last_name || 'User',
          phone: adminUser.phone || '',
          department: 'Executive Management',
          position: 'Managing Director / Tenant Admin',
          status: 'active'
        });
      }

      // Step 5: Audit Log
      await trx.insert('audit_logs', {
        actor_id: await auditActorRef(user),
        actor_email: user?.email || 'system',
        action: 'COMPANY_ONBOARDED',
        entity: 'companies',
        entity_id: String(companyId),
        metadata: { company_id: companyId, name: company.name, email: company.email }
      });

      return { company, settings };
    });
  },

  async getCompanies() {
    return await db.find('companies');
  },

  async getCompanyById(id) {
    const company = await db.findById('companies', id);
    if (!company) return null;
    const settings = await db.findOne('company_settings', { company_id: company.id });
    return { ...company, settings };
  },

  async updateCompanySettings(companyId, settingsUpdates, user) {
    const existing = await db.findOne('company_settings', { company_id: Number(companyId) });
    let updated;
    if (existing) {
      updated = await db.update('company_settings', existing.id, settingsUpdates);
    } else {
      updated = await db.insert('company_settings', { company_id: Number(companyId), ...settingsUpdates });
    }

    await db.insert('audit_logs', {
      actor_id: await auditActorRef(user),
      actor_email: user?.email || 'admin',
      action: 'COMPANY_SETTINGS_UPDATED',
      entity: 'company_settings',
      entity_id: String(companyId),
      metadata: { company_id: Number(companyId), previous_value: existing || {}, new_value: updated }
    });

    return updated;
  },

  async getSettings(companyId) {
    const compId = Number(companyId || 1);
    let settings = await db.findOne('company_settings', { company_id: compId });
    if (!settings) {
      settings = await db.insert('company_settings', {
        company_id: compId,
        receipt_company_name: 'EXPERIENTIAL EDGE',
        receipt_tagline: 'Integrated Marketing & Commercial Distribution Solutions',
        receipt_title: 'EDGEWFORCE SALES RECEIPT',
        receipt_address: '15 Atiba Osborne, Mende, Maryland, Lagos',
        receipt_phone: '+2348031234567',
        receipt_footer_note: 'Thank you for your business. Verified by EdgeWForce Operating System.'
      });
    }
    return settings;
  },

  async resetStaffPassword(employeeId, newPassword, adminUser) {
    if (!newPassword || newPassword.trim().length < 8 || (!isTestMode && newPassword.trim() === 'ChangeMe123!')) {
      throw new Error('New password must be unique and at least 8 characters.');
    }
    const emp = await findEmployeeByAnyId(db, employeeId);
    if (!emp) throw new Error('Employee not found');

    const passwordHash = bcrypt.hashSync(newPassword.trim(), 10);

    // Find linked user by user_id, email, work_email or phone
    let user = emp.user_id ? await db.findById('users', emp.user_id) : null;
    if (!user) {
      const users = await db.find('users');
      user = users.find(u =>
        (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
        (emp.work_email && u.email && u.email.toLowerCase() === emp.work_email.toLowerCase()) ||
        (emp.personal_email && u.email && u.email.toLowerCase() === emp.personal_email.toLowerCase()) ||
        (emp.phone && u.phone === emp.phone)
      );
    }

    if (user) {
      if (!isTestMode && user.auth_user_id) {
        const updated = await supabaseAuthService.updatePassword(user.auth_user_id, newPassword.trim());
        if (!updated) throw new Error('Supabase Auth password update failed. The existing password was not changed.');
      }
      await db.update('users', user.id, {
        password_hash: passwordHash,
        requires_password_change: true
      });
    } else throw new Error('No user account is linked to this employee. Password was not changed.');

    await db.insert('audit_logs', {
      actor_id: await auditActorRef(adminUser),
      actor_email: adminUser?.email || 'it_admin',
      action: 'STAFF_PASSWORD_RESET',
      entity: 'employees',
      entity_id: String(emp.id),
      metadata: { company_id: emp.company_id || 1, employee_code: emp.employee_code, email: emp.email }
    });

    return {
      success: true,
      message: `Password successfully updated for ${emp.first_name} ${emp.last_name} (${emp.employee_code}).`
    };
  },

  async getStructure(companyId) {
    const compId = Number(companyId || 1);
    const regions = await db.find('regions', { company_id: compId });
    const territories = await db.find('territories', { company_id: compId });
    const teams = await db.find('teams', { company_id: compId });
    const branches = await db.find('branches', { company_id: compId });
    const warehouses = await db.find('warehouses', { company_id: compId });
    return { regions, territories, teams, branches, warehouses };
  },

  async getAuditLogs(companyId, limit = 50) {
    const logs = await db.find('audit_logs', {}, {
      order: { column: 'created_at', ascending: false },
      ...(companyId ? {} : { limit })
    });
    return companyId
      ? logs.filter(log => Number(log.metadata?.company_id) === Number(companyId)).slice(0, limit)
      : logs;
  }
};
