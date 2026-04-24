import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { pool } from '../db/pool.js';
import {
  archiveConsumable,
  createConsumable,
  getConsumableById,
  getCategoryBreakdown,
  getConsumableSummary,
  getOrderSummary,
  getLowStockAlerts,
  getUsageTrend,
  listOrders,
  listConsumables,
  updateConsumable,
} from '../services/consumables-service.js';
import { HttpError } from '../utils/http.js';
import { withTransaction } from '../db/query.js';

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

router.post(
  '/',
  asyncHandler(async (request, response) => {
    const {
      sku,
      name,
      unitType,
      locations = [],
      quantityAvailable = 0,
      contactForReorder = '',
      reorderPoint = 0,
      reorderQuantity = 0,
    } = request.body || {};

    if (!name) {
      throw new HttpError(400, 'name is required');
    }

    const item = await withTransaction(async (client) =>
      createConsumable(client, {
        sku,
        name,
        unitType,
        locations,
        quantityAvailable: Number(quantityAvailable || 0),
        contactForReorder,
        reorderPoint: Number(reorderPoint || 0),
        reorderQuantity: Number(reorderQuantity || 0),
      })
    );

    response.status(201).json({ item });
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

router.get(
  '/orders/summary',
  asyncHandler(async (request, response) => {
    const summary = await getOrderSummary(pool);
    response.json({ summary });
  })
);

router.get(
  '/orders',
  asyncHandler(async (request, response) => {
    const items = await listOrders(pool, {
      search: request.query.search || '',
    });

    response.json({ items });
  })
);

router.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const detail = await getConsumableById(pool, request.params.id);

    if (!detail) {
      throw new HttpError(404, 'Consumable not found');
    }

    response.json(detail);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const { name } = request.body || {};

    if (!name) {
      throw new HttpError(400, 'name is required');
    }

    const item = await updateConsumable(pool, request.params.id, {
      ...request.body,
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
