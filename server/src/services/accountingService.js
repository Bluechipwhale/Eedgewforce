// ==============================================================================
// EDGEWFORCE - ACCOUNTING & FINANCE SERVICE
// Collections Ledger, Cash Settlements, Payroll Runs & Financial Integrity
// ==============================================================================

import { db } from '../config/database.js';
import { calculatePayslipBreakdown } from '../utils/calculations.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { employeeRef, findEmployeeByAnyId, sameId, userRef } from '../utils/id.js';

export const accountingService = {
  /**
   * Retrieves high-level commercial financial position.
   */
  async getFinancialOverview() {
    const orders = await db.find('orders', { status: 'delivered' });
    const collections = await db.find('collections');
    const customers = await db.find('customers');
    const settlements = await db.find('settlements');
    const payslips = await db.find('payslips');

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const totalCollected = collections.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, Number(c.balance || 0)), 0);
    const pendingSettlements = settlements.filter(s => s.status === 'submitted' || s.status === 'under_review');

    return {
      totalRevenue,
      totalCollected,
      totalOutstanding,
      totalPayslipsGenerated: payslips.length,
      pendingSettlementsCount: pendingSettlements.length,
      collectionEfficiency: totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 100
    };
  },

  /**
   * Retrieves all payslips with employee details.
   */
  async getAllPayslips(payMonth = null) {
    const filter = payMonth ? { pay_month: payMonth } : {};
    const payslips = await db.find('payslips', filter, { order: { column: 'id', ascending: false } });
    const employees = await db.find('employees');

    return payslips.map(p => {
      const emp = employees.find(e => sameId(employeeRef(e), p.employee_id) || sameId(e.id, p.employee_id));
      return {
        ...p,
        employee: emp ? {
          id: emp.id,
          employee_code: emp.employee_code,
          first_name: emp.first_name,
          last_name: emp.last_name,
          department: emp.department,
          position: emp.position
        } : null
      };
    });
  },

  /**
   * Reviews cash reconciliation settlement submitted by field/sales agents.
   */
  async reviewSettlement(settlementId, status, notes = '', actor = null, req = null) {
    const settlement = await db.findById('settlements', settlementId);
    if (!settlement) throw new Error('Settlement not found');

    const updated = await db.update('settlements', settlement.id, {
      status,
      notes: notes || settlement.notes,
      reviewed_by: userRef(actor) || actor?.id || 1,
      reviewed_at: new Date().toISOString()
    });

    await recordAudit(actor, `SETTLEMENT_${status.toUpperCase()}`, 'settlements', settlement.id, { notes }, req);
    return updated;
  },

  /**
   * Generates or recalculates a single employee payslip.
   */
  async generateSinglePayslip(employeeId, payMonth, customEarnings = {}, actor = null, req = null) {
    const emp = await findEmployeeByAnyId(db, employeeId);
    if (!emp) throw new Error('Employee not found');

    const targetMonth = payMonth || (new Date().toISOString().slice(0, 7) + '-01');
    const basic = customEarnings.basic_salary !== undefined ? Number(customEarnings.basic_salary) : emp.base_salary;
    const housing = customEarnings.housing_allowance !== undefined ? Number(customEarnings.housing_allowance) : emp.housing_allowance;
    const transport = customEarnings.transport_allowance !== undefined ? Number(customEarnings.transport_allowance) : emp.transport_allowance;
    const other = customEarnings.other_allowance !== undefined ? Number(customEarnings.other_allowance) : emp.other_allowance;

    const breakdown = calculatePayslipBreakdown(basic, housing, transport, other);

    const empId = employeeRef(emp);
    const existing = await db.findOne('payslips', { employee_id: empId, pay_month: targetMonth });
    let record;
    if (existing) {
      record = await db.update('payslips', existing.id, {
        ...breakdown,
        status: 'published',
        notes: customEarnings.notes || existing.notes,
        updated_at: new Date().toISOString()
      });
    } else {
      record = await db.insert('payslips', {
        employee_id: empId,
        pay_month: targetMonth,
        ...breakdown,
        status: 'published',
        notes: customEarnings.notes || '',
        generated_by: userRef(actor) || null
      });
    }

    await recordAudit(actor, 'PAYSLIP_SINGLE_GENERATED', 'payslips', record.id, { employee_id: empId, targetMonth }, req);
    return record;
  },

  /**
   * Uploads an external PDF / Document payslip for a specific staff member.
   */
  async uploadCustomPayslip(employeeId, payMonth, fileUrl, notes = '', actor = null, req = null) {
    const emp = await findEmployeeByAnyId(db, employeeId);
    if (!emp) throw new Error('Employee not found');

    const targetMonth = payMonth || (new Date().toISOString().slice(0, 7) + '-01');
    const breakdown = calculatePayslipBreakdown(emp.base_salary, emp.housing_allowance, emp.transport_allowance, emp.other_allowance);

    const empId = employeeRef(emp);
    const existing = await db.findOne('payslips', { employee_id: empId, pay_month: targetMonth });
    let record;
    if (existing) {
      record = await db.update('payslips', existing.id, {
        ...breakdown,
        pdf_url: fileUrl,
        notes: notes || 'Document uploaded by Finance',
        status: 'published',
        updated_at: new Date().toISOString()
      });
    } else {
      record = await db.insert('payslips', {
        employee_id: empId,
        pay_month: targetMonth,
        ...breakdown,
        pdf_url: fileUrl,
        notes: notes || 'Document uploaded by Finance',
        status: 'published',
        generated_by: userRef(actor) || null
      });
    }

    await recordAudit(actor, 'PAYSLIP_DOCUMENT_UPLOADED', 'payslips', record.id, { employee_id: empId, fileUrl }, req);
    return record;
  },

  /**
   * Runs automated monthly payroll generation for all active employees.
   */
  async generatePayrollBatch(payMonth = null, actor = null, req = null) {
    const targetMonth = payMonth || (new Date().toISOString().slice(0, 7) + '-01');
    const employees = await db.find('employees', { status: 'active' });
    const generated = [];

    for (const emp of employees) {
      const empId = employeeRef(emp);
      const existing = await db.findOne('payslips', { employee_id: empId, pay_month: targetMonth });
      const breakdown = calculatePayslipBreakdown(
        emp.base_salary,
        emp.housing_allowance,
        emp.transport_allowance,
        emp.other_allowance
      );

      let record;
      if (existing) {
        record = await db.update('payslips', existing.id, {
          ...breakdown,
          status: 'published'
        });
      } else {
        record = await db.insert('payslips', {
          employee_id: empId,
          pay_month: targetMonth,
          ...breakdown,
          status: 'published',
          generated_by: userRef(actor) || null
        });
      }
      generated.push(record);
    }

    await recordAudit(actor, 'PAYROLL_BATCH_GENERATED', 'payslips', targetMonth, { count: generated.length }, req);
    return {
      month: targetMonth,
      count: generated.length,
      payslips: generated
    };
  }
};
