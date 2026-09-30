// ==============================================================================
// EDGEWFORCE - INVENTORY & WAREHOUSE SERVICE
// ==============================================================================

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { userRef } from '../utils/id.js';
import { CONSOLIDATED_INVENTORY, PHYSICAL_INVENTORY_LOCATIONS } from '../data/inventoryData.js';

export const inventoryService = {
  /**
   * Idempotently seeds the consolidated physical inventory across the 10 location sheets
   */
  async seedConsolidatedInventory(companyId = 1) {
    const compId = Number(companyId || 1);
    const existing = await db.find('products', { company_id: compId });
    const existingSkus = new Set(existing.map(p => p.sku));
    const existingKeys = new Set(existing.map(p => `${(p.name || '').toLowerCase()}|${(p.location_of_item || p.warehouse_name || '').toLowerCase()}`));

    let insertedCount = 0;
    for (const item of CONSOLIDATED_INVENTORY) {
      const itemKey = `${(item.name || '').toLowerCase()}|${(item.location_of_item || '').toLowerCase()}`;
      if (!existingSkus.has(item.sku) && !existingKeys.has(itemKey)) {
        await db.insert('products', {
          company_id: compId,
          sku: item.sku,
          name: item.name,
          category: item.category || 'General FMCG',
          unit: item.unit || 'pcs',
          price: Number(item.price || 0),
          cost_price: Number(item.cost_price || 0),
          stock_quantity: Number(item.stock_quantity || 0),
          quantity_display: item.quantity_display || String(item.stock_quantity || 0),
          reorder_level: Number(item.reorder_level || 0),
          warehouse_name: item.location_of_item || item.warehouse_name || 'Warehouse Shelves',
          location_of_item: item.location_of_item || item.warehouse_name || 'Warehouse Shelves',
          condition: item.condition || '—',
          shelf_number: item.shelf_number || '—',
          shelve_location: item.shelf_number && item.shelf_number !== '—' ? item.shelf_number : (item.location_of_item || 'General Floor'),
          status: 'active'
        });
        existingSkus.add(item.sku);
        existingKeys.add(itemKey);
        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      logger.info(`[INVENTORY] Idempotently seeded ${insertedCount} consolidated physical inventory items.`);
    }
  },

  async getProducts(companyId, filters = {}) {
    const compId = Number(companyId || 1);
    if (compId === 1) {
      await this.seedConsolidatedInventory(compId);
    }

    let list = await db.find('products', { company_id: compId });

    // 1. Category Filter
    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => (p.category || '').toLowerCase() === filters.category.toLowerCase());
    }

    // 2. Location of Item Filter
    if (filters.location && filters.location !== 'all') {
      const locFilter = filters.location.toLowerCase();
      list = list.filter(p => {
        const pLoc = (p.location_of_item || p.warehouse_name || '').toLowerCase();
        return pLoc === locFilter || pLoc.includes(locFilter);
      });
    }

    // 3. Smart Search Filter (Item name, SKU, Location of Item, Shelf Number, Condition, Category)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const locMatch = (p.location_of_item || p.warehouse_name || '').toLowerCase().includes(q);
        const shelfMatch = (p.shelf_number || p.shelve_location || '').toLowerCase().includes(q);
        const condMatch = (p.condition || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        return nameMatch || skuMatch || locMatch || shelfMatch || condMatch || catMatch;
      });
    }

    // 4. Low Stock Filter
    if (filters.low_stock) {
      list = list.filter(p => p.stock_quantity <= (p.reorder_level || 20));
    }

    return list.map(p => ({
      ...p,
      location_of_item: p.location_of_item || p.warehouse_name || 'Warehouse Shelves',
      condition: p.condition || '—',
      shelf_number: p.shelf_number || (p.shelve_location && p.shelve_location !== p.warehouse_name ? p.shelve_location : '—'),
      quantity_display: p.quantity_display || String(p.stock_quantity ?? 0)
    }));
  },

  async getProductById(id, companyId) {
    const prod = await db.findById('products', id);
    if (prod && companyId && prod.company_id !== Number(companyId)) return null;
    if (prod) {
      return {
        ...prod,
        location_of_item: prod.location_of_item || prod.warehouse_name || 'Warehouse Shelves',
        condition: prod.condition || '—',
        shelf_number: prod.shelf_number || prod.shelve_location || '—',
        quantity_display: prod.quantity_display || String(prod.stock_quantity ?? 0)
      };
    }
    return null;
  },

  async createProduct(productData, user) {
    const compId = Number(user?.company_id || productData.company_id || 1);
    const loc = productData.location_of_item || productData.warehouse_name || 'Warehouse Shelves';
    const created = await db.insert('products', {
      company_id: compId,
      sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: productData.name,
      category: productData.category || 'General FMCG',
      unit: productData.unit || 'carton',
      price: Number(productData.price || 0),
      cost_price: Number(productData.cost_price || 0),
      stock_quantity: Number(productData.stock_quantity || 0),
      quantity_display: productData.quantity_display || String(productData.stock_quantity || 0),
      reorder_level: Number(productData.reorder_level || 20),
      warehouse_name: loc,
      location_of_item: loc,
      condition: productData.condition || 'Not specified',
      shelf_number: productData.shelf_number || productData.shelve_location || '—',
      shelve_location: productData.shelve_location || productData.shelf_number || 'Aisle 1 - Bay A (Rack 1)',
      status: 'active'
    });

    await db.insert('inventory_movements', {
      company_id: compId,
      product_id: created.id,
      movement_type: 'RESTOCK',
      quantity: created.stock_quantity,
      previous_quantity: 0,
      new_quantity: created.stock_quantity,
      reference_number: `INIT-${created.sku}`,
      notes: 'Initial product creation inventory balance',
      recorded_by: userRef(user) || null
    });

    return created;
  },

  async updateProduct(id, updates, user) {
    const existing = await db.findById('products', id);
    if (!existing) throw new Error('Product not found');

    const updated = await db.update('products', id, {
      ...updates,
      location_of_item: updates.location_of_item || updates.warehouse_name || existing.location_of_item || existing.warehouse_name,
      warehouse_name: updates.location_of_item || updates.warehouse_name || existing.warehouse_name,
      shelf_number: updates.shelf_number || updates.shelve_location || existing.shelf_number,
      shelve_location: updates.shelf_number || updates.shelve_location || existing.shelve_location,
      condition: updates.condition || existing.condition
    });
    return updated;
  },

  async deleteProduct(id, user) {
    const existing = await db.findById('products', id);
    if (!existing) throw new Error('Product not found');

    await db.delete('products', id);

    await db.insert('audit_logs', {
      company_id: existing.company_id || 1,
      user_id: user?.id || null,
      user_email: user?.email || 'admin',
      action: 'PRODUCT_DELETED',
      entity: 'products',
      entity_id: String(id),
      previous_value: existing,
      new_value: null
    });

    return {
      success: true,
      message: `Product ${existing.name} (${existing.sku}) deleted successfully.`
    };
  },

  async recordStockMovement(movementData, user) {
    const { product_id, warehouse_id, movement_type, quantity, reference_number, notes } = movementData;
    const prod = await db.findById('products', product_id);
    if (!prod) throw new Error('Product not found');

    const prevQty = Number(prod.stock_quantity || 0);
    const delta = Number(quantity);
    let newQty = prevQty;

    if (['RESTOCK', 'ADJUSTMENT_ADD'].includes(movement_type)) {
      newQty = prevQty + delta;
    } else if (['DISPATCH', 'TRANSFER', 'DAMAGE', 'ADJUSTMENT_SUBTRACT'].includes(movement_type)) {
      if (prevQty < delta && movement_type !== 'DAMAGE') {
        throw new Error(`Insufficient stock. Current stock is ${prevQty} ${prod.unit || 'unit'}s.`);
      }
      newQty = Math.max(0, prevQty - delta);
    }

    // Update product stock
    await db.update('products', product_id, {
      stock_quantity: newQty,
      quantity_display: String(newQty)
    });

    // Record movement
    const movement = await db.insert('inventory_movements', {
      company_id: prod.company_id,
      product_id: Number(product_id),
      warehouse_id: warehouse_id ? Number(warehouse_id) : null,
      movement_type,
      quantity: delta,
      previous_quantity: prevQty,
      new_quantity: newQty,
      reference_number: reference_number || `MOV-${Date.now().toString().slice(-6)}`,
      notes: notes || '',
      recorded_by: userRef(user) || null
    });

    // Check if low stock alert is triggered
    if (prod.reorder_level > 0 && newQty <= prod.reorder_level) {
      await db.insert('alerts', {
        company_id: prod.company_id,
        alert_type: 'LOW_BATTERY',
        severity: 'MEDIUM',
        description: `Low stock alert: ${prod.name} has only ${newQty} remaining (reorder level: ${prod.reorder_level}).`,
        status: 'OPEN'
      });
    }

    return movement;
  },

  async getMovements(companyId, limit = 100) {
    const compId = Number(companyId || 1);
    const list = await db.find('inventory_movements', { company_id: compId }, {
      order: { column: 'created_at', ascending: false },
      limit
    });

    const products = await db.find('products', { company_id: compId });
    const prodMap = new Map(products.map(p => [p.id, p]));

    return list.map(m => ({
      ...m,
      product: prodMap.get(m.product_id) || { name: 'Unknown Item', sku: '' }
    }));
  },

  async getWarehouses(companyId) {
    const compId = Number(companyId || 1);
    const dbWarehouses = await db.find('warehouses', { company_id: compId });
    const physicalLocations = PHYSICAL_INVENTORY_LOCATIONS.map((name, idx) => ({
      id: 100 + idx + 1,
      company_id: compId,
      name,
      code: `LOC-${idx + 1}`,
      address: name.includes('Ogba') ? 'Ogba Facility, Lagos' : (name.includes('Maryland') ? '15 Atiba Osborne, Mende, Maryland, Lagos' : (name.includes('Diamond') ? 'Diamond Estate, Isheri Igando, Lagos' : 'Central Warehouse Facility, Lagos')),
      state: 'Lagos',
      status: 'active'
    }));

    return [...dbWarehouses, ...physicalLocations];
  },

  async getInventorySummary(companyId) {
    const compId = Number(companyId || 1);
    if (compId === 1) {
      await this.seedConsolidatedInventory(compId);
    }
    const products = await db.find('products', { company_id: compId });
    const totalSKUs = products.length;
    const totalQuantity = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
    const totalValuation = products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || p.price || 0)), 0);
    const lowStockCount = products.filter(p => (p.reorder_level > 0) && (p.stock_quantity <= p.reorder_level)).length;

    return {
      totalSKUs,
      totalQuantity,
      totalValuation,
      lowStockCount
    };
  }
};
