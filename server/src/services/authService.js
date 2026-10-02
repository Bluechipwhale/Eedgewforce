// ==============================================================================
// EDGEWFORCE - SUPABASE AUTHORITATIVE AUTHENTICATION SERVICE
// Single Source of Truth for Identity, Session Validation & Password Lifecycle
// ==============================================================================

import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { db, supabase, supabaseAdmin } from '../config/database.js';
import { supabaseAuthService } from './supabaseAuthService.js';
import { signUserToken } from '../middleware/auth.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { emailService } from './emailService.js';
import { normalizePhone, isEmail, normalizeEmail } from '../utils/phoneNormalizer.js';
import { logger } from '../utils/logger.js';
import { employeeRef, userRef } from '../utils/id.js';
import { isTestMode } from '../utils/runtime.js';
import { isServiceUnavailable } from '../utils/serviceAvailability.js';
const CLIENT_URL = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'http://localhost:5173';

function normalizeEmployeeRole(roleName) {
  const normalized = String(roleName || '').trim().toUpperCase();
  const aliases = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    AGENT_ADMIN: 'ADMIN',
    SUPERVISOR: 'SUPERVISOR',
    SALES_AGENT: 'SALES_AGENT',
    FIELD_AGENT: 'FIELD_AGENT',
    HR_MANAGER: 'HR_MANAGER',
    STAFF: 'EMPLOYEE'
  };
  return aliases[normalized] || normalized || 'EMPLOYEE';
}

async function userFromEmployee(employee) {
  if (!employee?.user_id) return null;

  const role = employee.role_id ? await db.findById('roles', employee.role_id) : null;
  const email = employee.work_email || employee.personal_email || employee.email;
  const fullName = employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(' ').trim();

  return {
    id: employee.user_id,
    uuid: employee.user_id,
    auth_user_id: employee.user_id,
    company_id: employee.company_id,
    full_name: fullName || employee.employee_code || 'Staff Member',
    email,
    phone: employee.phone,
    role_code: normalizeEmployeeRole(role?.name),
    status: employee.status || 'active',
    requires_password_change: Boolean(employee.requires_password_change),
    onboarding_status: employee.onboarding_status || 'Active',
    employee
  };
}

export async function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const trimmedInput = String(identifier).trim();
  let user = null;

  if (isEmail(trimmedInput)) {
    const normalizedEmail = normalizeEmail(trimmedInput);
    user = await db.findOne('users', { email: normalizedEmail });
    if (!user) {
      const users = await db.find('users');
      user = users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail) || null;
    }
    if (!user && (normalizedEmail === 'itadmin@edgewforce.com' || normalizedEmail === 'it-admin@edgewforce.com')) {
      user = await db.findOne('users', { email: 'it@edgewforce.com' }) || await db.findOne('users', { email: 'admin@edgewforce.com' });
    }
    if (!user) {
      const employees = await db.find('employees');
      const emp = employees.find(e => 
        (e.work_email && normalizeEmail(e.work_email) === normalizedEmail) ||
        (e.personal_email && normalizeEmail(e.personal_email) === normalizedEmail) ||
        (e.email && normalizeEmail(e.email) === normalizedEmail)
      );
      if (emp?.user_id) {
        user = await db.findById('users', emp.user_id) || await userFromEmployee(emp);
      }
    }
  }

  if (!user) {
    const normalizedPhone = normalizePhone(trimmedInput);
    if (normalizedPhone) {
      user = await db.findOne('users', { phone: normalizedPhone });
      if (!user) {
        const employees = await db.find('employees');
        const emp = employees.find(e => normalizePhone(e.phone) === normalizedPhone);
        if (emp?.user_id) {
          user = await db.findById('users', emp.user_id) || await userFromEmployee(emp);
        }
      }
    }
  }

  // Fallback: Support login via Staff ID / Employee Code (e.g. EMP-1001, EMP-003, 003)
  if (!user) {
    const employees = await db.find('employees');
    const cleanInput = trimmedInput.toUpperCase();
    const numOnly = cleanInput.replace(/[^0-9]/g, '');
    const emp = employees.find(e => {
      const empCode = (e.employee_code || '').toUpperCase();
      const staffId = String(e.staff_id || '').toUpperCase();
      const empNum = empCode.replace(/[^0-9]/g, '');
      return (
        empCode === cleanInput ||
        staffId === cleanInput ||
        (numOnly && empNum === numOnly) ||
        (numOnly && staffId === numOnly)
      );
    });
    if (emp?.user_id) {
      user = await db.findById('users', emp.user_id) || await userFromEmployee(emp);
    }
  }

  return user;
}

