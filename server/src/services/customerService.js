// ==============================================================================
// EDGEWFORCE - CUSTOMER 360 & RELATIONSHIP MANAGEMENT SERVICE
// ==============================================================================

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { employeeRef, findEmployeeByAnyId, toDbId } from '../utils/id.js';

export const customerService = {
  async getCustomers(companyId, filters = {}) {
    const compId = Number(companyId || 1);
    let list = await db.find('customers', { company_id: compId }, {
      order: { column: 'name', ascending: true }
    });

    if (filters.customer_type && filters.customer_type !== 'all') {
      list = list.filter(c => c.customer_type.toLowerCase() === filters.customer_type.toLowerCase());
    }

    if (filters.territory_id && filters.territory_id !== 'all') {
      list = list.filter(c => String(c.territory_id) === String(filters.territory_id));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    return list;
  },

  async getCustomerById(id, companyId) {
    const customer = await db.findById('customers', id);
    if (!customer) return null;
    if (companyId && customer.company_id !== Number(companyId)) return null;
    return customer;
  },

  async getCustomer360(customerId, companyId) {
    const customer = await db.findById('customers', customerId);
    if (!customer) throw new Error('Customer not found');

    const compId = customer.company_id;

    // 1. Orders
    const orders = await db.find('orders', { customer_id: Number(customerId), company_id: compId }, {
      order: { column: 'created_at', ascending: false }
    });

    // 2. Visits
    const visits = await db.find('visits', { customer_id: Number(customerId), company_id: compId }, {
      order: { column: 'planned_date', ascending: false }
    });

    // 3. Collections & Payments
    const collections = await db.find('collections', { customer_id: Number(customerId), company_id: compId }, {
      order: { column: 'payment_date', ascending: false }
    });

    // 4. Assigned Agent & Supervisor
    let agent = null;
    let supervisor = null;
    if (customer.assigned_agent_id) {
      agent = await findEmployeeByAnyId(db, customer.assigned_agent_id);
    }
    if (customer.assigned_supervisor_id) {
      supervisor = await findEmployeeByAnyId(db, customer.assigned_supervisor_id);
    }

    // Summary calculations
    const totalOrderVolume = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalPaid = collections.reduce((sum, c) => sum + (c.amount || 0), 0);
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;

    return {
      customer,
      assignedAgent: agent,
      assignedSupervisor: supervisor,
      metrics: {
        totalOrders: orders.length,
        totalOrderVolume,
        totalPaid,
        outstandingBalance: customer.balance || 0,
        creditLimit: customer.credit_limit || 1000000,
        totalVisits: visits.length,
        completedVisits
      },
      orders,
      visits,
      collections
    };
  },

  async createCustomer(customerData, user) {
    const compId = Number(user?.company_id || customerData.company_id || 1);
    const created = await db.insert('customers', {
      company_id: compId,
      code: customerData.code || `CUST-${Date.now().toString().slice(-4)}`,
      name: customerData.name,
      business_name: customerData.business_name || customerData.name,
      customer_type: customerData.customer_type || 'Retail',
      tier: customerData.tier || 'Tier 2',
      region_id: customerData.region_id ? Number(customerData.region_id) : 1,
      territory_id: customerData.territory_id ? Number(customerData.territory_id) : 1,
      territory: customerData.territory || 'Lagos Mainland',
      address: customerData.address,
      latitude: customerData.latitude ? Number(customerData.latitude) : 6.5244,
      longitude: customerData.longitude ? Number(customerData.longitude) : 3.3792,
      geofence_radius: Number(customerData.geofence_radius || 150),
      contact_person: customerData.contact_person || '',
      phone: customerData.phone || '',
      email: customerData.email || '',
      credit_limit: Number(customerData.credit_limit || 1000000),
      balance: Number(customerData.balance || 0),
      assigned_agent_id: customerData.assigned_agent_id ? toDbId(customerData.assigned_agent_id) : null,
      assigned_supervisor_id: customerData.assigned_supervisor_id ? toDbId(customerData.assigned_supervisor_id) : null,
      status: 'active',
      total_sales_ngn: 0
    });

    await db.insert('audit_logs', {
      company_id: compId,
      user_id: user?.id || null,
      user_email: user?.email || 'sales',
      action: 'CUSTOMER_CREATED',
      entity: 'customers',
      entity_id: String(created.id),
      new_value: created
    });

    return created;
  },

  async updateCustomer(id, updates, user) {
    const existing = await db.findById('customers', id);
    if (!existing) throw new Error('Customer not found');

    const updated = await db.update('customers', id, updates);

    await db.insert('audit_logs', {
      company_id: existing.company_id,
      user_id: user?.id || null,
      user_email: user?.email || 'admin',
      action: 'CUSTOMER_UPDATED',
      entity: 'customers',
      entity_id: String(id),
      previous_value: existing,
      new_value: updated
    });

    return updated;
  },

  /**
   * Updates customer/store location using GPS coordinates and resolves exact street address.
   */
  async updateLocation(id, { latitude, longitude, accuracy }, user) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) throw new Error('Valid latitude and longitude are required');

    const customer = await db.findById('customers', id);
    if (!customer) throw new Error('Customer not found');

    const { reverseGeocode, getGoogleMapsNavigationUrl } = await import('../utils/geocoder.js');
    const realAddress = await reverseGeocode(lat, lng);
    const directionsUrl = getGoogleMapsNavigationUrl(lat, lng, customer.name);

    const updated = await db.update('customers', id, {
      latitude: lat,
      longitude: lng,
      address: realAddress,
      gps_accuracy: accuracy ? Number(accuracy) : 5,
      last_gps_updated_at: new Date().toISOString(),
      google_maps_directions_url: directionsUrl
    });

    await db.insert('audit_logs', {
      company_id: customer.company_id,
      user_id: user?.id || null,
      user_email: user?.email || 'agent',
      action: 'CUSTOMER_GPS_UPDATED',
      entity: 'customers',
      entity_id: String(id),
      new_value: { latitude: lat, longitude: lng, address: realAddress }
    });

    return {
      ...updated,
      resolved_address: realAddress,
      directions_url: directionsUrl
    };
  }
};

