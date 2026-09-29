// ==============================================================================
// EDGEWFORCE - AUTHENTICATION ROUTES
// ==============================================================================

import express from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { hasRole } from '../middleware/rbac.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', requireAuth, hasRole('SUPER_ADMIN', 'CEO', 'CTO', 'IT_ADMIN', 'HR', 'HR_MANAGER', 'ADMIN'), authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);
router.post('/change-password', requireAuth, authController.changePassword);

export default router;

