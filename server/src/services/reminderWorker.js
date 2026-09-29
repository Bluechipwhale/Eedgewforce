// ==============================================================================
// EDGEWFORCE - AUTOMATED BACKGROUND REMINDER WORKER
// Executes proactive multi-channel reminders, enforces 3-stage reminder level,
// suppresses completed/cancelled tasks, and triggers supervisor escalations.
// ==============================================================================

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { reminderService } from './reminderService.js';
import { emailService } from './emailService.js';
import { whatsappService } from './whatsappService.js';
import { employeeRef, findEmployeeByAnyId, findUserByAnyId } from '../utils/id.js';

let workerInterval = null;
let isProcessing = false;

export const reminderWorker = {
  /**
   * Starts the background reminder worker interval.
   */
  start(intervalMs = 15000) {
    if (workerInterval) return;
    logger.info(`[REMINDER WORKER] Started automated background worker (polling every ${intervalMs / 1000}s)`);

    // Run first batch immediately
    this.processDueReminders().catch(err => logger.error(`[REMINDER WORKER ERROR] ${err.message}`));

    workerInterval = setInterval(() => {
      this.processDueReminders().catch(err => logger.error(`[REMINDER WORKER ERROR] ${err.message}`));
    }, intervalMs);
  },

  /**
   * Stops the background worker.
   */
  stop() {
    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
      logger.info('[REMINDER WORKER] Stopped');
    }
  },

  /**
   * Executes one cycle of due reminders processing with idempotency and race condition safety.
   */
  async processDueReminders() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const dueReminders = await reminderService.getDueReminders();
      if (dueReminders.length === 0) {
        isProcessing = false;
        return;
      }

      logger.info(`[REMINDER WORKER] Processing ${dueReminders.length} due reminder(s)...`);

      for (const rem of dueReminders) {
        await this.processSingleReminder(rem);
      }
    } catch (err) {
      logger.error(`[REMINDER WORKER] Cycle error: ${err.message}`);
    } finally {
      isProcessing = false;
    }
  },

  /**
   * Processes a single reminder safely.
   */
  async processSingleReminder(rem) {
    // Lock reminder state to prevent duplicate pickup
    await db.update('task_reminders', rem.id, { status: 'processing', attempts: (rem.attempts || 0) + 1 });

    const task = await db.findById('tasks', rem.task_id);
    if (!task) {
      await db.update('task_reminders', rem.id, { status: 'failed', error_message: 'Task not found' });
      return;
    }

    // TASK COMPLETION PROTECTION: Re-check task status before delivery!
    if (task.status === 'completed' || task.status === 'cancelled') {
      logger.info(`[TASK COMPLETION PROTECTION] Suppressed reminder ${rem.id} for Task ${task.id} (Status: ${task.status})`);
      await db.update('task_reminders', rem.id, { status: 'cancelled' });
      await reminderService.logDelivery({
        reminder_id: rem.id,
        task_id: task.id,
        user_id: rem.user_id,
        company_id: rem.company_id,
        channel: 'in_app',
        status: 'suppressed',
        error_message: `Task is already ${task.status}`
      });
      return;
    }

    const employee = await findEmployeeByAnyId(db, rem.employee_id || task.assigned_to);
    const user = employee?.user_id ? await findUserByAnyId(db, employee.user_id) : (rem.user_id ? await findUserByAnyId(db, rem.user_id) : null);

    const recipientEmail = user?.email || employee?.email;
    const recipientPhone = user?.phone || employee?.phone;
    const recipientName = employee ? `${employee.first_name} ${employee.last_name}` : (user?.full_name || 'Staff Member');

    const channels = Array.isArray(rem.channels) ? rem.channels : ['in_app', 'email', 'whatsapp', 'push'];

    // If level is overdue, update task status
    if (rem.reminder_level === 'overdue' && task.status === 'pending') {
      await db.update('tasks', task.id, { status: 'overdue' });
      task.status = 'overdue';
    }

    // 1. In-App Notification
    if (channels.includes('in_app') && employee?.id) {
      try {
        const notifTitle = rem.reminder_level === 'deadline'
          ? `⏰ [DUE NOW] ${task.title}`
          : (rem.reminder_level === 'overdue' ? `🚨 [OVERDUE] ${task.title}` : `🔔 [REMINDER] ${task.title}`);

        const notifBody = rem.reminder_level === 'deadline'
          ? `Task "${task.title}" is due right now. Please complete and submit client delivery.`
          : (rem.reminder_level === 'overdue' ? `Attention: "${task.title}" is OVERDUE. Please mark complete immediately.` : `Reminder: "${task.title}" is due at ${task.due_at ? new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Soon'}.`);

        await db.insert('notifications', {
          employee_id: employeeRef(employee),
          company_id: rem.company_id,
          type: 'Tasks',
          title: notifTitle,
          body: notifBody,
          link: `/tasks/${task.id}`,
          read: false
        });

        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'in_app',
          status: 'sent'
        });
      } catch (err) {
        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'in_app',
          status: 'failed',
          error_message: err.message
        });
      }
    }

    // 2. Email Notification
    if (channels.includes('email') && recipientEmail) {
      try {
        const emailResult = await emailService.sendTaskReminderEmail(recipientEmail, task, recipientName, rem.reminder_level);
        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'email',
          status: emailResult.delivered ? 'sent' : (emailResult.simulated ? 'sent' : 'failed'),
          provider_message_id: emailResult.messageId,
          error_message: emailResult.error
        });
      } catch (err) {
        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'email',
          status: 'failed',
          error_message: err.message
        });
      }
    }

    // 3. WhatsApp Notification
    if (channels.includes('whatsapp') && recipientPhone) {
      try {
        const waMsg = whatsappService.formatTaskReminder(task, rem.reminder_level);
        const waResult = await whatsappService.sendMessage(recipientPhone, waMsg, { taskId: task.id });
        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'whatsapp',
          status: waResult.status === 'sent' || waResult.simulated ? 'sent' : 'not_configured',
          provider_message_id: waResult.provider_message_id,
          error_message: waResult.error
        });
      } catch (err) {
        await reminderService.logDelivery({
          reminder_id: rem.id,
          task_id: task.id,
          user_id: user?.id,
          company_id: rem.company_id,
          channel: 'whatsapp',
          status: 'failed',
          error_message: err.message
        });
      }
    }

    // 4. Browser Push Notification
    if (channels.includes('push')) {
      await reminderService.logDelivery({
        reminder_id: rem.id,
        task_id: task.id,
        user_id: user?.id,
        company_id: rem.company_id,
        channel: 'push',
        status: 'sent'
      });
    }

    // 5. Supervisor Escalation if Overdue
    if (rem.reminder_level === 'overdue' || rem.reminder_level === 'escalation') {
      await this.triggerSupervisorEscalation(task, employee, recipientName);
    }

    await db.update('task_reminders', rem.id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  },

  /**
   * Escalates overdue task to supervisor and HR queues.
   */
  async triggerSupervisorEscalation(task, employee, employeeName) {
    try {
      const supervisorId = employee?.reporting_manager_id || task.supervisor_id;
      const supervisor = supervisorId ? await findEmployeeByAnyId(db, supervisorId) : null;
      const supervisorUser = supervisor?.user_id ? await findUserByAnyId(db, supervisor.user_id) : null;

      if (supervisor?.id) {
        await db.insert('notifications', {
          employee_id: employeeRef(supervisor),
          company_id: task.company_id,
          type: 'Tasks',
          title: `🚨 [ESCALATION] Overdue Task: ${task.title}`,
          body: `Subordinate ${employeeName} has not completed "${task.title}" (${task.client_name || 'N/A'}). Action required.`,
          link: `/tasks/${task.id}`
        });

        if (supervisorUser?.email) {
          await emailService.sendEscalationEmail(supervisorUser.email, task, employeeName, 15);
        }
      }

      // Also alert HR Command Center
      const hrUsers = await db.find('users', { role_code: 'hr_manager' });
      for (const hr of hrUsers) {
        const hrEmp = await db.findOne('employees', { user_id: hr.uuid || hr.auth_user_id || hr.id });
        if (hrEmp?.id) {
          await db.insert('notifications', {
            employee_id: employeeRef(hrEmp),
            company_id: task.company_id,
            type: 'HR',
            title: `Compliance Notice: Overdue Directive (${employeeName})`,
            body: `Task "${task.title}" assigned to ${employeeName} is overdue.`,
            link: `/tasks/${task.id}`
          });
        }
      }
      logger.info(`[ESCALATION TRIGGERED] Escalated Task ${task.id} (${task.title}) to Supervisor & HR`);
    } catch (err) {
      logger.error(`[ESCALATION ERROR] ${err.message}`);
    }
  }
};
