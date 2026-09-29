// ==============================================================================
// EDGEWFORCE - EMPLOYEE INACTIVITY TELEMETRY & IDLE MONITOR SERVICE
// Detects 10-minute workstation idle events, notifies IT and HR immediately,
// and records employee operational explanations.
// ==============================================================================

import { db } from '../config/database.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { emailService } from './emailService.js';
import { logger } from '../utils/logger.js';
import { employeeRef, findEmployeeByAnyId, findUserByAnyId, sameId, userRef } from '../utils/id.js';

export const idleService = {
  /**
   * Logs a 10-minute inactivity event and triggers immediate IT + HR telemetry alerts.
   */
  async startIdleSession(data, actor = null, req = null) {
    const {
      employee_id,
      user_id,
      started_at,
      duration_seconds = 600,
      reason = null,
      explanation = null,
      workstation_snapshot = {}
    } = data;

    const empId = employee_id || actor?.employee?.id || actor?.id;
    const employee = empId ? await findEmployeeByAnyId(db, empId) : null;
    const user = user_id ? await findUserByAnyId(db, user_id) : (employee?.user_id ? await findUserByAnyId(db, employee.user_id) : actor);
    const resolvedEmployeeId = employee ? employeeRef(employee) : null;
    const resolvedUserId = user ? userRef(user) : null;

    const empName = employee ? `${employee.first_name} ${employee.last_name}` : (user?.full_name || 'Staff Member');
    const dept = employee?.department || 'Operations';

    const session = await db.insert('employee_idle_sessions', {
      company_id: Number(actor?.company_id || employee?.company_id || 1),
      employee_id: resolvedEmployeeId,
      user_id: resolvedUserId,
      idle_started_at: started_at || new Date(Date.now() - 600000).toISOString(),
      detected_at: new Date().toISOString(),
      duration_seconds: Number(duration_seconds || 600),
      reason: reason || 'Awaiting Explanation',
      reason_details: explanation || 'Workstation telemetry noted 10m+ inactivity',
      status: reason && reason !== 'Awaiting Explanation' ? 'explained' : 'pending',
      reported_to_it_at: new Date().toISOString(),
      reported_to_hr_at: new Date().toISOString(),
      workstation_snapshot: workstation_snapshot || {},
      created_at: new Date().toISOString()
    });

    // Also populate legacy idle_alerts table for backward compatibility
    await db.insert('idle_alerts', {
      employee_id: resolvedEmployeeId,
      started_at: session.idle_started_at,
      ended_at: new Date().toISOString(),
      duration_seconds: session.duration_seconds,
      reason: session.reason,
      explanation: session.reason_details,
      resolved: session.status === 'explained'
    });

    // 1. Alert IT Administrators
    const itUsers = await db.find('users', { role_code: 'super_admin' });
    for (const it of itUsers) {
      const itEmp = await db.findOne('employees', { user_id: userRef(it) }) || await db.findOne('employees', { user_id: it.id });
      if (itEmp?.id) {
        await db.insert('notifications', {
          employee_id: employeeRef(itEmp),
          company_id: session.company_id,
          type: 'System',
          title: `Workstation Inactivity Alert: ${empName}`,
          body: `${empName} (${dept}) has been inactive for ${Math.round(session.duration_seconds / 60)} mins. Telemetry recorded.`,
          link: '/system/telemetry'
        });
      }
      if (it.email) {
        emailService.sendIdleAlertEmail(it.email, session, empName, dept).catch(() => {});
      }
    }

    // 2. Alert HR Command Center
    const hrUsers = await db.find('users', { role_code: 'hr_manager' });
    for (const hr of hrUsers) {
      const hrEmp = await db.findOne('employees', { user_id: userRef(hr) }) || await db.findOne('employees', { user_id: hr.id });
      if (hrEmp?.id) {
        await db.insert('notifications', {
          employee_id: employeeRef(hrEmp),
          company_id: session.company_id,
          type: 'HR',
          title: `Employee Inactivity Log: ${empName}`,
          body: `${empName} (${dept}) idle for ${Math.round(session.duration_seconds / 60)} mins. Awaiting staff confirmation.`,
          link: '/hr/workforce'
        });
      }
    }

    await recordAudit(actor || user, 'EMPLOYEE_IDLE_DETECTED', 'employee_idle_sessions', session.id, {
      duration_seconds,
      employee_name: empName,
      department: dept
    }, req);

    logger.info(`[IDLE TELEMETRY] Logged 10m inactivity for ${empName} (${dept}). IT and HR alerted.`);
    return session;
  },

  /**
   * Submits employee explanation for the idle session.
   */
  async explainIdleSession(sessionId, data, actor = null, req = null) {
    const { reason, reason_details } = data;

    let session = await db.findById('employee_idle_sessions', sessionId);
    if (!session) {
      // Find latest pending session for this employee
      const employee = await findEmployeeByAnyId(db, actor?.employee?.id || actor?.id);
      const empId = employee ? employeeRef(employee) : (actor?.employee?.id || actor?.id);
      const list = await db.find('employee_idle_sessions', { employee_id: empId });
      session = list.find(s => s.status === 'pending') || list[list.length - 1];
    }

    if (!session) {
      // Create and resolve on the fly
      return await this.startIdleSession({
        ...data,
        reason,
        explanation: reason_details
      }, actor, req);
    }

    const updated = await db.update('employee_idle_sessions', session.id, {
      reason: reason || 'Break',
      reason_details: reason_details || reason || 'Employee provided explanation',
      status: 'explained'
    });

    // Also update legacy table
    const legacy = await db.findOne('idle_alerts', { employee_id: session.employee_id, resolved: false });
    if (legacy) {
      await db.update('idle_alerts', legacy.id, {
        reason: updated.reason,
        explanation: updated.reason_details,
        resolved: true
      });
    }

    await recordAudit(actor, 'IDLE_REASON_SUBMITTED', 'employee_idle_sessions', session.id, {
      reason: updated.reason,
      details: updated.reason_details
    }, req);

    return updated;
  },

  /**
   * Retrieves idle telemetry sessions for IT & HR review.
   */
  async getIdleSessions(filters = {}) {
    const all = await db.find('employee_idle_sessions', {}, { order: { column: 'detected_at', ascending: false }, limit: 100 });
    const employees = await db.find('employees');

    return all.map(s => {
      const emp = employees.find(e => sameId(employeeRef(e), s.employee_id) || sameId(e.id, s.employee_id));
      return {
        ...s,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member',
        department: emp?.department || 'Operations',
        employee_code: emp?.employee_code || 'EMP-000'
      };
    });
  },

  /**
   * Aggregates activity analytics for HR and Executive views.
   */
  async getIdleAnalytics() {
    const sessions = await db.find('employee_idle_sessions');
    const total = sessions.length;
    const explained = sessions.filter(s => s.status === 'explained').length;
    const pending = sessions.filter(s => s.status === 'pending').length;

    const reasons = {};
    sessions.forEach(s => {
      const r = s.reason || 'Other';
      reasons[r] = (reasons[r] || 0) + 1;
    });

    const totalSeconds = sessions.reduce((sum, s) => sum + Number(s.duration_seconds || 600), 0);
    const avgDurationMins = total > 0 ? Math.round(totalSeconds / total / 60) : 10;

    return {
      total_idle_events: total,
      explained_count: explained,
      pending_count: pending,
      average_duration_minutes: avgDurationMins,
      top_reasons: reasons
    };
  }
};
