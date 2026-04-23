import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { pool } from '../db/pool.js';
import {
  getCategoryBreakdown,
  getConsumableSummary,
  getLowStockAlerts,
  getUsageTrend,
  listConsumables,
} from '../services/consumables-service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (request, response) => {
    const items = await listConsumables(pool, {
      search: request.query.search || '',
      lowStock: request.query.lowStock === 'true',
    });

    response.json({ items });
  })
);

router.get(
  '/summary',
  asyncHandler(async (request, response) => {
    const [summary, categories, usageTrend, lowStockAlerts] = await Promise.all([
      getConsumableSummary(pool),
      getCategoryBreakdown(pool),
      getUsageTrend(pool),
      getLowStockAlerts(pool),
    ]);

    response.json({
      summary,
      categories,
      usageTrend,
      lowStockAlerts,
    });
  })
);

export default router;
