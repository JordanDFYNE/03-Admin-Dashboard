import { HttpError } from '../utils/http.js';

export async function getCurrentBalance(client, consumableId, locationId) {
  const balanceResult = await client.query(
    `
      select qty_on_hand
      from stock_balances
      where consumable_id = $1 and location_id = $2
    `,
    [consumableId, locationId]
  );

  return Number(balanceResult.rows[0]?.qty_on_hand || 0);
}

export async function createMovement(client, payload) {
  const {
    movementType,
    source = 'manual',
    notes = null,
    referenceNo = null,
    occurredAt = new Date().toISOString(),
    performedByUserId = null,
    lines,
  } = payload;

  const movementResult = await client.query(
    `
      insert into stock_movements (movement_type, source, notes, reference_no, occurred_at, performed_by_user_id)
      values ($1, $2, $3, $4, $5, $6)
      returning id, movement_type, occurred_at
    `,
    [movementType, source, notes, referenceNo, occurredAt, performedByUserId]
  );

  const movement = movementResult.rows[0];

  for (const line of lines) {
    const currentQty = await getCurrentBalance(client, line.consumableId, line.locationId);
    const nextQty = currentQty + Number(line.qtyDelta);

    if (nextQty < 0) {
      throw new HttpError(400, 'Movement would reduce stock below zero', {
        consumableId: line.consumableId,
        locationId: line.locationId,
      });
    }

    await client.query(
      `
        insert into stock_movement_lines (movement_id, consumable_id, location_id, qty_delta, qty_before, qty_after, counted_qty, unit_cost)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        movement.id,
        line.consumableId,
        line.locationId,
        line.qtyDelta,
        currentQty,
        nextQty,
        line.countedQty ?? null,
        line.unitCost ?? null,
      ]
    );

    await client.query(
      `
        insert into stock_balances (consumable_id, location_id, qty_on_hand, updated_at, last_movement_id)
        values ($1, $2, $3, now(), $4)
        on conflict (consumable_id, location_id)
        do update set qty_on_hand = excluded.qty_on_hand,
                      updated_at = now(),
                      last_movement_id = excluded.last_movement_id
      `,
      [line.consumableId, line.locationId, nextQty, movement.id]
    );
  }

  return movement;
}

export async function recalculateReorderAlerts(client) {
  await client.query(`delete from reorder_alerts where status = 'open'`);

  await client.query(`
    insert into reorder_alerts (consumable_id, location_id, current_qty, threshold_qty, suggested_order_qty, status)
    select
      c.id,
      rr.location_id,
      coalesce(sum(sb.qty_on_hand), 0) as current_qty,
      rr.min_qty,
      greatest(rr.target_qty - coalesce(sum(sb.qty_on_hand), 0), c.min_order_qty, 0),
      'open'
    from consumables c
    join reorder_rules rr on rr.consumable_id = c.id and rr.is_active = true
    left join stock_balances sb
      on sb.consumable_id = c.id
     and (rr.location_id is null or rr.location_id = sb.location_id)
    group by c.id, rr.location_id, rr.min_qty, rr.target_qty, c.min_order_qty
    having coalesce(sum(sb.qty_on_hand), 0) <= rr.min_qty
  `);
}
