// ==============================================================================
// EDGEWFORCE - DAILY SCHEDULER & WORKFORCE ROSTER CONTROLLER
// Handles requests for staff daily scheduling, supervisor review & HR compliance
// ==============================================================================

import { scheduleService } from '../services/scheduleService.js';
import { db } from '../config/database.js';
import { employeeRef, userRef } from '../utils/id.js';

async function resolveEmployeeId(req) {
  if (req.user?.employee) return employeeRef(req.user.employee);
  const userId = userRef(req.user) || req.user.id;
  const emp = await db.findOne('employees', { user_id: userId }) ||
    await db.findOne('employees', { user_id: req.user.id });
  if (emp) return employeeRef(emp);
  return req.user.id;
}

export const scheduleController = {
  /**
   * GET /api/employee/schedule or /api/schedules/mine
   */
  async getMySchedules(req, res) {
    try {
      const empId = await resolveEmployeeId(req);
      const schedules = await scheduleService.getEmployeeSchedules(empId, req.query);
      res.json({ success: true, data: schedules });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * GET /api/employee/schedule/today or /api/schedules/today
   */
  async getTodaySchedule(req, res) {
    try {
      const empId = await resolveEmployeeId(req);
      const schedule = await scheduleService.getTodaySchedule(empId);
      res.json({ success: true, data: schedule });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * POST /api/employee/schedule or /api/schedules
   */
  async submitSchedule(req, res) {
    try {
      const empId = await resolveEmployeeId(req);
      const result = await scheduleService.createOrUpdateSchedule(empId, req.body, req);
      res.status(201).json({
        success: true,
        data: result,
        message: result.status === 'DRAFT' ? 'Schedule saved as draft.' : 'Daily schedule submitted to your Supervisor and HR successfully!'
      });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * PUT /api/schedules/:id/tasks/:taskId
   */
  async updateTaskStatus(req, res) {
    try {
      const empId = await resolveEmployeeId(req);
      const updated = await scheduleService.updateTaskItemStatus(req.params.id, empId, req.params.taskId, req.body.status);
      res.json({ success: true, data: updated, message: 'Task status updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * DELETE /api/schedules/:id
   */
  async deleteSchedule(req, res) {
    try {
      const empId = await resolveEmployeeId(req);
      await scheduleService.deleteSchedule(req.params.id, empId);
      res.json({ success: true, message: 'Schedule removed.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * GET /api/workforce/schedules or /api/schedules/supervisor
   */
  async getSupervisorSchedules(req, res) {
    try {
      const supId = await resolveEmployeeId(req);
      const result = await scheduleService.getSupervisorSchedules(supId, req.query, req.user.role_code);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * PUT /api/workforce/schedules/:id/review or /api/schedules/:id/supervisor-review
   */
  async reviewSupervisorSchedule(req, res) {
    try {
      const supId = await resolveEmployeeId(req);
      const updated = await scheduleService.reviewSupervisorSchedule(req.params.id, supId, req.body, req);
      res.json({
        success: true,
        data: updated,
        message: `Schedule marked as ${req.body.status}. Staff member notified.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * GET /api/hr/schedules or /api/schedules/hr
   */
  async getHRSchedules(req, res) {
    try {
      const result = await scheduleService.getHRSchedules(req.query);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  /**
   * PUT /api/hr/schedules/:id/review
   */
  async reviewHRSchedule(req, res) {
    try {
      const updated = await scheduleService.reviewHRSchedule(req.params.id, req.user.id, req.body, req);
      res.json({ success: true, data: updated, message: 'Schedule acknowledged by HR Command Center.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
};
