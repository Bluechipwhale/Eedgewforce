// ==============================================================================
// EDGEWFORCE - SUPABASE AUTHENTICATION SERVICE MANAGER
// Authoritative Identity Provisioning, Authentication, and Password Lifecycle
// ==============================================================================

import { supabase, supabaseAdmin, createSupabaseAuthClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { isTestMode } from '../utils/runtime.js';
const CLIENT_URL = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'http://localhost:5173';

export function recoveryRedirectUrl(requestOrigin) {
  let base = CLIENT_URL;
  if (requestOrigin) {
    try {
      const parsed = new URL(requestOrigin);
      if (['http:', 'https:'].includes(parsed.protocol) && parsed.origin === requestOrigin) {
        base = parsed.origin;
      }
    } catch {}
  }
  return `${base.replace(/\/$/, '')}/`;
}

export const supabaseAuthService = {
  /**
   * Provisions a real user in Supabase Auth (auth.users).
   * Strictly server-side via Supabase Admin API with Service Role Key.
   */
  async provisionUser({ email, password, fullName, roleCode, employeeCode }) {
    if (isTestMode) {
      return { authUserId: '00000000-0000-0000-0000-000000000001', user: { id: '00000000-0000-0000-0000-000000000001', email } };
    }
    if (!email) {
      throw new Error('Email address is required for Supabase authentication.');
    }
    const cleanEmail = email.toLowerCase().trim();
    if (typeof password !== 'string' || password.trim().length < 8) {
      throw new Error('A unique password of at least 8 characters is required for Supabase authentication.');
    }

    if (!supabaseAdmin?.auth?.admin) {
      throw new Error('Supabase Admin client is not configured on the server. SUPABASE_SERVICE_ROLE_KEY is required.');
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Staff Member',
        role_code: roleCode || 'EMPLOYEE',
        employee_code: employeeCode || null
      }
    });

    if (error) {
      if (error.message?.includes('already registered') || error.code === 'email_exists') {
        // Attempt to find existing user
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
          if (existing?.id) {
            logger.info(`Supabase Auth: Matched existing user ${cleanEmail} (ID: ${existing.id})`);
            return { authUserId: existing.id, user: existing, isExisting: true };
          }
        } catch {}
        throw new Error(`Email address "${cleanEmail}" is already registered in Supabase Authentication.`);
      }
      logger.error(`Supabase Auth admin.createUser failed for ${cleanEmail}: ${error.message}`);
      throw new Error(`Supabase Auth creation failed: ${error.message}`);
    }

    if (!data?.user?.id) {
      throw new Error('Supabase Auth did not return a valid user ID.');
    }

    logger.info(`Supabase Auth: Admin provisioned user ${cleanEmail} (ID: ${data.user.id})`);
    return { authUserId: data.user.id, user: data.user, isExisting: false };
  },

  /**
   * Deletes a user from Supabase Auth (used for atomic rollback).
   */
  async deleteUser(authUserId) {
    if (isTestMode || !authUserId || !supabaseAdmin?.auth?.admin) return false;
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (!error) {
        logger.info(`Supabase Auth: Successfully rolled back user ${authUserId}`);
        return true;
      }
      logger.warn(`Supabase Auth delete rollback note: ${error.message}`);
    } catch (err) {
      logger.warn(`Supabase Auth delete rollback error: ${err.message}`);
    }
    return false;
  },

  /**
   * Authenticates user against Supabase Auth using email and password.
   */
  async signIn({ email, password }) {
    if (isTestMode || !createSupabaseAuthClient || !email || !password) return null;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const res = await createSupabaseAuthClient().auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      return res;
    } catch (err) {
      return { data: null, error: err };
    }
  },

  /**
   * Sends an official Supabase password reset email.
   */
  async requestPasswordReset(email, requestOrigin = null) {
    if (isTestMode || !createSupabaseAuthClient || !email) return { error: new Error('Supabase not configured') };
    try {
      const cleanEmail = email.toLowerCase().trim();
      const redirectTo = recoveryRedirectUrl(requestOrigin);
      const res = await createSupabaseAuthClient().auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      return res;
    } catch (err) {
      return { error: err };
    }
  },

  /**
   * Updates user password in Supabase Auth.
   */
  async updatePassword(authUserId, newPassword) {
    if (isTestMode || !newPassword) return false;
    if (supabaseAdmin?.auth?.admin && authUserId) {
      try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: newPassword
        });
        if (!error) return true;
      } catch (err) {
        logger.warn(`Supabase Admin password update notice: ${err.message}`);
      }
    }
    return false;
  },

  /**
   * Validates access token with Supabase Auth.
   */
  async getUserFromToken(token) {
    if (isTestMode || !supabase?.auth || !token) return null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return data.user;
      }
    } catch {}
    return null;
  }
};
