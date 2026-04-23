import multer from 'multer';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { withTransaction } from '../db/query.js';
import { importConsumablesCsv, importWeeklyChecksCsv } from '../services/import-service.js';
import { recalculateReorderAlerts } from '../services/inventory-service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.post(
  '/consumables',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw new HttpError(400, 'CSV file is required');
    }

    const commit = request.body.commit === 'true';

    const result = await withTransaction(async (client) => {
      const importResult = await importConsumablesCsv(client, {
        filename: request.file.originalname,
        buffer: request.file.buffer,
        uploadedByUserId: request.user.id || null,
        commit,
      });

      if (commit) {
        await recalculateReorderAlerts(client);
      }

      return importResult;
    });

    response.status(commit ? 201 : 200).json(result);
  })
);

router.post(
  '/weekly-checks',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw new HttpError(400, 'CSV file is required');
    }

    const commit = request.body.commit === 'true';

    const result = await withTransaction(async (client) =>
      importWeeklyChecksCsv(client, {
        filename: request.file.originalname,
        buffer: request.file.buffer,
        uploadedByUserId: request.user.id || null,
        commit,
      })
    );

    response.status(commit ? 201 : 200).json(result);
  })
);

export default router;
