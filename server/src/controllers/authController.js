// ==============================================================================
// EDGEWFORCE - AUTHENTICATION CONTROLLER
// ==============================================================================

import { authService } from '../services/authService.js';
import { isServiceUnavailable, sendServiceUnavailable } from '../utils/serviceAvailability.js';

export const authController = {
  async login(req, res) {
    try {
      const { email, identifier, phone, password } = req.body;
      const idToUse = identifier || email || phone;
      const result = await authService.login(idToUse, password, req);
      res.json({ success: true, data: result, token: result.token, user: result.user, message: 'Signed in successfully.' });
    } catch (err) {
      if (isServiceUnavailable(err)) return sendServiceUnavailable(res);
      res.status(400).json({ success: false, error: { code: 'AUTH_FAILED', message: err.message } });
    }
  },

  async me(req, res) {
    try {
      const user = await authService.me(req.user.id);
      res.json({ success: true, data: user, user });
    } catch (err) {
      if (isServiceUnavailable(err)) return sendServiceUnavailable(res);
      if (err.message === 'User not found') {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: err.message } });
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load your profile.' } });
    }
  },

  async logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully.' });
  },

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const result = await authService.changePassword(req.user.id, current_password, new_password, req);
      res.json({ success: true, message: result.message });
    } catch (err) {
      res.status(400).json({ success: false, error: { code: 'PASSWORD_CHANGE_FAILED', message: err.message } });
    }
  },

  async register(req, res) {
    try {
      const result = await authService.registerEmployee(req.body, req.user || null, req);
      res.status(201).json({ success: true, data: result, message: 'Employee registered successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { code: 'REGISTRATION_FAILED', message: err.message } });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email, identifier, phone } = req.body;
      const idToUse = identifier || email || phone;
      const result = await authService.forgotPassword(idToUse, req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: { code: 'FORGOT_PASSWORD_FAILED', message: err.message } });
    }
  },

  async resetPassword(req, res) {
    try {
      const { email, identifier, phone, token, new_password } = req.body;
      const idToUse = identifier || email || phone;
      const result = await authService.resetPassword(idToUse, token, new_password, req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: { code: 'RESET_PASSWORD_FAILED', message: err.message } });
    }
  }
};

