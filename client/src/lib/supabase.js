// ==============================================================================
// EDGEWFORCE - CLIENT-SIDE SUPABASE AUTH & API CLIENT
// Configures official Supabase Client with Session Persistence & Auto-Refresh
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'ewf_supabase_auth'
      }
    })
  : null;

/**
 * Helper to get the current valid Supabase session
 */
export async function getSupabaseSession() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

/**
 * Helper to get the active Supabase access token
 */
export async function getSupabaseAccessToken() {
  const session = await getSupabaseSession();
  return session?.access_token || null;
}

/**
 * Helper to log in with Supabase Auth (Email + Password)
 */
export async function signInWithSupabase(email, password) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Helper to trigger Supabase password reset email with environment-aware redirect URL
 */
export async function requestSupabasePasswordReset(email) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  
  // Production vs Local redirect URL
  const origin = window.location.origin;
  const redirectTo = `${origin}/`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo
  });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Helper to update user password in Supabase Auth during active recovery session
 */
export async function updateSupabasePassword(newPassword) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Helper to log out of Supabase Auth
 */
export async function signOutSupabase() {
  localStorage.removeItem('ewf_token');
  localStorage.removeItem('ewf_user');
  localStorage.removeItem('ewf_current_tab');
  localStorage.removeItem('ewf_supabase_auth');

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors during logout
    }
  }
}
