export async function getDashboardOverview(client) {
  const [summaryResult, trendResult, lowStockResult] = await Promise.all([
    client.query(`
      with stock as (
        select consumable_id, sum(qty_on_hand) as total_qty
        from stock_balances
        group by consumable_id
      )
      select
        count(*)::int as consumable_count,
        coalesce(sum(stock.total_qty), 0)::numeric(14,2) as total_units,
        count(*) filter (
          where coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)
        )::int as low_stock_count,
        count(distinct sb.location_id)::int as active_location_count
      from consumables c
      left join stock on stock.consumable_id = c.id
      left join stock_balances sb on sb.consumable_id = c.id
      left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
    `),
    client.query(`
      select
        to_char(date_trunc('week', sm.occurred_at), 'Mon DD') as week_label,
        round(sum(case when sm.movement_type = 'issue' then abs(sml.qty_delta) else 0 end)::numeric, 2) as usage,
        round(sum(case when sm.movement_type in ('receipt', 'import_seed') then sml.qty_delta else 0 end)::numeric, 2) as replenishment
      from stock_movements sm
      join stock_movement_lines sml on sml.movement_id = sm.id
      where sm.occurred_at >= now() - interval '8 weeks'
      group by date_trunc('week', sm.occurred_at)
      order by date_trunc('week', sm.occurred_at) asc
    `),
    client.query(`
      select c.name, ra.current_qty, ra.threshold_qty
      from reorder_alerts ra
      join consumables c on c.id = ra.consumable_id
      where ra.status = 'open'
      order by ra.current_qty asc, c.name asc
      limit 5
    `),
  ]);

  return {
    summary: summaryResult.rows[0],
    trend: trendResult.rows,
    lowStock: lowStockResult.rows,
  };
}
