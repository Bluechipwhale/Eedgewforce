// ==============================================================================
// EDGEWFORCE - TASK INTELLIGENCE & REMINDER CONTROLLER
// ==============================================================================

import { taskService } from '../services/taskService.js';
import { reminderService } from '../services/reminderService.js';
import { idleService } from '../services/idleService.js';
import { reminderWorker } from '../services/reminderWorker.js';
import { getTaskDirectory } from '../services/taskDirectoryService.js';
import { employeeRef, userRef } from '../utils/id.js';

export const taskController = {
  async getEmployees(req, res) {
    try {
      const employees = await getTaskDirectory(req.user);
      res.json({ success: true, data: employees, employees });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },
  async createTask(req, res) {
    try {
      const task = await taskService.createTask(req.body, req.user, req);
      res.status(201).json({ success: true, data: task, task, message: 'Task and proactive multi-channel reminders created successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getTasks(req, res) {
    try {
      const filters = {
        employee_id: req.query.employee_id || (req.query.mine === 'true' ? (req.user.employee ? employeeRef(req.user.employee) : (userRef(req.user) || req.user.id)) : null),
        status: req.query.status,
        today: req.query.today === 'true'
      };
      const tasks = await taskService.getTasks(filters, req.user);
      res.json({ success: true, data: tasks, tasks });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getDiscussion(req, res) {
    try { res.json({ success: true, data: await taskService.getDiscussion(req.params.id, req.user) }); }
    catch (err) { res.status(404).json({ success: false, error: { message: err.message } }); }
  },
  async addComment(req, res) {
    try {
      const comment = await taskService.addComment(req.params.id, req.body?.comment, req.user, req);
      res.status(201).json({ success: true, data: comment });
    } catch (err) { res.status(400).json({ success: false, error: { message: err.message } }); }
  },

  async acknowledgeTask(req, res) {
    try {
      const task = await taskService.acknowledgeTask(req.params.id, req.user, req);
      res.json({ success: true, data: task, message: 'Task reminder acknowledged.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async completeTask(req, res) {
    try {
      const task = await taskService.completeTask(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: task, message: 'Task completed successfully and future reminders cancelled.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async updateDeliveryStages(req, res) {
    try {
      const task = await taskService.updateDeliveryStages(req.params.id, req.body.stages, req.user, req);
      res.json({ success: true, data: task, message: 'Delivery milestones updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async scheduleReminder(req, res) {
    try {
      const rem = await reminderService.scheduleReminder({
        ...req.body,
        task_id: req.params.id,
        user_id: userRef(req.user) || req.user.id,
        employee_id: req.user.employee ? employeeRef(req.user.employee) : null
      });
      res.status(201).json({ success: true, data: rem, message: 'Reminder scheduled.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getDeliveryLogs(req, res) {
    try {
      const logs = await reminderService.getDeliveryLogs(req.params.id || null);
      res.json({ success: true, data: logs, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getAnalytics(req, res) {
    try {
      const [reminderStats, idleStats] = await Promise.all([
        reminderService.getReminderAnalytics(),
        idleService.getIdleAnalytics()
      ]);
      res.json({ success: true, data: { ...reminderStats, idle: idleStats } });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async runWorkerCycle(req, res) {
    try {
      await reminderWorker.processDueReminders();
      res.json({ success: true, message: 'Reminder worker cycle executed.' });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // Idle Telemetry endpoints
  async logIdle(req, res) {
    try {
      const session = await idleService.startIdleSession(req.body, req.user, req);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async explainIdle(req, res) {
    try {
      const session = await idleService.explainIdleSession(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: session, message: 'Activity explanation recorded.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getIdleReports(req, res) {
    try {
      const reports = await idleService.getIdleSessions(req.query);
      res.json({ success: true, data: reports, reports });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};
