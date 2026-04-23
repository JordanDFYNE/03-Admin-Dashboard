import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsvBuffer } from '../utils/csv.js';
import {
  normalizeName,
  parseBoolean,
  parseInteger,
  parseNumeric,
  splitLocations,
  splitTags,
  toIsoDate,
} from '../utils/parsers.js';
import { buildConsumableBarcode } from './barcode-service.js';
import { ensureLocation } from './location-service.js';
import { createMovement, getCurrentBalance } from './inventory-service.js';
import { recordAudit } from './audit-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const defaultWarehouseCode = 'UNIT1';

async function createImportBatch(client, importType, filename, uploadedByUserId = null) {
  const result = await client.query(
    `
      insert into import_batches (import_type, filename, uploaded_by_user_id)
      values ($1, $2, $3)
      returning *
    `,
    [importType, filename, uploadedByUserId]
  );

  return result.rows[0];
}

async function finalizeImportBatch(client, batchId, updates) {
  await client.query(
    `
      update import_batches
      set status = $2,
          row_count = $3,
          error_count = $4,
          metadata = $5,
          completed_at = now()
      where id = $1
    `,
    [
      batchId,
      updates.status,
      updates.rowCount,
      updates.errorCount,
      JSON.stringify(updates.metadata || {}),
    ]
  );
}

