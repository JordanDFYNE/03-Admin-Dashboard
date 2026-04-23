import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { withTransaction, query } from '../db/query.js';
import { createMovement, recalculateReorderAlerts } from '../services/inventory-service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/balances',
  asyncHandler(async (request, response) => {
    const result = await query(
      `
        select
          c.id as consumable_id,
          c.name as consumable_name,
          l.id as location_id,
          l.name as location_name,
          l.code as location_code,
          sb.qty_on_hand,
          sb.updated_at
        from stock_balances sb
        join consumables c on c.id = sb.consumable_id
        join locations l on l.id = sb.location_id
        order by c.name asc, l.code asc
      `
    );

    response.json({ items: result.rows });
  })
);

router.post(
  '/movements',
  asyncHandler(async (request, response) => {
    const { movementType, lines, notes, referenceNo, occurredAt } = request.body || {};

    if (!movementType || !Array.isArray(lines) || !lines.length) {
      throw new HttpError(400, 'movementType and at least one line are required');
    }

    const movement = await withTransaction(async (client) => {
      const createdMovement = await createMovement(client, {
        movementType,
        notes,
        referenceNo,
        occurredAt,
        performedByUserId: request.user.id || null,
        lines,
      });

      await recalculateReorderAlerts(client);
      return createdMovement;
    });

    response.status(201).json({ movement });
  })
);

router.get(
  '/movements',
  asyncHandler(async (request, response) => {
    const result = await query(
      `
        select
          sm.id,
          sm.movement_type,
          sm.reference_no,
          sm.source,
          sm.notes,
          sm.occurred_at,
          c.name as consumable_name,
          l.code as location_code,
          sml.qty_delta,
          sml.qty_before,
          sml.qty_after
        from stock_movements sm
        join stock_movement_lines sml on sml.movement_id = sm.id
        join consumables c on c.id = sml.consumable_id
        join locations l on l.id = sml.location_id
        order by sm.occurred_at desc, sm.id desc
        limit 100
      `
    );

    response.json({ items: result.rows });
  })
);

export default router;
