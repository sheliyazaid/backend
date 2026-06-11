import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/roles.js';
import { memoryUpload } from './memberRoutes.js';
import {
  downloadTemplate,
  previewImport,
  importData,
  exportData,
} from '../controllers/importExportController.js';

const router = Router();

router.use(protect, adminOnly);
router.get('/template/:type', downloadTemplate);
router.post('/preview', memoryUpload.single('file'), previewImport);
router.post('/import', memoryUpload.single('file'), importData);
router.get('/export', exportData);

export default router;
