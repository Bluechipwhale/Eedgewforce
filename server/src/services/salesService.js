// ==============================================================================
// EDGEWFORCE - COMMERCIAL SALES SERVICE
// POS Order Execution, 5% Commission Engine, Customer Directory & Collections Ledger
// ==============================================================================

import { db } from '../config/database.js';
import { employeeRef, sameId, toDbId, userRef } from '../utils/id.js';
import { calculateOrderTotals, calculateCommission, VAT_RATE } from '../utils/calculations.js';
import { recordAudit } from '../middleware/auditLogger.js';
import { storageService } from './storageService.js';

export const salesService = {
  /**
   * Generates the 12-section Sales Cockpit KPI report and commission metrics.
   */
  async getMyReport(employeeId) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const curMonthStr = todayStr.slice(0, 7);
    const monthlyTarget = Number(process.env.MONTHLY_SALES_TARGET || 10000000);

    const allOrders = await db.find('orders', { sales_agent_id: toDbId(employeeId) });
    const activeOrders = allOrders.filter(o => o.status !== 'cancelled');

    // Today's metrics
    const todayOrders = activeOrders.filter(o => String(o.order_date).slice(0, 10) === todayStr);
    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const ordersTodayCount = todayOrders.length;

    // Monthly metrics
    const monthOrders = activeOrders.filter(o => String(o.order_date).slice(0, 7) === curMonthStr);
    const monthlySales = monthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Commission Engine (5% on closed/delivered/confirmed sales)
    const closedSalesTotal = monthOrders
      .filter(o => ['confirmed', 'delivered', 'paid'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const commissionData = calculateCommission(closedSalesTotal, monthlyTarget);

    // Outstanding debt of registered customers
    const customers = await db.find('customers');
    const myCustomers = customers.filter(c => sameId(c.registered_by, employeeId) || !c.registered_by);
    const outstandingDebt = myCustomers.reduce((sum, c) => sum + Math.max(0, Number(c.balance || 0)), 0);

    // New Outlets Added this month
    const newOutletsAdded = myCustomers.filter(c => String(c.created_at || '').slice(0, 7) === curMonthStr).length;

    // Today's visits completed
    const visits = await db.find('visits', { agent_id: toDbId(employeeId) });
    const visitsToday = visits.filter(v => String(v.planned_time || v.created_at).slice(0, 10) === todayStr);
    const visitsCompletedToday = visitsToday.filter(v => v.status === 'completed').length;

    // Scheduled itinerary for today
    const schedule = await Promise.all(
      visitsToday.map(async v => {
        const customer = await db.findById('customers', v.customer_id);
        return { ...v, customer };
      })
    );

    return {
      todaySales,
      monthlySales,
      monthlyTarget,
      targetAchievement: commissionData.achievementPercentage,
      remainingTarget: commissionData.remainingTarget,
      commission: commissionData.commission,
      ordersToday: ordersTodayCount,
      outstandingDebt,
      newOutletsAdded,
      visitsCompletedToday,
      schedule
    };
  },

  /**
   * Retrieves customers with optional search filtering.
   */
  async getCustomers(query = '', territory = '') {
    const customers = await db.find('customers');
    return customers.filter(c => {
      const q = query.toLowerCase().trim();
      const matchQ = !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q));
      const matchTerritory = !territory || c.territory === territory;
      return matchQ && matchTerritory;
    });
  },

  /**
   * Registers a new merchant with GPS coordinates.
   */
  async createCustomer(data, employeeId, req = null) {
    const { code, name, contact_person, phone, email, address, territory, latitude, longitude, credit_limit } = data;

    if (!name || !address) {
      throw new Error('Merchant name and address are required.');
    }

    const customerCode = code || `CUST-${Math.floor(100 + Math.random() * 900)}`;
    const existing = await db.findOne('customers', { code: customerCode });
    if (existing) {
      throw new Error(`A customer with code ${customerCode} already exists.`);
    }

    const customer = await db.insert('customers', {
      code: customerCode,
      name,
      contact_person: contact_person || '',
      phone: phone || '',
      email: email || '',
      address,
      territory: territory || 'Lagos Mainland',
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      balance: 0.00,
      credit_limit: Number(credit_limit || 500000.00),
      registered_by: toDbId(employeeId),
      status: 'active'
    });

    await recordAudit({ id: employeeId }, 'CUSTOMER_CREATED', 'customers', customer.id, { code: customerCode, name }, req);
    return customer;
  },

  /**
   * Retrieves product catalog with stock levels and status.
   */
  async getProducts(category = '', search = '') {
    const products = await db.find('products');
    return products.filter(p => {
      const matchCategory = !category || category === 'all' || p.category === category;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    }).map(p => ({
      ...p,
      stock_status: p.stock_quantity <= 0 ? 'Out of Stock' : (p.stock_quantity <= p.min_stock_alert ? 'Low Stock' : 'In Stock')
    }));
  },

  /**
   * Creates a POS order with full transactional integrity:
   * Stock verification & deduction, VAT calculation, Credit limit enforcement, and Audit trails.
   */
  async createOrder(orderData, employeeId, req = null) {
    const { customer_id, items, discount, payment_method, notes, idempotency_key } = orderData;

    if (!customer_id) {
      throw new Error('Customer outlet is required.');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Please add at least one product item to the order.');
    }

    // Check duplicate offline submission via idempotency key
    if (idempotency_key) {
      const existing = await db.findOne('orders', { idempotency_key });
      if (existing) {
        return existing;
      }
    }

    return await db.transaction(async (tx) => {
      const customer = await tx.findById('customers', customer_id);
      if (!customer) {
        throw new Error('Selected customer does not exist.');
      }

      // Fetch products and validate stock quantities
      const validatedItems = [];
      for (const item of items) {
        const product = await tx.findById('products', item.product_id);
        if (!product) {
          throw new Error(`Product ID ${item.product_id} not found.`);
        }
        const qty = Number(item.quantity || 0);
        if (qty <= 0) {
          throw new Error(`Invalid quantity ${qty} for product ${product.name}.`);
        }
        if (product.stock_quantity < qty) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${qty}`);
        }
        validatedItems.push({
          product,
          quantity: qty,
          unit_price: Number(product.price),
          total_price: qty * Number(product.price)
        });
      }

      // Calculate totals
      const totals = calculateOrderTotals(validatedItems, discount);

      // Check credit limit if payment method is Credit or unpaid
      const isCredit = payment_method === 'Credit';
      const newCustomerBalance = Number(customer.balance || 0) + (isCredit ? totals.totalAmount : 0);
      if (isCredit && newCustomerBalance > Number(customer.credit_limit || 0)) {
        throw new Error(`Credit limit exceeded. Current balance: ₦${Number(customer.balance).toLocaleString()}, Order Total: ₦${totals.totalAmount.toLocaleString()}, Limit: ₦${Number(customer.credit_limit).toLocaleString()}`);
      }

      const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create order
      const order = await tx.insert('orders', {
        order_number: orderNumber,
        customer_id: Number(customer_id),
        sales_agent_id: toDbId(employeeId),
        status: isCredit ? 'confirmed' : 'delivered',
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        vat_amount: totals.vatAmount,
        total_amount: totals.totalAmount,
        payment_method: payment_method || 'Bank Transfer',
        payment_status: isCredit ? 'unpaid' : 'paid',
        notes: notes || null,
        idempotency_key: idempotency_key || null,
        order_date: new Date().toISOString().slice(0, 10)
      });

      // 2. Create order items & deduct stock
      for (const val of validatedItems) {
        await tx.insert('order_items', {
          order_id: order.id,
          product_id: val.product.id,
          quantity: val.quantity,
          unit_price: val.unit_price,
          total_price: val.total_price
        });

        // Deduct inventory
        const newStock = val.product.stock_quantity - val.quantity;
        await tx.update('products', val.product.id, { stock_quantity: newStock });

        // Record inventory transaction
        await tx.insert('inventory_transactions', {
          product_id: val.product.id,
          change_quantity: -val.quantity,
          previous_quantity: val.product.stock_quantity,
          new_quantity: newStock,
          type: 'SALE',
          reference_id: orderNumber,
          created_by: toDbId(employeeId)
        });
      }

      // 3. Update customer balance if credit
      if (isCredit) {
        await tx.update('customers', customer.id, { balance: newCustomerBalance });
      }

      await recordAudit({ id: employeeId }, 'ORDER_CREATED', 'orders', order.id, { order_number: orderNumber, total: totals.totalAmount }, req);

      return {
        ...order,
        items: validatedItems,
        customer
      };
    });
  },

  /**
   * Retrieves sales orders with rich relational customer and item data.
   */
  async getOrders(filters = {}) {
    const orders = await db.find('orders', {}, { order: { column: 'created_at', ascending: false } });
    const customers = await db.find('customers');
    const orderItems = await db.find('order_items');
    const products = await db.find('products');

    return orders.filter(o => {
      const filterAgentId = filters.sales_agent_id || filters.agent_id;
      if (filterAgentId && !sameId(o.sales_agent_id || o.agent_id, filterAgentId)) return false;
      if (filters.status && filters.status !== 'all' && o.status !== filters.status) return false;
      if (filters.customer_id && Number(o.customer_id) !== Number(filters.customer_id)) return false;
      return true;
    }).map(o => {
      const customer = customers.find(c => Number(c.id) === Number(o.customer_id));
      const items = orderItems.filter(i => Number(i.order_id) === Number(o.id)).map(i => {
        const prod = products.find(p => Number(p.id) === Number(i.product_id));
        return { ...i, product: prod };
      });
      return { ...o, customer, items };
    });
  },

  /**
   * Records a debt recovery collection, reducing the merchant's outstanding balance.
   */
  async recordPayment(paymentData, employeeId, req = null) {
    const { customer_id, amount, payment_method, reference_number, notes, idempotency_key } = paymentData;

    const payAmount = Number(amount || 0);
    if (payAmount <= 0) {
      throw new Error('Payment collection amount must be greater than zero.');
    }

    if (idempotency_key) {
      const existing = await db.findOne('collections', { idempotency_key });
      if (existing) return existing;
    }

    return await db.transaction(async (tx) => {
      const customer = await tx.findById('customers', customer_id);
      if (!customer) {
        throw new Error('Customer outlet not found.');
      }

      const newBalance = Math.max(0, Number(customer.balance || 0) - payAmount);
      await tx.update('customers', customer.id, { balance: newBalance });

      const collection = await tx.insert('collections', {
        customer_id: Number(customer_id),
        agent_id: toDbId(employeeId),
        amount: payAmount,
        payment_method: payment_method || 'Cash',
        reference_number: reference_number || `REF-${Date.now()}`,
        notes: notes || null,
        idempotency_key: idempotency_key || null,
        payment_date: new Date().toISOString()
      });

      await recordAudit({ id: employeeId }, 'PAYMENT_RECORDED', 'collections', collection.id, { customer_id, amount: payAmount }, req);

      return {
        ...collection,
        customer_name: customer.name,
        new_balance: newBalance
      };
    });
  },

  /**
   * Retrieves collections ledger.
   */
  async getPayments(filters = {}) {
    const collections = await db.find('collections', {}, { order: { column: 'payment_date', ascending: false } });
    const customers = await db.find('customers');
    const employees = await db.find('employees');

    return collections.filter(c => {
      if (filters.agent_id && !sameId(c.agent_id, filters.agent_id)) return false;
      if (filters.customer_id && Number(c.customer_id) !== Number(filters.customer_id)) return false;
      return true;
    }).map(c => ({
      ...c,
      customer: customers.find(cust => Number(cust.id) === Number(c.customer_id)),
      agent: employees.find(emp => sameId(emp.id, c.agent_id) || sameId(emp.uuid, c.agent_id) || sameId(emp.auth_user_id, c.agent_id))
    }));
  },

  /**
   * Logs competitor market intelligence with price difference auto-calculation.
   */
  async createCompetitorIntel(data, employeeId, file = null, req = null) {
    const { customer_id, competitor_brand, product_name, observed_price, our_price, shelf_share_percent, promo_details } = data;

    if (!competitor_brand || !product_name || !observed_price || !our_price) {
      throw new Error('Competitor brand, product name, observed shelf price and our price are required.');
    }

    const obsPrice = Number(observed_price);
    const oPrice = Number(our_price);
    const priceDiff = obsPrice - oPrice;

    const intel = await db.insert('competitor_intel', {
      agent_id: toDbId(employeeId),
      customer_id: customer_id ? Number(customer_id) : null,
      competitor_brand,
      product_name,
      observed_price: obsPrice,
      our_price: oPrice,
      price_difference: priceDiff,
      shelf_share_percent: Number(shelf_share_percent || 50),
      promo_details: promo_details || '',
      picture_url: file ? await storageService.uploadFile(file, 'competitor_intel') : null
    });

    await recordAudit({ id: employeeId }, 'COMPETITOR_INTEL_LOGGED', 'competitor_intel', intel.id, { competitor_brand, product_name }, req);
    return intel;
  },

  /**
   * Retrieves competitor market intelligence feed with customer names.
   */
  async getCompetitorIntel() {
    const list = await db.find('competitor_intel', {}, { order: { column: 'created_at', ascending: false } });
    const customers = await db.find('customers');
    return list.map(item => ({
      ...item,
      customer: item.customer_id ? customers.find(c => Number(c.id) === Number(item.customer_id)) : null
    }));
  },

  /**
   * Order Approval Workflow: Approves pending order, updates inventory & records audit log.
   */
  async approveOrder(orderId, approverUser, comments = '') {
    const order = await db.findById('orders', orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;
    const updated = await db.update('orders', orderId, {
      status: 'APPROVED',
      approved_by: userRef(approverUser),
      approved_at: new Date().toISOString()
    });

    await db.insert('order_approvals', {
      company_id: order.company_id,
      order_id: Number(orderId),
      approver_id: userRef(approverUser),
      action: 'APPROVED',
      comments: comments || 'Order approved by supervisor',
      created_at: new Date().toISOString()
    });

    // Auto-create delivery record in PENDING state
    const existingDeliv = await db.findOne('deliveries', { order_id: Number(orderId) });
    if (!existingDeliv) {
      await db.insert('deliveries', {
        company_id: order.company_id,
        order_id: Number(orderId),
        customer_id: order.customer_id,
        delivery_status: 'PENDING',
        created_at: new Date().toISOString()
      });
    }

    return updated;
  },

  /**
   * Order Approval Workflow: Rejects order with reason.
   */
  async rejectOrder(orderId, approverUser, reason = '') {
    const order = await db.findById('orders', orderId);
    if (!order) throw new Error('Order not found');

    const updated = await db.update('orders', orderId, {
      status: 'REJECTED',
      rejection_reason: reason || 'Order rejected by supervisor',
      approved_by: userRef(approverUser),
      approved_at: new Date().toISOString()
    });

    await db.insert('order_approvals', {
      company_id: order.company_id,
      order_id: Number(orderId),
      approver_id: userRef(approverUser),
      action: 'REJECTED',
      comments: reason || 'Order rejected',
      created_at: new Date().toISOString()
    });

    return updated;
  },

  /**
   * Order Approval Workflow: Requests modifications.
   */
  async requestOrderChanges(orderId, approverUser, comments = '') {
    const order = await db.findById('orders', orderId);
    if (!order) throw new Error('Order not found');

    const updated = await db.update('orders', orderId, {
      status: 'DRAFT',
      notes: `${order.notes || ''} [Change Request: ${comments}]`
    });

    await db.insert('order_approvals', {
      company_id: order.company_id,
      order_id: Number(orderId),
      approver_id: userRef(approverUser),
      action: 'REQUESTED_CHANGES',
      comments: comments || 'Modifications requested by supervisor',
      created_at: new Date().toISOString()
    });

    return updated;
  },

  /**
   * Computes Sales Funnel conversion stages and rates.
   */
  async getSalesFunnel(companyId) {
    const compId = Number(companyId || 1);
    const visits = await db.find('visits', { company_id: compId });
    const orders = await db.find('orders', { company_id: compId });
    const collections = await db.find('collections', { company_id: compId });

    const totalVisits = visits.length || 1;
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
    const totalOrders = orders.length;
    const approvedOrders = orders.filter(o => ['APPROVED', 'DISPATCHED', 'DELIVERED', 'PAID'].includes(o.status)).length;
    const dispatchedOrders = orders.filter(o => ['DISPATCHED', 'DELIVERED', 'PAID'].includes(o.status) || o.delivery_status === 'DELIVERED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'PAID' || o.delivery_status === 'DELIVERED').length;
    const paidOrders = orders.filter(o => o.payment_status === 'PAID' || o.status === 'PAID').length;

    const stages = [
      { name: 'Store Visits', count: totalVisits, value: '100%' },
      { name: 'Completed Visits', count: completedVisits, value: `${Math.round((completedVisits / totalVisits) * 100)}%` },
      { name: 'Orders Booked', count: totalOrders, value: `${Math.round((totalOrders / Math.max(1, completedVisits)) * 100)}%` },
      { name: 'Approved Orders', count: approvedOrders, value: `${Math.round((approvedOrders / Math.max(1, totalOrders)) * 100)}%` },
      { name: 'Dispatched & In Transit', count: dispatchedOrders, value: `${Math.round((dispatchedOrders / Math.max(1, approvedOrders)) * 100)}%` },
      { name: 'Delivered Outlets', count: deliveredOrders, value: `${Math.round((deliveredOrders / Math.max(1, dispatchedOrders)) * 100)}%` },
      { name: 'Fully Paid / Collected', count: paidOrders, value: `${Math.round((paidOrders / Math.max(1, deliveredOrders)) * 100)}%` }
    ];

    return {
      stages,
      conversionRate: Math.round((paidOrders / totalVisits) * 100)
    };
  },

  /**
   * Process Paystack simulated or live collection
   */
  async processPaystackCollection(paymentData, user) {
    const { customer_id, order_id, amount, paystack_reference } = paymentData;
    const customer = await db.findById('customers', customer_id);
    if (!customer) throw new Error('Customer not found');

    const compId = customer.company_id;
    const recAmount = Number(amount);

    const collection = await db.insert('collections', {
      company_id: compId,
      customer_id: Number(customer_id),
      agent_id: user?.employee ? employeeRef(user.employee) : (user?.employee_id || user?.id || 1),
      order_id: order_id ? Number(order_id) : null,
      amount: recAmount,
      payment_method: 'Paystack',
      reference_number: `PAYSTACK-${paystack_reference || Date.now()}`,
      paystack_reference: paystack_reference || `PSTK_REF_${Date.now()}`,
      status: 'PAID',
      payment_date: new Date().toISOString()
    });

    // Update customer balance
    const newBal = Math.max(0, Number(customer.balance || 0) - recAmount);
    await db.update('customers', customer_id, { balance: newBal });

    // If linked to order, mark order as paid
    if (order_id) {
      await db.update('orders', order_id, {
        payment_status: 'PAID',
        payment_method: 'Paystack'
      });
    }

    return collection;
  }
};


