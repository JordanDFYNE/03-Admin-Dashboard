import { normalizeName } from '../utils/parsers.js';
import { buildConsumableBarcode } from './barcode-service.js';
import { ensureLocation } from './location-service.js';
import { createMovement } from './inventory-service.js';

async function ensureSupplier(client, supplierName) {
  const normalized = String(supplierName || '').trim();
  if (!normalized) return null;

  const result = await client.query(
    `
      insert into suppliers (name)
      values ($1)
      on conflict (name)
      do update set updated_at = now()
      returning id
    `,
    [normalized]
  );

  return result.rows[0].id;
}

export async function listConsumables(client, { search = '', lowStock = false } = {}) {
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.name ilike $${params.length} or c.sku ilike $${params.length})`);
  }

  if (lowStock) {
    conditions.push(
      `coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)`
    );
  }

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const result = await client.query(
    `
      with stock as (
        select consumable_id, sum(qty_on_hand) as total_qty
        from stock_balances
        group by consumable_id
      )
      select
        c.id,
        c.sku,
        c.name,
        c.unit_type,
        c.unit_price,
        c.stock_status,
        c.ordered,
        case
          when coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0) then 'Yes'
          else 'No'
        end as low_stock,
        c.quantity_on_order,
        c.default_reorder_point,
        c.default_reorder_qty,
        c.contact_for_reorder,
        c.source_locations,
        c.tags,
        s.name as supplier_name,
        b.barcode_value,
        coalesce(stock.total_qty, 0) as total_qty,
        case
          when cardinality(c.source_locations) > 0 then array_to_string(c.source_locations, ', ')
          else 'Unassigned'
        end as locations,
        coalesce(rr.min_qty, c.default_reorder_point, 0) as reorder_point,
        case
          when c.ordered = true or coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)
            then 'Yes'
          else 'No'
        end as reorder_list,
        coalesce(usage.last_7_day_usage, 0) as last_7_day_usage
      from consumables c
      left join suppliers s on s.id = c.supplier_id
      left join barcode_records b on b.entity_type = 'consumable' and b.entity_id = c.id and b.is_primary = true
      left join stock on stock.consumable_id = c.id
      left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
      left join (
        select sml.consumable_id, sum(abs(sml.qty_delta)) as last_7_day_usage
        from stock_movement_lines sml
        join stock_movements sm on sm.id = sml.movement_id
        where sm.movement_type = 'issue'
          and sm.occurred_at >= now() - interval '7 days'
        group by sml.consumable_id
      ) usage on usage.consumable_id = c.id
      where c.is_active = true
      ${whereClause ? `and ${whereClause.replace(/^where\s+/i, '')}` : ''}
      order by c.name asc
    `,
    params
  );

  return result.rows;
}

export async function updateConsumable(client, consumableId, payload) {
  const normalizedName = normalizeName(payload.name);
  const unitType = String(payload.unitType || '').trim() || 'Single';
  const locations = Array.isArray(payload.sourceLocations)
    ? payload.sourceLocations.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const supplierId = await ensureSupplier(client, payload.supplierName);
  const result = await client.query(
    `
      update consumables
      set sku = $2,
          name = $3,
          normalized_name = $4,
          unit_type = $5,
          source_locations = $6,
          supplier_id = $7,
          contact_for_reorder = $8,
          quantity_on_order = $9,
          estimated_delivery_date = $10,
          unit_quantity = $11,
          unit_price = $12,
          qty_per_pack = $13,
          production_time_days = $14,
          transit_time_text = $15,
          min_order_qty = $16,
          stock_status = $17,
          ordered = $18,
          ordered_at = case
            when $18 = true and ordered = false then now()
            when $18 = false then null
            else ordered_at
          end,
          default_reorder_point = $19,
          default_reorder_qty = $20,
          tags = $21,
          notes = $22,
          updated_at = now()
      where id = $1 and is_active = true
      returning id, sku, name, unit_type, default_reorder_point, default_reorder_qty
    `,
    [
      consumableId,
      payload.sku,
      payload.name,
      normalizedName,
      unitType,
      locations,
      supplierId,
      payload.contactForReorder || null,
      Number(payload.quantityOnOrder || 0),
      payload.estimatedDeliveryDate || null,
      Number(payload.unitQuantity || 0),
      Number(payload.unitPrice || 0),
      Number(payload.qtyPerPack || 0),
      payload.productionTimeDays === '' ? null : Number(payload.productionTimeDays || 0),
      payload.transitTimeText || null,
      Number(payload.minOrderQty || 0),
      payload.stockStatus || 'ok',
      Boolean(payload.ordered),
      Number(payload.reorderPoint || 0),
      Number(payload.reorderQuantity || 0),
      tags,
      payload.notes || null,
    ]
  );

  await client.query(
    `
      update reorder_rules
      set min_qty = $2,
          target_qty = $3,
          updated_at = now()
      where consumable_id = $1 and location_id is null
    `,
    [consumableId, Number(payload.reorderPoint || 0), Number(payload.reorderQuantity || 0)]
  );

  return result.rows[0] || null;
}

export async function createConsumable(client, payload) {
  const normalizedName = normalizeName(payload.name);
  const locations = payload.locations || [];
  const sku = String(payload.sku || '').trim() || `MANUAL-${Date.now()}`;
  const unitType = String(payload.unitType || '').trim() || 'Single';
  const reorderPoint = Number(payload.reorderPoint || 0);
  const reorderQuantity = Number(payload.reorderQuantity || reorderPoint || 0);

  const result = await client.query(
    `
      insert into consumables (
        sku,
        name,
        normalized_name,
        unit_type,
        contact_for_reorder,
        source_locations,
        default_reorder_point,
        default_reorder_qty,
        stock_status,
        ordered
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 'ok', false)
      returning id, sku, name, unit_type
    `,
    [
      sku,
      payload.name,
      normalizedName,
      unitType,
      payload.contactForReorder || null,
      locations,
      reorderPoint,
      reorderQuantity,
    ]
  );

  const item = result.rows[0];

  await client.query(
    `
      insert into barcode_records (barcode_value, barcode_format, entity_type, entity_id)
      values ($1, 'code128', 'consumable', $2)
      on conflict (barcode_value) do nothing
    `,
    [buildConsumableBarcode(item.id), item.id]
  );

  await client.query(
    `
      insert into reorder_rules (consumable_id, location_id, min_qty, target_qty)
      values ($1, null, $2, $3)
    `,
    [item.id, reorderPoint, reorderQuantity]
  );

  if (payload.quantityAvailable > 0 && locations.length) {
    for (const locationPayload of locations) {
      const location = await ensureLocation(
        client,
        locationPayload.warehouseId,
        locationPayload.name
      );
      if (!location) continue;

      const splitQty = payload.quantityAvailable / locations.length;
      await createMovement(client, {
        movementType: 'receipt',
        source: 'manual',
        notes: 'Initial stock from manual add',
        lines: [
          {
            consumableId: item.id,
            locationId: location.id,
            qtyDelta: splitQty,
          },
        ],
      });
    }
  }

  return item;
}

export async function archiveConsumable(client, consumableId) {
  const result = await client.query(
    `
      update consumables
      set is_active = false,
          updated_at = now()
      where id = $1 and is_active = true
      returning id, name
    `,
    [consumableId]
  );

  return result.rows[0] || null;
}

export async function getConsumableById(client, consumableId) {
  const detailResult = await client.query(
    `
      with stock as (
        select consumable_id, sum(qty_on_hand) as total_qty
        from stock_balances
        group by consumable_id
      )
      select
        c.id,
        c.sku,
        c.name,
        c.normalized_name,
        c.unit_type,
        c.unit_quantity,
        c.unit_price,
        c.qty_per_pack,
        c.production_time_days,
        c.transit_time_text,
        c.min_order_qty,
        c.quantity_on_order,
        c.estimated_delivery_date,
        c.contact_for_reorder,
        c.notes,
        c.tags,
        c.stock_status,
        c.ordered,
        c.default_reorder_point,
        c.default_reorder_qty,
        c.source_locations,
        c.created_at,
        c.updated_at,
        s.name as supplier_name,
        s.contact_name as supplier_contact_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        b.barcode_value,
        coalesce(stock.total_qty, 0) as total_qty,
        case
          when cardinality(c.source_locations) > 0 then array_to_string(c.source_locations, ', ')
          else 'Unassigned'
        end as locations,
        coalesce(rr.min_qty, c.default_reorder_point, 0) as reorder_point,
        coalesce(rr.target_qty, c.default_reorder_qty, 0) as reorder_target
      from consumables c
      left join suppliers s on s.id = c.supplier_id
      left join barcode_records b on b.entity_type = 'consumable' and b.entity_id = c.id and b.is_primary = true
      left join stock on stock.consumable_id = c.id
      left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
      where c.id = $1 and c.is_active = true
      limit 1
    `,
    [consumableId]
  );

  const item = detailResult.rows[0];
  if (!item) return null;

  const [locationStockResult, weeklyChecksResult, movementHistoryResult] = await Promise.all([
    client.query(
      `
        select
          l.id,
          l.code,
          l.name,
          sb.qty_on_hand,
          sb.updated_at
        from stock_balances sb
        join locations l on l.id = sb.location_id
        where sb.consumable_id = $1
        order by l.name asc nulls last, l.code asc
      `,
      [consumableId]
    ),
    client.query(
      `
        select
          wsc.check_date,
          wsc.counted_qty,
          l.name as location_name,
          l.code as location_code,
          wsc.notes
        from weekly_stock_checks wsc
        left join locations l on l.id = wsc.location_id
        where wsc.consumable_id = $1
        order by wsc.check_date desc
        limit 20
      `,
      [consumableId]
    ),
    client.query(
      `
        select
          sm.id,
          sm.movement_type,
          sm.source,
          sm.notes,
          sm.occurred_at,
          sml.qty_delta,
          sml.qty_before,
          sml.qty_after,
          l.name as location_name,
          l.code as location_code
        from stock_movement_lines sml
        join stock_movements sm on sm.id = sml.movement_id
        join locations l on l.id = sml.location_id
        where sml.consumable_id = $1
        order by sm.occurred_at desc
        limit 20
      `,
      [consumableId]
    ),
  ]);

  return {
    item,
    locationStock: locationStockResult.rows,
    weeklyChecks: weeklyChecksResult.rows,
    movementHistory: movementHistoryResult.rows,
  };
}

export async function getConsumableSummary(client) {
  const result = await client.query(`
    with stock as (
      select consumable_id, sum(qty_on_hand) as total_qty
      from stock_balances
      group by consumable_id
    )
    select
      count(*)::int as total_consumables,
      count(*) filter (
        where coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)
      )::int as low_stock_count,
      count(*) filter (where c.ordered = true)::int as on_order_count,
      coalesce(sum(c.unit_price * stock.total_qty), 0)::numeric(14,2) as stock_value
    from consumables c
    left join stock on stock.consumable_id = c.id
    left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
  `);

  return result.rows[0];
}

export async function getCategoryBreakdown(client) {
  const result = await client.query(`
    select unit_type as name, count(*)::int as value
    from consumables
    group by unit_type
    order by count(*) desc, unit_type asc
  `);

  return result.rows;
}

export async function getUsageTrend(client) {
  const result = await client.query(`
    select
      to_char(date_trunc('week', sm.occurred_at), 'Mon DD') as period,
      round(coalesce(sum(abs(sml.qty_delta)), 0)::numeric, 2) as usage
    from stock_movements sm
    join stock_movement_lines sml on sml.movement_id = sm.id
    where sm.movement_type = 'issue'
      and sm.occurred_at >= now() - interval '12 weeks'
    group by date_trunc('week', sm.occurred_at)
    order by date_trunc('week', sm.occurred_at) asc
  `);

  return result.rows;
}

export async function getLowStockAlerts(client) {
  const result = await client.query(`
    select
      ra.id,
      c.id as consumable_id,
      c.name,
      c.sku,
      ra.current_qty,
      ra.threshold_qty,
      ra.suggested_order_qty,
      ra.detected_at,
      ra.status
    from reorder_alerts ra
    join consumables c on c.id = ra.consumable_id
    where ra.status = 'open'
    order by ra.detected_at desc, c.name asc
  `);

  return result.rows;
}

export async function getOrderSummary(client) {
  const result = await client.query(`
    select
      count(*) filter (where c.ordered = true)::int as total_orders,
      count(*) filter (where c.ordered = true and c.ordered_at is not null)::int as active_orders,
      count(*) filter (
        where c.ordered = true
          and c.estimated_delivery_date is not null
          and c.estimated_delivery_date < current_date
      )::int as overdue_orders,
      coalesce(sum(c.quantity_on_order), 0)::numeric(14,3) as quantity_on_order
    from consumables c
    where c.is_active = true
  `);

  return result.rows[0];
}

export async function listOrders(client, { search = '' } = {}) {
  const params = [];
  const conditions = ['c.is_active = true', 'c.ordered = true'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.name ilike $${params.length} or c.sku ilike $${params.length})`);
  }

  const result = await client.query(
    `
      select
        c.id,
        c.sku,
        c.name,
        c.quantity_on_order,
        c.ordered_at,
        c.estimated_delivery_date,
        c.transit_time_text,
        c.contact_for_reorder,
        s.name as supplier_name,
        case
          when c.estimated_delivery_date is not null then greatest((c.estimated_delivery_date - current_date), 0)
          when c.ordered_at is not null and c.transit_time_text ~ '\\d+' then greatest(
            regexp_replace(c.transit_time_text, '^.*?(\\d+).*$','\\1')::int - (current_date - c.ordered_at::date),
            0
          )
          else null
        end as days_remaining,
        case
          when c.estimated_delivery_date is not null and c.estimated_delivery_date < current_date then 'Overdue'
          when c.estimated_delivery_date is not null and c.estimated_delivery_date = current_date then 'Due today'
          when c.ordered = true then 'Ordered'
          else 'Pending'
        end as order_status
      from consumables c
      left join suppliers s on s.id = c.supplier_id
      where ${conditions.join(' and ')}
      order by c.updated_at desc, c.name asc
    `,
    params
  );

  return result.rows;
}
