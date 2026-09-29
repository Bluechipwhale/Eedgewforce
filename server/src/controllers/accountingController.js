// ==============================================================================
// EDGEWFORCE - ACCOUNTING & EXECUTIVE CONTROLLERS
// ==============================================================================

import { accountingService } from '../services/accountingService.js';
import { executiveService } from '../services/executiveService.js';
import { insightService } from '../services/insightService.js';
import { notificationService } from '../services/notificationService.js';
import { storageService } from '../services/storageService.js';

export const accountingController = {
  async getOverview(req, res) {
    try {
      const data = await accountingService.getFinancialOverview();
      res.json({ success: true, data, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getPayslips(req, res) {
    try {
      const list = await accountingService.getAllPayslips(req.query.pay_month);
      res.json({ success: true, data: list, payslips: list });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async reviewSettlement(req, res) {
    try {
      const { status, notes } = req.body;
      const settlement = await accountingService.reviewSettlement(req.params.id, status, notes, req.user, req);
      res.json({ success: true, data: settlement, settlement, message: `Settlement ${status}.` });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async generatePayroll(req, res) {
    try {
      const result = await accountingService.generatePayrollBatch(req.body.pay_month, req.user, req);
      res.status(201).json({ success: true, data: result, ...result, message: `Generated ${result.count} employee payslips for ${result.month}.` });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async generateSinglePayslip(req, res) {
    try {
      const { employee_id, pay_month, basic_salary, housing_allowance, transport_allowance, other_allowance, notes } = req.body;
      if (!employee_id) {
        return res.status(400).json({ success: false, error: { message: 'Employee ID is required.' } });
      }
      const payslip = await accountingService.generateSinglePayslip(employee_id, pay_month, {
        basic_salary,
        housing_allowance,
        transport_allowance,
        other_allowance,
        notes
      }, req.user, req);

      res.status(201).json({ success: true, data: payslip, payslip, message: 'Payslip generated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async uploadPayslip(req, res) {
    try {
      const { employee_id, pay_month, notes } = req.body;
      if (!employee_id) {
        return res.status(400).json({ success: false, error: { message: 'Employee ID is required.' } });
      }

      const fileUrl = req.file ? await storageService.uploadFile(req.file, 'payslips') : req.body.pdf_url;
      const payslip = await accountingService.uploadCustomPayslip(employee_id, pay_month, fileUrl, notes, req.user, req);

      res.status(201).json({ success: true, data: payslip, payslip, message: 'Custom payslip uploaded and published successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
};

export const executiveController = {
  async getDashboard(req, res) {
    try {
      const metrics = await executiveService.getCEODashboardMetrics();
      res.json({ success: true, data: metrics, ...metrics });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};

export const aiController = {
  async getBriefing(req, res) {
    try {
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: await insightService.getBriefing(req.user) });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Unable to load the operational briefing.' } });
    }
  },
  async askCopilot(req, res) {
    try {
      const { prompt, customer_id } = req.body;
      if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
        return res.status(400).json({ success: false, error: { message: 'Prompt query is required.' } });
      }
      const result = await insightService.ask(prompt.trim(), req.user, { customerId: customer_id });
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: result, guidance: result.guidance });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};

export const notificationController = {
  async getNotifications(req, res) {
    try {
      const empId = req.user.employee?.id || req.user.id;
      const data = await notificationService.getNotifications(empId);
      res.json({ success: true, data: data.notifications, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async markRead(req, res) {
    try {
      const empId = req.user.employee?.id || req.user.id;
      const result = await notificationService.markRead(req.body?.id || req.params?.id || 'all', empId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async markAllRead(req, res) {
    try {
      const empId = req.user.employee?.id || req.user.id;
      const result = await notificationService.markRead('all', empId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async subscribePush(req, res) {
    try {
      const empId = req.user.employee?.id || req.user.id;
      const { endpoint, subscription } = req.body;
      const result = await notificationService.subscribePush(empId, endpoint, subscription);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  async unsubscribePush(req, res) {
    res.json({ success: true, message: 'Push subscription removed.' });
  }
};
