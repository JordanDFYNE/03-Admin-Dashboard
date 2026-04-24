export async function getDashboardOverview(client) {
  const [summaryResult, urgentActionsResult, locationSummaryResult, trendResult] =
    await Promise.all([
      client.query(`
      with stock as (
        select consumable_id, sum(qty_on_hand) as total_qty
        from stock_balances
        group by consumable_id
      )
      select
        count(*)::int as consumable_count,
        coalesce(sum(stock.total_qty), 0)::numeric(14,2) as total_units,
        count(*) filter (where c.ordered = true)::int as ordered_count,
        coalesce(sum(c.quantity_on_order), 0)::numeric(14,2) as quantity_on_order,
        count(*) filter (
          where coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)
        )::int as low_stock_count,
        count(distinct sb.location_id)::int as active_location_count
      from consumables c
      left join stock on stock.consumable_id = c.id
      left join stock_balances sb on sb.consumable_id = c.id
      left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
      where c.is_active = true
    `),
      client.query(`
      select *
      from (
        select
          c.id,
          c.name,
          'low_stock' as action_type,
          'critical' as severity,
          concat('Only ', coalesce(stock.total_qty, 0), ' left against threshold ', coalesce(rr.min_qty, c.default_reorder_point, 0)) as detail,
          '/products/' || c.id as href,
          1 as sort_order
        from consumables c
        left join (
          select consumable_id, sum(qty_on_hand) as total_qty
          from stock_balances
          group by consumable_id
        ) stock on stock.consumable_id = c.id
        left join reorder_rules rr on rr.consumable_id = c.id and rr.location_id is null and rr.is_active = true
        where c.is_active = true
          and coalesce(stock.total_qty, 0) <= coalesce(rr.min_qty, c.default_reorder_point, 0)

        union all

        select
          c.id,
          c.name,
          'overdue_order' as action_type,
          'warning' as severity,
          'Ordered item is past its estimated delivery date' as detail,
          '/orders' as href,
          2 as sort_order
        from consumables c
        where c.is_active = true
          and c.ordered = true
          and c.estimated_delivery_date is not null
          and c.estimated_delivery_date < current_date

        union all

        select
          c.id,
          c.name,
          'missing_location' as action_type,
          'info' as severity,
          'Consumable has no assigned location' as detail,
          '/products/' || c.id as href,
          3 as sort_order
        from consumables c
        where c.is_active = true
          and cardinality(c.source_locations) = 0

        union all

        select
          c.id,
          c.name,
          'missing_contact' as action_type,
          'info' as severity,
          'Consumable is missing a reorder contact' as detail,
          '/products/' || c.id as href,
          4 as sort_order
        from consumables c
        where c.is_active = true
          and (c.contact_for_reorder is null or trim(c.contact_for_reorder) = '')
      ) urgent
      order by sort_order asc, name asc
      limit 12
    `),
      client.query(`
      select
        split_part(location_name, ',', 1) as unit_name,
        round(sum(qty_on_hand)::numeric, 2) as total_qty,
        count(distinct consumable_id)::int as consumable_count
      from (
        select
          sb.consumable_id,
          sb.qty_on_hand,
          unnest(c.source_locations) as location_name
        from stock_balances sb
        join consumables c on c.id = sb.consumable_id
        where c.is_active = true
      ) expanded
      group by split_part(location_name, ',', 1)
      order by total_qty desc, unit_name asc
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
    ]);

  return {
    summary: summaryResult.rows[0],
    urgentActions: urgentActionsResult.rows,
    locationSummary: locationSummaryResult.rows,
    trend: trendResult.rows,
  };
}