async function insertImportRow(
  client,
  {
    importBatchId,
    rowNumber,
    rawData,
    status,
    errorMessage = null,
    entityType = null,
    entityId = null,
  }
) {
  await client.query(
    `
      insert into import_rows (import_batch_id, row_number, raw_data, status, error_message, entity_type, entity_id)
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [importBatchId, rowNumber, rawData, status, errorMessage, entityType, entityId]
  );
}

async function getWarehouseMap(client) {
  const result = await client.query(`select id, code from warehouses`);
  return new Map(result.rows.map((row) => [row.code, row.id]));
}

async function resolveWarehouseId(client, locationText) {
  const warehouseMap = await getWarehouseMap(client);
  const normalized = String(locationText || '').toUpperCase();
  if (normalized.includes('UNIT 3') || normalized.includes('UNIT3'))
    return warehouseMap.get('UNIT3');
  if (normalized.includes('UNIT 4') || normalized.includes('UNIT4'))
    return warehouseMap.get('UNIT4');
  return warehouseMap.get(defaultWarehouseCode);
}

async function ensureSupplier(client, name, contactName) {
  const supplierName = String(name || '').trim();
  if (!supplierName) return null;

  const result = await client.query(
    `
      insert into suppliers (name, contact_name)
      values ($1, $2)
      on conflict (name)
      do update set contact_name = coalesce(excluded.contact_name, suppliers.contact_name),
                    updated_at = now()
      returning id
    `,
    [supplierName, String(contactName || '').trim() || null]
  );

  return result.rows[0].id;
}

export async function importConsumablesCsv(
  client,
  { filename, buffer, uploadedByUserId = null, commit = false }
) {
  const records = parseCsvBuffer(buffer);
  const batch = await createImportBatch(client, 'consumables_master', filename, uploadedByUserId);
  const previewRows = [];
  let errors = 0;

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2;
    const stockName = String(record['Stock name '] || record['Stock name'] || '').trim();
    if (!stockName) continue;

    const locations = splitLocations(record.Locations);
    const quantityAvailable = parseNumeric(record['Quantity Avaliable ']);
    const minOrderQty = parseNumeric(record['Min order']);
    const supplierId = await ensureSupplier(
      client,
      record.Supplier,
      record['Contact for re-order']
    );

    const payload = {
      sku: `CON-${String(rowNumber).padStart(4, '0')}`,
      name: stockName,
      normalizedName: normalizeName(stockName),
      unitType: String(record['Unit Type'] || 'single').trim() || 'single',
      unitQuantity: parseNumeric(record['Unit Quantity']),
      unitPrice: parseNumeric(record['Unit price ']),
      qtyPerPack: parseNumeric(record['Qty per box or pallet']),
      productionTimeDays: parseInteger(record['Production Time (Days)'], null),
      transitTimeText: String(record['Transit Time (Days)'] || '').trim() || null,
      minOrderQty,
      quantityOnOrder: parseNumeric(record['Quantity on order']),
      estimatedDeliveryDate: toIsoDate(record['Estimated delivery']),
      supplierId,
      contactForReorder: String(record['Contact for re-order'] || '').trim() || null,
      notes: String(record.Notes || '').trim() || null,
      tags: splitTags(record.Tags),
      stockStatus:
        String(record['Status of stock'] || 'ok')
          .trim()
          .toLowerCase() || 'ok',
      ordered: parseBoolean(record['Ordered?']),
      defaultReorderPoint: minOrderQty,
      defaultReorderQty: Math.max(minOrderQty, quantityAvailable),
      quantityAvailable,
      locations,
    };

    previewRows.push({ rowNumber, ...payload });
    await insertImportRow(client, {
      importBatchId: batch.id,
      rowNumber,
      rawData: payload,
      status: 'valid',
    });
  }

  if (commit) {
    for (const previewRow of previewRows) {
      const consumableResult = await client.query(
        `
          insert into consumables (
            sku, name, normalized_name, unit_type, unit_quantity, unit_price, qty_per_pack,
            production_time_days, transit_time_text, min_order_qty, quantity_on_order,
            estimated_delivery_date, supplier_id, contact_for_reorder, notes, tags,
            stock_status, ordered, default_reorder_point, default_reorder_qty
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          on conflict (normalized_name)
          do update set unit_type = excluded.unit_type,
                        unit_quantity = excluded.unit_quantity,
                        unit_price = excluded.unit_price,
                        qty_per_pack = excluded.qty_per_pack,
                        production_time_days = excluded.production_time_days,
                        transit_time_text = excluded.transit_time_text,
                        min_order_qty = excluded.min_order_qty,
                        quantity_on_order = excluded.quantity_on_order,
                        estimated_delivery_date = excluded.estimated_delivery_date,
                        supplier_id = excluded.supplier_id,
                        contact_for_reorder = excluded.contact_for_reorder,
                        notes = excluded.notes,
                        tags = excluded.tags,
                        stock_status = excluded.stock_status,
                        ordered = excluded.ordered,
                        default_reorder_point = excluded.default_reorder_point,
                        default_reorder_qty = excluded.default_reorder_qty,
                        updated_at = now()
          returning id, name
        `,
        [
          previewRow.sku,
          previewRow.name,
          previewRow.normalizedName,
          previewRow.unitType,
          previewRow.unitQuantity,
          previewRow.unitPrice,
          previewRow.qtyPerPack,
          previewRow.productionTimeDays,
          previewRow.transitTimeText,
          previewRow.minOrderQty,
          previewRow.quantityOnOrder,
          previewRow.estimatedDeliveryDate,
          previewRow.supplierId,
          previewRow.contactForReorder,
          previewRow.notes,
          previewRow.tags,
          previewRow.stockStatus,
          previewRow.ordered,
          previewRow.defaultReorderPoint,
          previewRow.defaultReorderQty,
        ]
      );

      const consumable = consumableResult.rows[0];

      await client.query(
        `
          insert into barcode_records (barcode_value, barcode_format, entity_type, entity_id)
          values ($1, 'code128', 'consumable', $2)
          on conflict (barcode_value) do nothing
        `,
        [buildConsumableBarcode(consumable.id), consumable.id]
      );

      await client.query(
        `delete from reorder_rules where consumable_id = $1 and location_id is null`,
        [consumable.id]
      );

      await client.query(
        `
          insert into reorder_rules (consumable_id, location_id, min_qty, target_qty)
          values ($1, null, $2, $3)
        `,
        [consumable.id, previewRow.defaultReorderPoint, previewRow.defaultReorderQty]
      );

      const warehouseId = await resolveWarehouseId(client, previewRow.locations.join(' '));

      if (previewRow.quantityAvailable > 0 && warehouseId) {
        const locationNames = previewRow.locations.length ? previewRow.locations : ['Main Rack'];

        for (const locationName of locationNames) {
          const location = await ensureLocation(client, warehouseId, locationName);
          if (!location) continue;

          const targetQty = previewRow.quantityAvailable / locationNames.length;
          const currentQty = await getCurrentBalance(client, consumable.id, location.id);
          const delta = targetQty - currentQty;

          if (delta !== 0) {
            await createMovement(client, {
              movementType: 'import_seed',
              source: 'csv_import',
              notes: 'Seeded from consumables inventory CSV',
              performedByUserId: uploadedByUserId,
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

      await recordAudit(client, {
        entityType: 'consumable',
        entityId: consumable.id,
        action: 'import',
        changedByUserId: uploadedByUserId,
        afterData: previewRow,
      });
    }
  }

  await finalizeImportBatch(client, batch.id, {
    status: commit ? 'committed' : 'validated',
    rowCount: previewRows.length,
    errorCount: errors,
    metadata: { commit },
  });

  return {
    batchId: batch.id,
    rowCount: previewRows.length,
    errorCount: errors,
    rows: previewRows,
  };
}

export async function importWeeklyChecksCsv(
  client,
  { filename, buffer, uploadedByUserId = null, commit = false }
) {
  const records = parseCsvBuffer(buffer);
  const batch = await createImportBatch(client, 'weekly_checks', filename, uploadedByUserId);
  const previewRows = [];

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2;
    const itemName = String(record.Item || '').trim();
    if (!itemName || itemName.toLowerCase() === 'checked by (name)') continue;

    const consumableResult = await client.query(
      `select id, name from consumables where normalized_name = $1`,
      [normalizeName(itemName)]
    );

    const dateColumns = Object.keys(record).filter((key) =>
      /^\d{2}[.\-/]\d{2}[.\-/]\d{2,4}$/.test(key.trim())
    );

    for (const dateColumn of dateColumns) {
      const countedQty = parseNumeric(record[dateColumn], NaN);
      if (!Number.isFinite(countedQty)) continue;

      const payload = {
        rowNumber,
        itemName,
        consumableId: consumableResult.rows[0]?.id || null,
        locationLabel: String(record.Location || '').trim() || null,
        checkDate: toIsoDate(dateColumn),
        countedQty,
      };

      previewRows.push(payload);
      await insertImportRow(client, {
        importBatchId: batch.id,
        rowNumber,
        rawData: payload,
        status: payload.consumableId ? 'valid' : 'error',
        errorMessage: payload.consumableId ? null : 'Consumable not found for weekly check row',
      });

      if (commit && payload.consumableId && payload.checkDate) {
        const warehouseId = await resolveWarehouseId(client, payload.locationLabel);
        const location = await ensureLocation(
          client,
          warehouseId,
          payload.locationLabel || 'Weekly Check'
        );

        await client.query(
          `
            insert into weekly_stock_checks (consumable_id, location_id, check_date, counted_qty, entered_by_user_id, import_batch_id, notes)
            values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (consumable_id, location_id, check_date)
            do update set counted_qty = excluded.counted_qty,
                          entered_by_user_id = excluded.entered_by_user_id,
                          import_batch_id = excluded.import_batch_id,
                          notes = excluded.notes
          `,
          [
            payload.consumableId,
            location?.id || null,
            payload.checkDate,
            payload.countedQty,
            uploadedByUserId,
            batch.id,
            'Imported from weekly checks CSV',
          ]
        );
      }
    }
  }

  const errorCount = previewRows.filter((row) => !row.consumableId).length;

  await finalizeImportBatch(client, batch.id, {
    status: commit ? 'committed' : 'validated',
    rowCount: previewRows.length,
    errorCount,
    metadata: { commit },
  });

  return {
    batchId: batch.id,
    rowCount: previewRows.length,
    errorCount,
    rows: previewRows,
  };
}

export async function importDefaultCsvs(client, uploadedByUserId = null) {
  const consumablesPath = path.join(repoRoot, 'Consumables Inventory - Comsumables Inventory.csv');
  const weeklyChecksPath = path.join(repoRoot, 'Consumables Inventory - Weekly Checks.csv');

  const [consumablesBuffer, weeklyChecksBuffer] = await Promise.all([
    fs.readFile(consumablesPath),
    fs.readFile(weeklyChecksPath),
  ]);

  const consumables = await importConsumablesCsv(client, {
    filename: path.basename(consumablesPath),
    buffer: consumablesBuffer,
    uploadedByUserId,
    commit: true,
  });

  const weeklyChecks = await importWeeklyChecksCsv(client, {
    filename: path.basename(weeklyChecksPath),
    buffer: weeklyChecksBuffer,
    uploadedByUserId,
    commit: true,
  });

  return { consumables, weeklyChecks };
}
