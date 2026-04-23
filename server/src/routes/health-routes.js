import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { query } from '../db/query.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (request, response) => {
    const dbResult = await query('select now() as now');

    response.json({
      service: 'warehouse-backend',
      status: 'running',
      database: 'connected',
      now: dbResult.rows[0].now,
    });
  })
);

export default router;