export const authService = {
  /**
   * Logs in an enterprise user via Supabase Auth with linked profile resolution.
   */
  async login(identifier, password, req = null) {
    if (!identifier || !password) {
      throw new Error('Please enter your email address or phone number, and your password.');
    }

    const user = await findUserByIdentifier(identifier);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'active') {
      throw new Error('This account has been deactivated. Please contact your HR administrator.');
    }

    let token = null;
    let refresh_token = null;
    let authUser = null;

    // 1. Supabase Auth Verification (Production / Live Cloud Mode)
    if (!isTestMode && user.email) {
      try {
        const sbRes = await supabaseAuthService.signIn({
          email: user.email,
          password
        });

        if (sbRes?.data?.session) {
          token = sbRes.data.session.access_token;
          refresh_token = sbRes.data.session.refresh_token;
          authUser = sbRes.data.user;

          if (authUser && user.auth_user_id !== authUser.id) {
            await db.update('users', user.id, { auth_user_id: authUser.id });
            user.auth_user_id = authUser.id;
          }
        } else if (sbRes?.error) {
          if (isServiceUnavailable(sbRes.error)) throw sbRes.error;
          if (user.auth_user_id) throw new Error('Invalid email or password.');
          // Check if local bcrypt password matches (e.g. initial seed account / offline record)
          const isMatch = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
          if (isMatch) {
            // Auto-provision and sync seamlessly into Supabase Auth!
            try {
              const provisionRes = await supabaseAuthService.provisionUser({
                email: user.email,
                password,
                fullName: user.full_name,
                roleCode: user.role_code
              });
              if (provisionRes?.authUserId) {
                await db.update('users', user.id, { auth_user_id: provisionRes.authUserId });
                user.auth_user_id = provisionRes.authUserId;
                // Re-attempt sign-in with the freshly synced Supabase user
                const retryLogin = await supabaseAuthService.signIn({ email: user.email, password });
                if (retryLogin?.data?.session) {
                  token = retryLogin.data.session.access_token;
                  refresh_token = retryLogin.data.session.refresh_token;
                }
              }
            } catch (syncErr) {
              logger.warn(`Supabase seed sync note: ${syncErr.message}`);
            }
          }

          if (!token) {
            if (isMatch) {
              throw new Error('Unable to establish your Supabase session. Please contact your administrator.');
            } else {
              throw new Error('Invalid email or password.');
            }
          }
        }
      } catch (err) {
        if (isServiceUnavailable(err)) throw err;
        if (err.message.includes('Invalid email or password') || err.message.includes('Invalid login credentials')) {
          throw err;
        }
        logger.warn(`Supabase login attempt note: ${err.message}`);
      }
    }

    // 2. Fallback Verification (Local Store / Test Mode)
    if (!token) {
      if (!isTestMode && user.email) throw new Error('Unable to verify your Supabase session. Please try again.');
      const isMatch = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
      if (!isMatch) {
        throw new Error('Invalid login credentials.');
      }
      token = signUserToken(user);
    }

    // Update last login timestamp asynchronously
    db.update('users', user.id, { last_login_at: new Date().toISOString() }).catch(() => {});
    recordAudit(user, 'LOGIN', 'users', user.id, { email: user.email, phone: user.phone }, req).catch(() => {});

    const employee = await db.findOne('employees', { user_id: userRef(user) }) ||
                     await db.findOne('employees', { user_id: user.id }) ||
                     (user.auth_user_id ? await db.findOne('employees', { auth_user_id: user.auth_user_id }) : null);

    const [rank, department] = await Promise.all([
      employee?.rank_code ? db.findOne('ranks', { code: employee.rank_code }) : null,
      employee?.department_id ? db.findById('departments', employee.department_id) : (employee?.department ? { name: employee.department } : null)
    ]);

    const userProfile = {
      id: user.id,
      uuid: user.uuid || user.auth_user_id || user.id,
      auth_user_id: user.auth_user_id || user.uuid || null,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role_code: user.role_code,
      status: user.status,
      requires_password_change: Boolean(user.requires_password_change),
      onboarding_status: user.onboarding_status || 'Active',
      employee,
      rank,
      department
    };

    return {
      token,
      refresh_token,
      user: userProfile
    };
  },

  /**
   * Gets current user session profile.
   */
  async me(userId) {
    let user = await db.findById('users', userId) ||
               await db.findOne('users', { auth_user_id: userId }) ||
               await db.findOne('users', { uuid: userId });

    if (!user) throw new Error('User not found');

    const employee = await db.findOne('employees', { user_id: userRef(user) }) ||
                     await db.findOne('employees', { user_id: user.id }) ||
                     (user.auth_user_id ? await db.findOne('employees', { auth_user_id: user.auth_user_id }) : null);

    const [rank, department] = await Promise.all([
      employee?.rank_code ? db.findOne('ranks', { code: employee.rank_code }) : null,
      employee?.department_id ? db.findById('departments', employee.department_id) : (employee?.department ? { name: employee.department } : null)
    ]);

    return {
      id: user.id,
      uuid: user.uuid || user.auth_user_id || user.id,
      auth_user_id: user.auth_user_id || user.uuid || null,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role_code: user.role_code,
      status: user.status,
      requires_password_change: Boolean(user.requires_password_change),
      onboarding_status: user.onboarding_status || 'Active',
      employee,
      rank,
      department
    };
  },

  /**
   * Changes user password securely.
   */
  async changePassword(userId, currentPassword, newPassword, req = null) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const user = await db.findById('users', userId) ||
                 await db.findOne('users', { auth_user_id: userId }) ||
                 await db.findOne('users', { uuid: userId });

    if (!user) throw new Error('User not found');

    if (!currentPassword) throw new Error('Current password is required.');
    if (!isTestMode && user.auth_user_id) {
      const verification = await supabaseAuthService.signIn({ email: user.email, password: currentPassword });
      if (!verification?.data?.session) throw new Error('Current password is incorrect.');
    } else if (user.password_hash) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        throw new Error('Current password is incorrect.');
      }
    }

    // 1. Update in Supabase Auth if linked
    if (!isTestMode && user.auth_user_id) {
      if (!await supabaseAuthService.updatePassword(user.auth_user_id, newPassword)) {
        throw new Error('Password could not be updated in Supabase. Please try again.');
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update('users', user.id, {
      password_hash: newHash,
      requires_password_change: false
    });

    await recordAudit(user, 'PASSWORD_CHANGED', 'users', user.id, {}, req);

    return { message: 'Password updated successfully.' };
  },

  /**
   * Registers a new staff member with Supabase Auth integration.
   */
  async registerEmployee(data, actor = null, req = null) {
    const { full_name, email, password, phone, role_code, rank_code, department, position, base_salary } = data;

    if (!full_name || !password) {
      throw new Error('Full name and password are required.');
    }

    if (!email && !phone) {
      throw new Error('Please provide an email address or phone number.');
    }

    if (!isTestMode && !supabaseAdmin) {
      throw new Error('Registration is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server before registering staff.');
    }

    let normalizedEmail = null;
    if (email && email.trim()) {
      normalizedEmail = normalizeEmail(email);
      const existing = await db.findOne('users', { email: normalizedEmail });
      if (existing) {
        throw new Error('Email already registered.');
      }
    }

    let normalizedPhone = null;
    if (phone && String(phone).trim()) {
      normalizedPhone = normalizePhone(phone);
      const existingPhone = await db.findOne('users', { phone: normalizedPhone }) || await db.findOne('employees', { phone: normalizedPhone });
      if (existingPhone) {
        throw new Error('Phone number already registered.');
      }
    }

    let authUserId = null;

    // 1. Create Supabase Auth User via unified Supabase Auth Service
    if (!isTestMode && normalizedEmail) {
      try {
        const sbResult = await supabaseAuthService.provisionUser({
          email: normalizedEmail,
          password,
          fullName: full_name,
          roleCode: role_code || 'EMPLOYEE'
        });
        if (sbResult?.authUserId) {
          authUserId = sbResult.authUserId;
        }
      } catch (err) {
        logger.warn(`Supabase account creation notice: ${err.message}`);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      auth_user_id: authUserId,
      uuid: authUserId || undefined,
      full_name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash: passwordHash,
      role_code: role_code || 'EMPLOYEE',
      status: 'active'
    });

    if (!user?.id) {
      throw new Error('User account was not saved to Supabase.');
    }

    const empCode = Number.isFinite(Number(user.id)) ? `EMP-${1000 + Number(user.id)}` : `EMP-${Date.now().toString().slice(-6)}`;
    const [firstName, ...rest] = full_name.split(' ');
    const lastName = rest.join(' ') || firstName;

    const employee = await db.insert('employees', {
      user_id: userRef(user) || user.id,
      auth_user_id: authUserId,
      employee_code: empCode,
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      department: department || 'Operations',
      position: position || 'Staff Member',
      rank_code: rank_code || 'STAFF',
      base_salary: Number(base_salary || 350000)
    });

    if (!employee?.id) {
      throw new Error('Employee profile was not saved to Supabase.');
    }

    // Initialize leave balance
    await db.insert('leave_balances', {
      employee_id: employeeRef(employee),
      year: new Date().getFullYear(),
      annual: 20,
      sick: 12,
      casual: 5
    });

    await recordAudit(actor || user, 'EMPLOYEE_CREATED', 'employees', employee.id, { employee_code: empCode, email: normalizedEmail, phone: normalizedPhone }, req);

    return { user, employee };
  },

  /**
   * Generates a password recovery request using Supabase Auth.
   */
  async forgotPassword(identifier, req = null) {
    if (!identifier) throw new Error('Please provide your registered corporate email address or Staff ID.');
    const user = await findUserByIdentifier(identifier);

    let supabaseRecoveryDispatched = false;
    const targetEmail = user?.email || (isEmail(identifier) ? normalizeEmail(identifier) : null);

    // 1. Supabase Auth Recovery Dispatch (Official Cloud Flow)
    if (!isTestMode && targetEmail) {
      try {
        const { error } = await supabaseAuthService.requestPasswordReset(targetEmail, req?.headers?.origin);
        if (!error) {
          supabaseRecoveryDispatched = true;
        }
      } catch (err) {
        logger.warn(`Supabase resetPasswordForEmail note: ${err.message}`);
      }
    }

    // 2. Deterministic Reset Token for Test Suite / Legacy Compatibility
    if (!isTestMode) {
      return {
        success: true,
        message: 'If this account supports email recovery, a password recovery link has been requested. Please check your inbox.'
      };
    }
    const resetToken = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    if (user) {
      await db.update('users', user.id, {
        reset_token: resetToken,
        reset_token_expires_at: expiresAt
      });
      await recordAudit(user, 'PASSWORD_RESET_REQUESTED', 'users', user.id, { identifier }, req).catch(() => {});
    }

    let emailDelivered = supabaseRecoveryDispatched;
    if (!emailDelivered && targetEmail && isTestMode) {
      try {
        const emailResult = await emailService.sendPasswordResetEmail(targetEmail, resetToken, user?.full_name || 'Staff Member');
        emailDelivered = emailResult.delivered;
      } catch {
        emailDelivered = false;
      }
    }

    const targetIdentifier = user ? (user.email || user.phone || identifier) : identifier;
    const msg = emailDelivered || supabaseRecoveryDispatched
      ? `A password recovery link has been sent to ${targetEmail || targetIdentifier}. Please check your inbox.`
      : `If an account exists for ${targetIdentifier}, password recovery instructions have been processed.`;

    return {
      success: true,
      message: msg,
      reset_token: resetToken,
      identifier: targetIdentifier,
      email_sent: emailDelivered || supabaseRecoveryDispatched
    };
  },

  /**
   * Resets password using Supabase Auth or verified token.
   */
  async resetPassword(identifier, token, newPassword, req = null) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    let user;
    if (isTestMode) {
      user = identifier ? await findUserByIdentifier(identifier) : null;
      if (!user || !token || user.reset_token !== token || !(Date.parse(user.reset_token_expires_at) > Date.now())) {
        throw new Error('Invalid or expired recovery token. Please request a new recovery link.');
      }
    } else {
      const verified = token ? await supabaseAuthService.getUserFromToken(token) : null;
      if (!verified?.id) throw new Error('Invalid or expired recovery session. Please request a new recovery link.');
      user = await db.findOne('users', { auth_user_id: verified.id });
      if (!user) throw new Error('No staff account is linked to this recovery session.');
      if (!await supabaseAuthService.updatePassword(verified.id, newPassword)) {
        throw new Error('Password could not be updated in Supabase. Please try again.');
      }
    }

    if (user) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await db.update('users', user.id, {
        password_hash: newHash,
        ...(isTestMode ? { reset_token: null, reset_token_expires_at: null } : {}),
        requires_password_change: false
      });
      await recordAudit(user, 'PASSWORD_RESET_COMPLETED', 'users', user.id, { identifier }, req).catch(() => {});
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    };
  }
};
