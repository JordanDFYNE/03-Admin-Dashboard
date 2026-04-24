import { pool } from '../src/db/pool.js';
import { parseNumeric } from '../src/utils/parsers.js';
import { ensureLocation } from '../src/services/location-service.js';
import {
  createMovement,
  getCurrentBalance,
  recalculateReorderAlerts,
} from '../src/services/inventory-service.js';

async function resolveWarehouseId(client, locationText) {
  const result = await client.query('select id, code from warehouses order by id');
  const warehouseMap = new Map(result.rows.map((row) => [row.code, row.id]));
  const normalized = String(locationText || '').toUpperCase();
  if (normalized.includes('UNIT 4')) return warehouseMap.get('UNIT4');
  if (normalized.includes('UNIT 3')) return warehouseMap.get('UNIT3');
  return warehouseMap.get('UNIT1');
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const latestImport = await client.query(`
      select id
      from import_batches
      where import_type = 'consumables_master'
      order by id desc
      limit 1
    `);

    const importBatchId = latestImport.rows[0]?.id;
    if (!importBatchId) {
      throw new Error('No consumables_master import batch found');
    }

    await client.query('delete from stock_movement_lines');
    await client.query('delete from stock_movements');
    await client.query('delete from stock_balances');

    const rowsResult = await client.query(
      `
        select raw_data
        from import_rows
        where import_batch_id = $1
          and status = 'valid'
        order by row_number asc
      `,
      [importBatchId]
    );

    for (const row of rowsResult.rows) {
      const raw = row.raw_data;
      const consumableResult = await client.query(
        'select id, name from consumables where normalized_name = $1',
        [String(raw.normalizedName || '').trim()]
      );

      const consumable = consumableResult.rows[0];
      if (!consumable) continue;

      const quantityAvailable = parseNumeric(raw.quantityAvailable, 0);
      const locations =
        Array.isArray(raw.locations) && raw.locations.length ? raw.locations : ['Main Rack'];

      if (!(quantityAvailable > 0)) {
        continue;
      }

      const warehouseId = await resolveWarehouseId(client, locations.join(' '));
      if (!warehouseId) continue;

      for (const locationName of locations) {
        const location = await ensureLocation(client, warehouseId, locationName);
        if (!location) continue;

        const targetQty = quantityAvailable / locations.length;
        const currentQty = await getCurrentBalance(client, consumable.id, location.id);
        const delta = targetQty - currentQty;

        if (delta !== 0) {
          await createMovement(client, {
            movementType: 'import_seed',
            source: 'csv_import',
            notes: 'Reseeded from consumables import rows',
            lines: [
              {
                consumableId: consumable.id,
                locationId: location.id,
                qtyDelta: delta,
              },
            ],
          });
        }
      }
    }

    await recalculateReorderAlerts(client);
    await client.query('COMMIT');

    const summary = await pool.query(
      'select count(*)::int as balances, coalesce(sum(qty_on_hand), 0) as total_qty from stock_balances'
    );
    console.log(summary.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
