// ==============================================================================
// EDGEWFORCE - ADMIN & MULTI-TENANT ONBOARDING SERVICE
// ==============================================================================

import { db, supabase } from '../config/database.js';
import { supabaseAuthService } from './supabaseAuthService.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { findEmployeeByAnyId } from '../utils/id.js';
import { isTestMode } from '../utils/runtime.js';

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
        const passwordHash = bcrypt.hashSync(adminUser.password || 'ChangeMe123!', 10);
        const newUser = await trx.insert('users', {
          company_id: companyId,
          full_name: adminUser.full_name || 'Company Administrator',
          email: adminUser.email,
          password_hash: passwordHash,
          phone: adminUser.phone || '',
          role_code: 'ADMIN',
          status: 'active'
        });

        await trx.insert('employees', {
          company_id: companyId,
          user_id: newUser.id,
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
        company_id: companyId,
        user_id: user?.id || null,
        user_email: user?.email || 'system',
        action: 'COMPANY_ONBOARDED',
        entity: 'companies',
        entity_id: String(companyId),
        new_value: { name: company.name, email: company.email }
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
      company_id: Number(companyId),
      user_id: user?.id || null,
      user_email: user?.email || 'admin',
      action: 'COMPANY_SETTINGS_UPDATED',
      entity: 'company_settings',
      entity_id: String(companyId),
      previous_value: existing || {},
      new_value: updated
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
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    const emp = await findEmployeeByAnyId(db, employeeId);
    if (!emp) throw new Error('Employee not found');

    const bcrypt = (await import('bcryptjs')).default;
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
        try {
          await supabaseAuthService.updatePassword(user.auth_user_id, newPassword.trim());
        } catch (sbErr) {
          logger.warn(`Supabase admin password update note: ${sbErr.message}`);
        }
      }
      await db.update('users', user.id, {
        password_hash: passwordHash,
        requires_password_change: false
      });
    }

    await db.insert('audit_logs', {
      company_id: emp.company_id || 1,
      user_id: adminUser?.id || null,
      user_email: adminUser?.email || 'it_admin',
      action: 'STAFF_PASSWORD_RESET',
      entity: 'employees',
      entity_id: String(emp.id),
      previous_value: {},
      new_value: { employee_code: emp.employee_code, email: emp.email }
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
    const filter = companyId ? { company_id: Number(companyId) } : {};
    return await db.find('audit_logs', filter, {
      order: { column: 'created_at', ascending: false },
      limit
    });
  }
};
