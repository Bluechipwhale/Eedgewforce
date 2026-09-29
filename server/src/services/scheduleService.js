// ==============================================================================
// EDGEWFORCE - DAILY SCHEDULER & WORKFORCE ROSTER SERVICE
// Staff Daily Schedule Creation, Supervisor Review, HR Oversight & Telemetry
// ==============================================================================

import { db } from '../config/database.js';
import { notificationService } from './notificationService.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { logger } from '../utils/logger.js';
import { employeeRef, findEmployeeByAnyId, sameId, toDbId } from '../utils/id.js';

export const scheduleService = {
  /**
   * Calculates total hours between two HH:MM strings or from tasks array
   */
  calculateHours(start, end) {
    if (!start || !end) return 8;
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const diff = (endMin - startMin) / 60;
      return diff > 0 ? Number(diff.toFixed(1)) : 8;
    } catch {
      return 8;
    }
  },

  /**
   * Retrieves schedules for the authenticated employee.
   */
  async getEmployeeSchedules(employeeId, filters = {}) {
    const employee = await findEmployeeByAnyId(db, employeeId);
    const empId = employee ? employeeRef(employee) : toDbId(employeeId);
    let schedules = await db.find('schedules', { employee_id: empId }, { order: { column: 'date', ascending: false } });

    if (filters.date) {
      schedules = schedules.filter(s => s.date === filters.date);
    }
    if (filters.status && filters.status !== 'ALL') {
      schedules = schedules.filter(s => s.status === filters.status);
    }
    if (filters.month) {
      schedules = schedules.filter(s => s.date?.startsWith(filters.month));
    }

    return schedules;
  },

  /**
   * Retrieves today's schedule for the employee.
   */
  async getTodaySchedule(employeeId) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const employee = await findEmployeeByAnyId(db, employeeId);
    const empId = employee ? employeeRef(employee) : toDbId(employeeId);
    const schedules = await db.find('schedules', { employee_id: empId });
    const todaySchedule = schedules.find(s => s.date === todayStr);
    return todaySchedule || null;
  },

  /**
   * Creates or updates a daily schedule submitted by an employee.
   */
  async createOrUpdateSchedule(employeeId, scheduleData, req = null) {
    const employee = await findEmployeeByAnyId(db, employeeId);
    if (!employee) throw new Error('Employee profile not found.');
    const empId = employeeRef(employee);

    const date = scheduleData.date || new Date().toISOString().slice(0, 10);
    const existing = await db.findOne('schedules', { employee_id: empId, date });

    // Determine Supervisor
    let supervisorId = employee.supervisor_id;
    let supervisorName = 'Assigned Supervisor';

    if (supervisorId) {
      const sup = await findEmployeeByAnyId(db, supervisorId);
      if (sup) supervisorName = `${sup.first_name} ${sup.last_name}`;
    } else {
      // Fallback to default field/operations supervisor
      const defaultSup = await db.findOne('employees', { rank_code: 'SUPERVISOR' });
      if (defaultSup) {
        supervisorId = defaultSup.id;
        supervisorName = `${defaultSup.first_name} ${defaultSup.last_name}`;
      }
    }

    const shiftStart = scheduleData.shift_start || '08:00';
    const shiftEnd = scheduleData.shift_end || '17:00';
    const totalPlannedHours = scheduleData.total_planned_hours || this.calculateHours(shiftStart, shiftEnd);

    // Normalize task list
    const tasks = (scheduleData.tasks || []).map((t, idx) => ({
      id: t.id || `task-${Date.now()}-${idx}`,
      time_start: t.time_start || '09:00',
      time_end: t.time_end || '10:00',
      activity: t.activity || 'Scheduled Operational Task',
      category: t.category || 'General',
      location: t.location || scheduleData.work_location || 'Assigned Territory',
      priority: t.priority || 'NORMAL',
      notes: t.notes || '',
      status: t.status || 'Planned'
    }));

    const isDraft = scheduleData.status === 'DRAFT';
    const submissionStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    const schedulePayload = {
      company_id: employee.company_id || 1,
      employee_id: empId,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_code: employee.employee_code,
      department: employee.department || 'Operations',
      position: employee.position || 'Staff',
      date,
      title: scheduleData.title || `Daily Schedule - ${date}`,
      shift_start: shiftStart,
      shift_end: shiftEnd,
      work_location: scheduleData.work_location || employee.territory || 'Company Operations',
      tasks,
      total_planned_hours: totalPlannedHours,
      notes: scheduleData.notes || '',
      status: submissionStatus,
      submitted_at: isDraft ? null : new Date().toISOString(),
      supervisor_id: supervisorId ? toDbId(supervisorId) : null,
      supervisor_name: supervisorName,
      supervisor_status: isDraft ? 'DRAFT' : 'PENDING',
      supervisor_reviewed_at: null,
      supervisor_notes: null,
      hr_status: isDraft ? 'DRAFT' : 'PENDING',
      hr_reviewed_at: null,
      hr_notes: null
    };

    let result;
    if (existing) {
      result = await db.update('schedules', existing.id, schedulePayload);
    } else {
      result = await db.insert('schedules', schedulePayload);
    }

    // Trigger in-app notifications if submitted (not draft)
    if (!isDraft) {
      // 1. Notify Supervisor
      if (supervisorId) {
        try {
          await notificationService.notify(
            supervisorId,
            'Schedule',
            'New Daily Schedule Submitted',
            `${employee.first_name} ${employee.last_name} (${employee.department}) submitted their schedule for ${date} for review.`,
            '/supervisor_dashboard'
          );
        } catch (err) {
          logger.warn(`Failed to notify supervisor for schedule: ${err.message}`);
        }
      }

      // 2. Notify HR Team (HR Manager / CEO / Admins)
      try {
        const hrEmployees = await db.find('employees');
        const hrStaff = hrEmployees.filter(e => e.rank_code === 'HR' || e.department === 'Human Resources');
        for (const hr of hrStaff) {
          if (!sameId(employeeRef(hr), empId) && !sameId(hr.id, employeeId)) {
            await notificationService.notify(
              hr.id,
              'Schedule',
              'Daily Schedule Logged',
              `${employee.first_name} ${employee.last_name} (${employee.department}) submitted their daily work itinerary for ${date}.`,
              '/people'
            );
          }
        }
      } catch (err) {
        logger.warn(`Failed to notify HR for schedule: ${err.message}`);
      }

      if (req) {
        await recordAudit(req, 'SUBMIT_DAILY_SCHEDULE', 'schedules', result.id, {
          employee_id: employeeRef(employee),
          date,
          tasks_count: tasks.length
        });
      }
    }

    return result;
  },

  /**
   * Updates a single task item status within today's or specified schedule (e.g. Planned -> Completed).
   */
  async updateTaskItemStatus(scheduleId, employeeId, taskId, taskStatus) {
    const schedule = await db.findById('schedules', toDbId(scheduleId));
    if (!schedule) throw new Error('Schedule not found.');
    const employee = await findEmployeeByAnyId(db, employeeId);
    const empId = employee ? employeeRef(employee) : toDbId(employeeId);
    if (!sameId(schedule.employee_id, empId)) throw new Error('Unauthorized schedule modification.');

    const updatedTasks = (schedule.tasks || []).map(t => {
      if (t.id === taskId) {
        return { ...t, status: taskStatus };
      }
      return t;
    });

    return await db.update('schedules', schedule.id, { tasks: updatedTasks });
  },

  /**
   * Retrieves schedules for supervisor's subordinate team members.
   */
  async getSupervisorSchedules(supervisorId, filters = {}, userRole = '') {
    const isGlobalManager = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO', 'IT_ADMIN', 'MANAGER', 'HR_MANAGER'].includes(userRole);
    
    let employees = await db.find('employees');
    let teamEmployees = [];

    if (isGlobalManager) {
      teamEmployees = employees;
    } else {
      teamEmployees = employees.filter(e => sameId(e.supervisor_id, supervisorId) || sameId(employeeRef(e), supervisorId) || sameId(e.id, supervisorId));
      if (teamEmployees.length === 0) {
        // If supervisor has no explicit supervisor_id links, include employees in same territory/department or field staff
        const sup = await findEmployeeByAnyId(db, supervisorId);
        if (sup) {
          teamEmployees = employees.filter(e => e.department === sup.department || ['Commercial Sales', 'Field Operations'].includes(e.department));
        }
      }
    }

    const teamIds = teamEmployees.map(e => employeeRef(e));
    let allSchedules = await db.find('schedules', {}, { order: { column: 'date', ascending: false } });

    let filtered = allSchedules.filter(s => teamIds.some(id => sameId(id, s.employee_id)));

    const targetDate = filters.date || new Date().toISOString().slice(0, 10);
    if (filters.date) {
      filtered = filtered.filter(s => s.date === filters.date);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(s => s.supervisor_status === filters.status || s.status === filters.status);
    }
    if (filters.employee_id) {
      filtered = filtered.filter(s => sameId(s.employee_id, filters.employee_id));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.employee_name?.toLowerCase().includes(q) ||
        s.employee_code?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q) ||
        s.work_location?.toLowerCase().includes(q)
      );
    }

    // Compute team submission metrics for target date
    const targetDateSchedules = allSchedules.filter(s => s.date === targetDate && teamIds.some(id => sameId(id, s.employee_id)));
    const submittedCount = targetDateSchedules.filter(s => s.status !== 'DRAFT').length;
    const pendingReviewCount = targetDateSchedules.filter(s => s.supervisor_status === 'PENDING').length;
    const approvedCount = targetDateSchedules.filter(s => s.supervisor_status === 'APPROVED').length;
    const rejectedCount = targetDateSchedules.filter(s => s.supervisor_status === 'REJECTED' || s.supervisor_status === 'REVISION_REQUESTED').length;

    return {
      schedules: filtered,
      metrics: {
        total_team_members: teamEmployees.length,
        submitted_today: submittedCount,
        pending_review: pendingReviewCount,
        approved: approvedCount,
        rejected: rejectedCount,
        compliance_rate: teamEmployees.length > 0 ? Math.round((submittedCount / teamEmployees.length) * 100) : 100
      },
      team: teamEmployees.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, code: e.employee_code, department: e.department }))
    };
  },

  /**
   * Supervisor reviews and approves or rejects / requests revision for a schedule.
   */
  async reviewSupervisorSchedule(scheduleId, supervisorId, reviewData, req = null) {
    const schedule = await db.findById('schedules', toDbId(scheduleId));
    if (!schedule) throw new Error('Schedule record not found.');

    const status = reviewData.status; // 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'
    if (!['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(status)) {
      throw new Error('Invalid review status. Must be APPROVED, REJECTED, or REVISION_REQUESTED.');
    }

    const sup = await findEmployeeByAnyId(db, supervisorId);
    const supervisorName = sup ? `${sup.first_name} ${sup.last_name}` : 'Field Supervisor';

    const updated = await db.update('schedules', schedule.id, {
      status: status,
      supervisor_status: status,
      supervisor_reviewed_at: new Date().toISOString(),
      supervisor_notes: reviewData.notes || null,
      supervisor_name: supervisorName
    });

    // Notify employee of review outcome
    try {
      const statusLabel = status === 'APPROVED' ? 'Approved ✅' : (status === 'REJECTED' ? 'Rejected ❌' : 'Revision Requested ⚠️');
      await notificationService.notify(
        schedule.employee_id,
        'Schedule',
        `Daily Schedule ${statusLabel}`,
        `Your supervisor (${supervisorName}) has ${status.toLowerCase()} your schedule for ${schedule.date}.${reviewData.notes ? ` Notes: "${reviewData.notes}"` : ''}`,
        '/schedule'
      );
    } catch (err) {
      logger.warn(`Failed to notify staff of schedule review: ${err.message}`);
    }

    if (req) {
      await recordAudit(req, 'SUPERVISOR_REVIEW_SCHEDULE', 'schedules', schedule.id, {
        supervisor_id: supervisorId,
        status,
        notes: reviewData.notes
      });
    }

    return updated;
  },

  /**
   * Retrieves company-wide daily schedules for HR Command Center.
   */
  async getHRSchedules(filters = {}) {
    let schedules = await db.find('schedules', {}, { order: { column: 'date', ascending: false } });
    let employees = await db.find('employees');

    const targetDate = filters.date || new Date().toISOString().slice(0, 10);

    if (filters.date) {
      schedules = schedules.filter(s => s.date === filters.date);
    }
    if (filters.department && filters.department !== 'ALL') {
      schedules = schedules.filter(s => s.department === filters.department);
    }
    if (filters.status && filters.status !== 'ALL') {
      schedules = schedules.filter(s => s.status === filters.status || s.supervisor_status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      schedules = schedules.filter(s =>
        s.employee_name?.toLowerCase().includes(q) ||
        s.employee_code?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.work_location?.toLowerCase().includes(q)
      );
    }

    // Company-wide compliance metrics for target date
    const targetDateSchedules = schedules.filter(s => s.date === targetDate);
    const activeStaff = employees.filter(e => e.status !== 'suspended' && e.status !== 'inactive');
    const totalStaffCount = activeStaff.length;
    const submittedCount = targetDateSchedules.filter(s => s.status !== 'DRAFT').length;
    const approvedCount = targetDateSchedules.filter(s => s.status === 'APPROVED' || s.supervisor_status === 'APPROVED').length;
    const pendingCount = targetDateSchedules.filter(s => s.status === 'SUBMITTED' && s.supervisor_status === 'PENDING').length;

    return {
      schedules,
      metrics: {
        total_active_staff: totalStaffCount,
        total_submitted_today: submittedCount,
        approved_count: approvedCount,
        pending_review_count: pendingCount,
        compliance_rate: totalStaffCount > 0 ? Math.round((submittedCount / totalStaffCount) * 100) : 100
      }
    };
  },

  /**
   * HR review or acknowledgement of a daily schedule.
   */
  async reviewHRSchedule(scheduleId, hrUserId, reviewData, req = null) {
    const schedule = await db.findById('schedules', toDbId(scheduleId));
    if (!schedule) throw new Error('Schedule record not found.');

    const status = reviewData.status || 'ACKNOWLEDGED'; // 'ACKNOWLEDGED' | 'APPROVED' | 'REJECTED'

    const updated = await db.update('schedules', schedule.id, {
      hr_status: status,
      hr_reviewed_at: new Date().toISOString(),
      hr_notes: reviewData.notes || 'Acknowledged by HR Command Center'
    });

    if (req) {
      await recordAudit(req, 'HR_REVIEW_SCHEDULE', 'schedules', schedule.id, {
        hr_user_id: hrUserId,
        status,
        notes: reviewData.notes
      });
    }

    return updated;
  },

  /**
   * Deletes a draft or pending schedule.
   */
  async deleteSchedule(scheduleId, employeeId) {
    const schedule = await db.findById('schedules', toDbId(scheduleId));
    if (!schedule) throw new Error('Schedule not found.');
    const employee = await findEmployeeByAnyId(db, employeeId);
    const empId = employee ? employeeRef(employee) : toDbId(employeeId);
    if (!sameId(schedule.employee_id, empId)) throw new Error('Unauthorized.');
    if (schedule.status === 'APPROVED') throw new Error('Cannot delete an approved schedule.');

    return await db.delete('schedules', schedule.id);
  }
};
