import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { query } from '../db/query.js';
import { renderBarcodePng } from '../services/barcode-service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/lookup/:barcodeValue',
  asyncHandler(async (request, response) => {
    const { barcodeValue } = request.params;
    const barcodeResult = await query(
      `
        select *
        from barcode_records
        where barcode_value = $1
      `,
      [barcodeValue]
    );

    const barcode = barcodeResult.rows[0];
    if (!barcode) {
      throw new HttpError(404, 'Barcode not found');
    }

    response.json({ barcode });
  })
);

router.get(
  '/image/:barcodeValue',
  asyncHandler(async (request, response) => {
    const pngBuffer = await renderBarcodePng(request.params.barcodeValue);
    response.setHeader('Content-Type', 'image/png');
    response.send(pngBuffer);
  })
);

export default router;
