// ==============================================================================
// EDGEWFORCE - SHARED WORKFORCE DATA ROUTES
// ==============================================================================

import express from 'express';
import { db } from '../config/database.js';
import { hrController } from '../controllers/hrController.js';
import { requireAuth } from '../middleware/auth.js';
import { employeeRef } from '../utils/id.js';

import { scheduleController } from '../controllers/scheduleController.js';
import { hasRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/employees', requireAuth, hrController.getEmployees);
router.get('/staff', requireAuth, hrController.getEmployees);

// Supervisor Schedule Review Endpoints
router.get(
  '/schedules',
  requireAuth,
  hasRole('SUPERVISOR', 'MANAGER', 'CEO', 'CTO', 'HR', 'HR_MANAGER', 'IT_ADMIN', 'SUPER_ADMIN', 'ADMIN'),
  scheduleController.getSupervisorSchedules
);
router.put(
  '/schedules/:id/review',
  requireAuth,
  hasRole('SUPERVISOR', 'MANAGER', 'CEO', 'CTO', 'HR', 'HR_MANAGER', 'IT_ADMIN', 'SUPER_ADMIN', 'ADMIN'),
  scheduleController.reviewSupervisorSchedule
);

router.get('/ranks', async (req, res) => {
  try {
    const ranks = await db.find('ranks', {}, { order: { column: 'level', ascending: true } });
    res.json({ success: true, data: ranks, ranks });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await db.find('announcements', {}, { order: { column: 'created_at', ascending: false } });
    res.json({ success: true, data: announcements, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/holidays', async (req, res) => {
  try {
    const holidays = await db.find('holidays', {}, { order: { column: 'date', ascending: true } });
    res.json({ success: true, data: holidays, holidays });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const empId = req.user.employee?.id || req.user.id;
    const notifications = await db.find('notifications', { employee_id: req.user.employee ? employeeRef(req.user.employee) : empId }, { order: { column: 'created_at', ascending: false } });
    res.json({ success: true, data: notifications, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
