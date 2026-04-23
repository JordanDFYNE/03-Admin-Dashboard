import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { pool } from '../db/pool.js';
import { query } from '../db/query.js';
import { getDashboardOverview } from '../services/reporting-service.js';
import { getLowStockAlerts, getUsageTrend } from '../services/consumables-service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/overview',
  asyncHandler(async (request, response) => {
    const data = await getDashboardOverview(pool);
    response.json(data);
  })
);

router.get(
  '/weekly-usage',
  asyncHandler(async (request, response) => {
    const items = await getUsageTrend(pool);
    response.json({ items });
  })
);

router.get(
  '/reorder-alerts',
  asyncHandler(async (request, response) => {
    const items = await getLowStockAlerts(pool);
    response.json({ items });
  })
);

router.get(
  '/peak-usage',
  asyncHandler(async (request, response) => {
    const result = await query(`
      select
        extract(dow from sm.occurred_at)::int as day_of_week,
        round(sum(abs(sml.qty_delta))::numeric, 2) as usage
      from stock_movements sm
      join stock_movement_lines sml on sml.movement_id = sm.id
      where sm.movement_type = 'issue'
      group by extract(dow from sm.occurred_at)
      order by usage desc
    `);

    response.json({ items: result.rows });
  })
);

export default router;
