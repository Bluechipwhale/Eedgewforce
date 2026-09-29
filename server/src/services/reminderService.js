// ==============================================================================
// EDGEWFORCE - MULTI-CHANNEL REMINDER ENGINE SERVICE
// Schedules proactive reminders across In-App, Push, Email, and WhatsApp.
// Logs delivery results, manages preferences, and aggregates analytics.
// ==============================================================================

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { toDbId } from '../utils/id.js';

export const reminderService = {
  /**
   * Schedules a reminder record for a task.
   */
  async scheduleReminder(data) {
    const {
      task_id,
      user_id,
      employee_id,
      company_id = 1,
      reminder_at,
      reminder_level = 'pre_deadline',
      channels = ['in_app', 'email', 'whatsapp', 'push']
    } = data;

    const idempotency_key = `REM-${task_id}-${reminder_level}-${new Date(reminder_at).getTime()}`;

    // Check if duplicate already scheduled
    const existing = await db.findOne('task_reminders', { idempotency_key });
    if (existing) return existing;

    const reminder = await db.insert('task_reminders', {
      company_id: Number(company_id),
      task_id: toDbId(task_id),
      user_id: user_id ? toDbId(user_id) : null,
      employee_id: employee_id ? toDbId(employee_id) : null,
      reminder_at: new Date(reminder_at).toISOString(),
      reminder_level,
      channels: Array.isArray(channels) ? channels : ['in_app', 'email'],
      status: 'scheduled',
      attempts: 0,
      idempotency_key,
      created_at: new Date().toISOString()
    });

    logger.info(`[REMINDER SCHEDULED] ID: ${reminder.id} | Task: ${task_id} | At: ${reminder.reminder_at} | Level: ${reminder_level}`);
    return reminder;
  },

  /**
   * Finds scheduled reminders ready for processing (reminder_at <= now).
   */
  async getDueReminders() {
    const all = await db.find('task_reminders', { status: 'scheduled' });
    const now = new Date();
    return all.filter(r => new Date(r.reminder_at) <= now);
  },

  /**
   * Cancels all scheduled reminders for a completed or cancelled task.
   */
  async cancelTaskReminders(taskId) {
    const active = await db.find('task_reminders', { task_id: toDbId(taskId) });
    for (const rem of active) {
      if (rem.status === 'scheduled') {
        await db.update('task_reminders', rem.id, { status: 'cancelled' });
      }
    }
    logger.info(`[REMINDERS CANCELLED] Suppressed all future reminders for completed Task: ${taskId}`);
    return { success: true };
  },

  /**
   * Logs delivery outcome per channel in reminder_delivery_logs.
   */
  async logDelivery(data) {
    const {
      reminder_id,
      task_id,
      user_id,
      company_id = 1,
      channel,
      status, // 'sent', 'failed', 'not_configured', 'suppressed'
      provider_message_id = null,
      error_message = null
    } = data;

    return await db.insert('reminder_delivery_logs', {
      company_id: Number(company_id),
      reminder_id: reminder_id ? toDbId(reminder_id) : null,
      task_id: toDbId(task_id),
      user_id: user_id ? toDbId(user_id) : null,
      channel,
      status,
      provider_message_id,
      error_message,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  },

  /**
   * Retrieves reminder delivery logs for reporting and audit trail.
   */
  async getDeliveryLogs(taskId = null) {
    if (taskId) {
      return await db.find('reminder_delivery_logs', { task_id: toDbId(taskId) }, { order: { column: 'created_at', ascending: false } });
    }
    return await db.find('reminder_delivery_logs', {}, { order: { column: 'created_at', ascending: false }, limit: 100 });
  },

  /**
   * Aggregates reminder analytics for executive & IT dashboards.
   */
  async getReminderAnalytics() {
    const logs = await db.find('reminder_delivery_logs');
    const tasks = await db.find('tasks');
    const reminders = await db.find('task_reminders');

    const totalLogs = logs.length;
    const sentLogs = logs.filter(l => l.status === 'sent').length;
    const failedLogs = logs.filter(l => l.status === 'failed').length;

    const byChannel = {
      in_app: { sent: logs.filter(l => l.channel === 'in_app' && l.status === 'sent').length, total: logs.filter(l => l.channel === 'in_app').length },
      email: { sent: logs.filter(l => l.channel === 'email' && l.status === 'sent').length, total: logs.filter(l => l.channel === 'email').length },
      whatsapp: { sent: logs.filter(l => l.channel === 'whatsapp' && l.status === 'sent').length, total: logs.filter(l => l.channel === 'whatsapp').length },
      push: { sent: logs.filter(l => l.channel === 'push' && l.status === 'sent').length, total: logs.filter(l => l.channel === 'push').length }
    };

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

    return {
      total_reminders_scheduled: reminders.length,
      total_deliveries_logged: totalLogs,
      overall_delivery_rate: totalLogs > 0 ? Math.round((sentLogs / totalLogs) * 100) : 100,
      sent_count: sentLogs,
      failed_count: failedLogs,
      by_channel: byChannel,
      task_compliance_rate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100,
      active_tasks_count: tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
      overdue_tasks_count: overdueTasks
    };
  }
};
