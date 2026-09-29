// ==============================================================================
// EDGEWFORCE - TASK INTELLIGENCE & REMINDER ROUTES
// ==============================================================================

import express from 'express';
import { taskController } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// Task Management & Delivery Lifecycle
router.get('/assignable-employees', taskController.getEmployees);
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id/discussion', taskController.getDiscussion);
router.post('/:id/discussion', taskController.addComment);
router.get('/analytics', taskController.getAnalytics);
router.post('/worker/cycle', taskController.runWorkerCycle);

router.post('/:id/acknowledge', taskController.acknowledgeTask);
router.post('/:id/complete', taskController.completeTask);
router.put('/:id/delivery-stages', taskController.updateDeliveryStages);

// Reminders & Delivery Logs
router.post('/:id/reminders', taskController.scheduleReminder);
router.get('/:id/delivery-logs', taskController.getDeliveryLogs);
router.get('/delivery-logs', taskController.getDeliveryLogs);

// Inactivity & Idle Telemetry
router.post('/idle/start', taskController.logIdle);
router.post('/idle/:id/explain', taskController.explainIdle);
router.get('/idle/reports', taskController.getIdleReports);

export default router;
