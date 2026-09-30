// ==============================================================================
// EDGEWFORCE - TASK INTELLIGENCE & DELIVERY PROTECTION SERVICE
// Manages task lifecycle, client/project deliverables, 4-stage client delivery,
// acknowledgement ("I'm Aware"), and task completion evidence.
// ==============================================================================

import { db } from '../config/database.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { reminderService } from './reminderService.js';
import { isManagementUser } from '../middleware/rbac.js';
import { employeeRef, findEmployeeByAnyId, sameId, userRef } from '../utils/id.js';
import { canAssignEmployee } from './taskDirectoryService.js';
import { readAll } from '../utils/readAll.js';

export const taskService = {
  async assertTaskAccess(task, actor, allowTeam = true) {
    if (!task || !actor) throw new Error('Task not found.');
    if (!sameId(task.company_id || 1, actor.company_id || actor.employee?.company_id || 1)) throw new Error('Task not found.');
    const employeeIds = [actor.employee?.id, actor.employee?.uuid, actor.employee?.auth_user_id, actor.employee_id].filter(Boolean);
    if (!actor.employee && (actor.uuid || actor.auth_user_id || actor.id)) {
      const employees = await db.find('employees');
      const linkedEmployee = employees.find(e => [actor.uuid, actor.auth_user_id, actor.id].filter(Boolean).some(id => sameId(id, e.user_id)));
      if (linkedEmployee) employeeIds.push(employeeRef(linkedEmployee));
    }
    const isAssigned = employeeIds.some(id => sameId(id, task.assigned_to));
    const isCreator = [actor.id, actor.uuid, actor.auth_user_id].filter(Boolean).some(id => sameId(id, task.assigned_by));
    if (allowTeam && (isManagementUser(actor) || isAssigned || isCreator)) return;
    if (isAssigned || isCreator) return;
    throw new Error('You do not have permission to change this task.');
  },
  /**
   * Creates a new task with custom client deliverables, deadlines, and multi-channel reminders.
   */
  async createTask(data, actor, req = null) {
    const {
      title,
      description,
      assigned_to,
      client_name,
      project_name,
      priority = 'normal',
      task_type = 'general', // 'general' | 'delivery'
      due_at,
      due_date,
      reminders = [], // Array of reminder minutes before due (e.g. [15, 0, -15])
      channels = ['in_app', 'email', 'whatsapp', 'push']
    } = data;

    if (!title || !assigned_to) {
      throw new Error('Task title and assigned employee are required.');
    }

    const targetEmployee = await findEmployeeByAnyId(db, assigned_to);
    if (!targetEmployee) {
      throw new Error('Assigned employee not found.');
    }

    // Enforce rank hierarchy unless CEO/Super Admin
    const ranks = await db.find('ranks');
    const assignerRank = ranks.find(r => r.code === actor.rank?.code) || { level: 8 };
    const targetRank = ranks.find(r => r.code === targetEmployee.rank_code) || { level: 8 };

    const isAuthorized = canAssignEmployee(actor, targetEmployee, ranks);
    if (!isAuthorized) {
      throw new Error(`Hierarchy violation: Level ${assignerRank.level} cannot assign tasks upward to Level ${targetRank.level}.`);
    }
    if (['inactive', 'suspended', 'terminated'].includes(String(targetEmployee.status).toLowerCase())) {
      throw new Error('This employee is not active. Choose an active staff member.');
    }

    const dueTimestamp = due_at || due_date ? new Date(due_at || due_date).toISOString() : new Date(Date.now() + 4 * 3600000).toISOString();

    const targetEmployeeId = employeeRef(targetEmployee);
    const actorId = userRef(actor) || actor?.id || 1;

    const task = await db.insert('tasks', {
      company_id: Number(actor?.company_id || targetEmployee.company_id || 1),
      assigned_to: targetEmployeeId,
      assigned_by: actorId,
      supervisor_id: targetEmployee.reporting_manager_id || actorId,
      department_id: targetEmployee.department_id || 1,
      title,
      description: description || '',
      client_name: client_name || null,
      project_name: project_name || null,
      priority: String(priority).toLowerCase(),
      task_type,
      status: 'pending',
      delivery_stages: task_type === 'delivery' ? {
        prepared: false,
        reviewed: false,
        sent_to_client: false,
        client_delivery: false
      } : null,
      due_at: dueTimestamp,
      due_date: dueTimestamp.slice(0, 10),
      acknowledged_at: null,
      acknowledged_by: null,
      completed_at: null,
      created_at: new Date().toISOString()
    });

    // Notify employee in-app immediately
    await db.insert('notifications', {
      employee_id: targetEmployeeId,
      company_id: task.company_id,
      type: 'Tasks',
      title: `New Task: ${title}`,
      body: `You have been assigned "${title}" for ${client_name || 'Operations'}. Due at ${new Date(dueTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      link: `/tasks/${task.id}`
    });

    // Schedule default multi-stage reminders if none provided
    const reminderOffsets = reminders.length > 0 ? reminders : [15, 0, -15]; // 15m before, at due, 15m after
    for (const offset of reminderOffsets) {
      const remTime = new Date(new Date(dueTimestamp).getTime() - offset * 60000);
      const level = offset > 0 ? 'pre_deadline' : (offset === 0 ? 'deadline' : 'overdue');

      await reminderService.scheduleReminder({
        task_id: task.id,
        user_id: targetEmployee.user_id,
        employee_id: targetEmployeeId,
        company_id: task.company_id,
        reminder_at: remTime.toISOString(),
        reminder_level: level,
        channels
      });
    }

    await recordAudit(actor, 'TASK_CREATED', 'tasks', task.id, { title, assigned_to: targetEmployeeId, client_name }, req);

    return task;
  },

  /**
   * Retrieves tasks with live countdown metrics and filter criteria.
   */
  async getTasks(filters = {}, actor = null) {
    const companyId = actor?.company_id || actor?.employee?.company_id || 1;
    const allTasks = (await readAll('tasks'))
      .filter(task => sameId(task.company_id || 1, companyId));
    const employees = await readAll('employees');
    const now = new Date();

    const enriched = allTasks.map(t => {
      const emp = employees.find(e => sameId(employeeRef(e), t.assigned_to) || sameId(e.id, t.assigned_to));
      const due = t.due_at || t.due_date ? new Date(t.due_at || t.due_date) : null;
      let diffMs = due ? due.getTime() - now.getTime() : 0;
      const isOverdue = diffMs < 0 && t.status !== 'completed' && t.status !== 'cancelled';

      return {
        ...t,
        assigned_employee: emp ? { id: employeeRef(emp), name: `${emp.first_name} ${emp.last_name}`.trim(), department: emp.department || '', position: emp.position || '' } : null,
        is_overdue: isOverdue,
        remaining_seconds: Math.round(diffMs / 1000),
        countdown_text: isOverdue ? `Overdue by ${Math.abs(Math.round(diffMs / 60000))} mins` : `${Math.max(0, Math.round(diffMs / 60000))} mins remaining`
      };
    });
    enriched.sort((a, b) => new Date(a.due_at || a.due_date || 8640000000000000) - new Date(b.due_at || b.due_date || 8640000000000000));

    if (filters.employee_id) {
      return enriched.filter(t => sameId(t.assigned_to, filters.employee_id));
    }
    if (filters.status) {
      return enriched.filter(t => t.status === filters.status);
    }
    if (filters.today) {
      const todayStr = now.toISOString().slice(0, 10);
      return enriched.filter(t => String(t.due_at || t.due_date).startsWith(todayStr));
    }

    return enriched;
  },

  /**
   * Acknowledges task ("I'M AWARE").
   */
  async acknowledgeTask(taskId, actor, req = null) {
    const task = await db.findById('tasks', taskId);
    if (!task) throw new Error('Task not found');
    await this.assertTaskAccess(task, actor, false);

    const updated = await db.update('tasks', task.id, {
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userRef(actor)
    });

    await recordAudit(actor, 'TASK_ACKNOWLEDGED', 'tasks', task.id, { title: task.title }, req);
    return updated;
  },

  /**
   * Completes task with "Forgot to Send" client delivery verification & evidence upload.
   * Cancels future pending reminders.
   */
  async completeTask(taskId, data = {}, actor = null, req = null) {
    const task = await db.findById('tasks', taskId);
    if (!task) throw new Error('Task not found');
    await this.assertTaskAccess(task, actor, false);

    const {
      completion_notes = '',
      evidence_url = null,
      evidence_name = null,
      delivery_stages = null
    } = data;

    // Delivery task protection: ensure client delivery stage is checked
    let finalStages = delivery_stages || task.delivery_stages;
    if (task.task_type === 'delivery') {
      if (finalStages && !finalStages.sent_to_client && !data.bypass_delivery_check) {
        throw new Error('Forgot-To-Send Protection: You must verify that the deliverable was sent to the client (sent_to_client = true) before marking as completed.');
      }
    }

    const updated = await db.update('tasks', task.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userRef(actor) || null,
      completion_notes: completion_notes || 'Task deliverable confirmed and marked completed.',
      evidence_url,
      evidence_name,
      delivery_stages: finalStages,
      progress: 100
    });

    // TASK COMPLETION PROTECTION: Cancel all scheduled reminders for this task!
    await reminderService.cancelTaskReminders(task.id);

    await recordAudit(actor, 'TASK_COMPLETED', 'tasks', task.id, {
      title: task.title,
      client_name: task.client_name,
      completion_notes
    }, req);

    return updated;
  },

  /**
   * Updates task delivery milestones (e.g. prepared, reviewed, sent_to_client).
   */
  async updateDeliveryStages(taskId, stages, actor = null, req = null) {
    const task = await db.findById('tasks', taskId);
    if (!task) throw new Error('Task not found');
    await this.assertTaskAccess(task, actor, false);

    const updated = await db.update('tasks', task.id, {
      delivery_stages: {
        ...(task.delivery_stages || {}),
        ...stages
      }
    });

    await recordAudit(actor, 'TASK_DELIVERY_STAGES_UPDATED', 'tasks', task.id, { stages }, req);
    return updated;
  },

  async getDiscussion(taskId, actor) {
    const task = await db.findById('tasks', taskId);
    if (!task || !sameId(task.company_id || 1, actor.company_id || actor.employee?.company_id || 1)) throw new Error('Task not found.');
    const [comments, users] = await Promise.all([
      db.find('task_comments', { task_id: task.id }, { order: { column: 'created_at', ascending: true } }),
      db.find('users')
    ]);
    return comments.filter(c => sameId(c.company_id || task.company_id || 1, actor.company_id || actor.employee?.company_id || 1))
      .map(c => {
        const author = users.find(u => [u.id, u.uuid, u.auth_user_id].some(id => sameId(id, c.author_id)));
        return { id: c.id, task_id: c.task_id, comment: c.comment, created_at: c.created_at,
          author: author?.full_name || author?.name || author?.email || 'Staff member' };
      });
  },

  async addComment(taskId, message, actor, req = null) {
    const task = await db.findById('tasks', taskId);
    if (!task || !sameId(task.company_id || 1, actor.company_id || actor.employee?.company_id || 1)) throw new Error('Task not found.');
    if (typeof message !== 'string' || !message.trim() || message.trim().length > 2000) throw new Error('Write a message up to 2,000 characters.');
    const comment = await db.insert('task_comments', { task_id: task.id, author_id: userRef(actor) || actor.id,
      comment: message.trim(), created_at: new Date().toISOString() });
    await recordAudit(actor, 'TASK_COMMENT_ADDED', 'tasks', task.id, { comment_id: comment.id }, req);
    return { ...comment, author: actor.full_name || actor.name || actor.email || 'Staff member' };
  }
};
