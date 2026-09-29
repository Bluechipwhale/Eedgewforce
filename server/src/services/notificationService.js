// ==============================================================================
// EDGEWFORCE - NOTIFICATION ENGINE SERVICE
// In-App Notifications, Push Subscriptions & Emergency Chimes
// ==============================================================================

import { db } from '../config/database.js';
import { findEmployeeByAnyId, employeeRef, toDbId } from '../utils/id.js';

async function resolveEmployeeRef(employeeId) {
  const employee = await findEmployeeByAnyId(db, employeeId);
  return employee ? employeeRef(employee) : toDbId(employeeId);
}

export const notificationService = {
  /**
   * Dispatches a notification to an employee.
   */
  async notify(employeeId, type, title, body, link = null) {
    const empId = await resolveEmployeeRef(employeeId);
    return await db.insert('notifications', {
      employee_id: empId,
      type: type || 'System',
      title,
      body,
      link: link || null,
      read: false
    });
  },

  /**
   * Retrieves user notifications with unread count.
   */
  async getNotifications(employeeId) {
    const empId = await resolveEmployeeRef(employeeId);
    const list = await db.find('notifications', { employee_id: empId }, { order: { column: 'created_at', ascending: false } });
    const unreadCount = list.filter(n => !n.read).length;
    return {
      notifications: list,
      unreadCount
    };
  },

  /**
   * Marks a notification or all notifications as read.
   */
  async markRead(notificationId, employeeId) {
    if (notificationId === 'all') {
      const empId = await resolveEmployeeRef(employeeId);
      const all = await db.find('notifications', { employee_id: empId, read: false });
      for (const n of all) {
        await db.update('notifications', n.id, { read: true });
      }
      return { success: true };
    }

    return await db.update('notifications', notificationId, { read: true });
  },

  /**
   * Saves Web Push subscription.
   */
  async subscribePush(employeeId, endpoint, subscriptionJson) {
    const empId = await resolveEmployeeRef(employeeId);
    const existing = await db.findOne('push_subscriptions', { employee_id: empId });
    if (existing) {
      return await db.update('push_subscriptions', existing.id, {
        endpoint,
        subscription_json: typeof subscriptionJson === 'string' ? subscriptionJson : JSON.stringify(subscriptionJson)
      });
    }

    return await db.insert('push_subscriptions', {
      employee_id: empId,
      endpoint,
      subscription_json: typeof subscriptionJson === 'string' ? subscriptionJson : JSON.stringify(subscriptionJson)
    });
  }
};
