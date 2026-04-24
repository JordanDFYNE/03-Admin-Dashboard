import { slugify } from '../utils/parsers.js';

export function buildLocationCode(rawLocation) {
  const normalized = String(rawLocation || '').trim();
  if (!normalized) return null;
  return slugify(normalized).toUpperCase();
}

export async function ensureLocation(client, warehouseId, locationName) {
  const code = buildLocationCode(locationName);
  if (!code) return null;
  const barcodeValue = `LOC:W${warehouseId}:${code}`;

  const existing = await client.query(
    `select id, warehouse_id, code, name, barcode_value from locations where warehouse_id = $1 and code = $2`,
    [warehouseId, code]
  );

  if (existing.rows[0]) {
    await client.query(
      `
        insert into barcode_records (barcode_value, barcode_format, entity_type, entity_id)
        values ($1, 'code128', 'location', $2)
        on conflict (barcode_value) do nothing
      `,
      [barcodeValue, existing.rows[0].id]
    );

    return existing.rows[0];
  }

  const inserted = await client.query(
    `
      insert into locations (warehouse_id, location_type, code, name, barcode_value)
      values ($1, 'rack', $2, $3, $4)
      returning id, warehouse_id, code, name, barcode_value
    `,
    [warehouseId, code, locationName, barcodeValue]
  );

  await client.query(
    `
      insert into barcode_records (barcode_value, barcode_format, entity_type, entity_id)
      values ($1, 'code128', 'location', $2)
      on conflict (barcode_value) do nothing
    `,
    [barcodeValue, inserted.rows[0].id]
  );

  return inserted.rows[0];
}
