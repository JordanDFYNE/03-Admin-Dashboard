import { normalizeName } from '../utils/parsers.js';

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
        c.quantity_on_order,
        c.default_reorder_point,
        c.default_reorder_qty,
        c.tags,
        s.name as supplier_name,
        b.barcode_value,
        coalesce(stock.total_qty, 0) as total_qty,
        coalesce(rr.min_qty, c.default_reorder_point, 0) as reorder_point,
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
  const result = await client.query(
    `
      update consumables
      set name = $2,
          normalized_name = $3,
          unit_type = $4,
          default_reorder_point = $5,
          default_reorder_qty = $6,
          updated_at = now()
      where id = $1 and is_active = true
      returning id, sku, name, unit_type, default_reorder_point, default_reorder_qty
    `,
    [
      consumableId,
      payload.name,
      normalizedName,
      payload.unitType,
      payload.reorderPoint,
      payload.reorderQuantity,
    ]
  );

  return result.rows[0] || null;
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
