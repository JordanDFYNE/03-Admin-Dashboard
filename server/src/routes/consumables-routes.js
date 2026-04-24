import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { pool } from '../db/pool.js';
import {
  archiveConsumable,
  getCategoryBreakdown,
  getConsumableSummary,
  getLowStockAlerts,
  getUsageTrend,
  listConsumables,
  updateConsumable,
} from '../services/consumables-service.js';
import { HttpError } from '../utils/http.js';

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

router.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const { name, unitType, reorderPoint, reorderQuantity } = request.body || {};

    if (!name || !unitType) {
      throw new HttpError(400, 'name and unitType are required');
    }

    const item = await updateConsumable(pool, request.params.id, {
      name,
      unitType,
      reorderPoint: Number(reorderPoint || 0),
      reorderQuantity: Number(reorderQuantity || 0),
    });

    if (!item) {
      throw new HttpError(404, 'Consumable not found');
    }

    response.json({ item });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const item = await archiveConsumable(pool, request.params.id);

    if (!item) {
      throw new HttpError(404, 'Consumable not found');
    }

    response.json({ item, archived: true });
  })
);

export default router;
