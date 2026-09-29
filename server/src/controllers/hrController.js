// ==============================================================================
// EDGEWFORCE - HR COMMAND CENTER CONTROLLER
// ==============================================================================

import { hrService } from '../services/hrService.js';
import { db } from '../config/database.js';
import { employeeRef, sameId } from '../utils/id.js';

const matchEmployee = (employees, id) =>
  employees.find(e => sameId(employeeRef(e), id) || sameId(e.id, id) || sameId(e.user_id, id));

export const hrController = {
  async getDashboard(req, res) {
    try {
      const stats = await hrService.getDashboardStats();
      res.json({ success: true, data: stats, ...stats });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getEmployees(req, res) {
    try {
      const employees = await hrService.getEmployees(req.user);
      res.json({ success: true, data: employees, employees });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async registerStaff(req, res) {
    try {
      const result = await hrService.registerStaff(req.body, req.user, req);
      res.status(201).json({
        success: true,
        data: result,
        ...result,
        message: `Successfully registered staff member ${result.employee.first_name} ${result.employee.last_name} (${result.employee.employee_code}).`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async updateEmployee(req, res) {
    try {
      const updated = await hrService.updateEmployee(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: updated, ...updated, message: 'Employee profile updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async updateStaffStatus(req, res) {
    try {
      const { status } = req.body;
      const updated = await hrService.updateStaffStatus(req.params.id, status, req.user, req);
      res.json({ success: true, data: updated, ...updated, message: `Staff status updated to ${status}.` });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async deleteEmployee(req, res) {
    try {
      const result = await hrService.deleteEmployee(req.params.id, req.user, req);
      res.json({ success: true, data: result, message: result.message });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async resendInvitation(req, res) {
    try {
      const result = await hrService.resendInvitation(req.params.id, req.user, req);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getAuditLogs(req, res) {
    try {
      const logs = await hrService.getAuditLogs();
      res.json({ success: true, data: logs, audit_logs: logs });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getAttendance(req, res) {
    try {
      const attendance = await db.find('attendance', {}, { order: { column: 'date', ascending: false } });
      const employees = await db.find('employees');
      const data = attendance.map(a => ({
        ...a,
        employee: matchEmployee(employees, a.employee_id)
      }));
      res.json({ success: true, data, attendance: data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getIdleEvents(req, res) {
    try {
      const alerts = await db.find('idle_alerts', {}, { order: { column: 'created_at', ascending: false } });
      const employees = await db.find('employees');
      const data = alerts.map(a => ({
        ...a,
        employee: matchEmployee(employees, a.employee_id)
      }));
      res.json({ success: true, data, idle_events: data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getLeave(req, res) {
    try {
      const requests = await db.find('leave_requests', {}, { order: { column: 'created_at', ascending: false } });
      const employees = await db.find('employees');
      const data = requests.map(r => ({
        ...r,
        employee: matchEmployee(employees, r.employee_id)
      }));
      res.json({ success: true, data, leave_requests: data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async approveLeave(req, res) {
    try {
      const result = await hrService.approveLeave(req.params.id, req.user, req);
      res.json({ success: true, data: result, ...result, message: 'Leave approved successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async rejectLeave(req, res) {
    try {
      const result = await hrService.rejectLeave(req.params.id, req.body.reason, req.user, req);
      res.json({ success: true, data: result, ...result, message: 'Leave request rejected.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getTasks(req, res) {
    try {
      const tasks = await db.find('tasks', {}, { order: { column: 'created_at', ascending: false } });
      const employees = await db.find('employees');
      const data = tasks.map(t => ({
        ...t,
        assignee: matchEmployee(employees, t.assigned_to)
      }));
      res.json({ success: true, data, tasks: data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async assignTask(req, res) {
    try {
      const task = await hrService.assignTask(req.body, req.user, req);
      res.status(201).json({ success: true, data: task, ...task, message: 'Task assigned and hierarchy verified.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { code: 'TASK_ASSIGNMENT_FAILED', message: err.message } });
    }
  },

  async getSOS(req, res) {
    try {
      const list = await db.find('sos', {}, { order: { column: 'created_at', ascending: false } });
      const employees = await db.find('employees');
      const data = list.map(s => ({
        ...s,
        agent: matchEmployee(employees, s.agent_id)
      }));
      res.json({ success: true, data, sos: data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async acknowledgeSOS(req, res) {
    try {
      const result = await hrService.acknowledgeSOS(req.params.id, req.user, req);
      res.json({ success: true, data: result, ...result, message: 'SOS acknowledged.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async resolveSOS(req, res) {
    try {
      const result = await hrService.resolveSOS(req.params.id, req.body.resolution_notes, req.user, req);
      res.json({ success: true, data: result, ...result, message: 'SOS resolved.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getRanks(req, res) {
    try {
      const ranks = await hrService.getRanks();
      res.json({ success: true, data: ranks, ranks });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async createRank(req, res) {
    try {
      const rank = await hrService.createRank(req.body, req.user, req);
      res.status(201).json({ success: true, data: rank, rank, message: 'Rank created.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async updateRank(req, res) {
    try {
      const rank = await hrService.updateRank(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: rank, rank, message: 'Rank updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getOrganization(req, res) {
    try {
      const org = await hrService.getOrganizationTree();
      res.json({ success: true, data: org, ...org });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async reassignOrganizationNode(req, res) {
    try {
      const updated = await hrService.reassignOrganizationNode(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: updated, message: 'Organization structure node updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async deleteOrganizationNode(req, res) {
    try {
      const result = await hrService.deleteOrganizationNode(req.params.id, req.user, req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getAnnouncements(req, res) {
    try {
      const list = await hrService.getAnnouncements();
      res.json({ success: true, data: list, announcements: list });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async createAnnouncement(req, res) {
    try {
      const item = await hrService.createAnnouncement(req.body, req.user, req);
      res.status(201).json({ success: true, data: item, announcement: item, message: 'Announcement published successfully to staff portal.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async updateAnnouncement(req, res) {
    try {
      const item = await hrService.updateAnnouncement(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: item, announcement: item, message: 'Announcement updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async deleteAnnouncement(req, res) {
    try {
      const result = await hrService.deleteAnnouncement(req.params.id, req.user, req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async getBirthdays(req, res) {
    try {
      const data = await hrService.getStaffBirthdays();
      res.json({ success: true, data, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updateBirthday(req, res) {
    try {
      const updated = await hrService.updateStaffBirthday(req.params.id, req.body, req.user, req);
      res.json({ success: true, data: updated, message: 'Staff birthday / milestone updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async broadcastBirthday(req, res) {
    try {
      const announcement = await hrService.broadcastBirthday(req.body.employee_id, req.body.custom_wish, req.user, req);
      res.status(201).json({ success: true, data: announcement, message: 'Birthday celebration broadcasted to the company portal! 🎉' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
};


