import { Router } from 'express';
import healthRoutes from './health-routes.js';
import authRoutes from './auth-routes.js';
import consumablesRoutes from './consumables-routes.js';
import inventoryRoutes from './inventory-routes.js';
import importRoutes from './import-routes.js';
import reportRoutes from './report-routes.js';
import barcodeRoutes from './barcode-routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/consumables', consumablesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/imports', importRoutes);
router.use('/reports', reportRoutes);
router.use('/barcodes', barcodeRoutes);

export default router;
