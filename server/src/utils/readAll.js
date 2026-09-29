import { db } from '../config/database.js';

// Small pages also work with Supabase projects configured below the default row cap.
export async function readAll(table, filter = {}, options = {}, database = db) {
  const rows = [];
  for (let offset = 0; offset < 100000; offset += 100) {
    const page = await database.find(table, filter, {
      ...options, strict: true, order: { column: 'id', ascending: true }, offset, limit: 100
    });
    rows.push(...page);
    if (page.length < 100) return rows;
  }
  throw new Error(`The ${table} dataset exceeds the supported scan size; no partial totals were returned.`);
}
