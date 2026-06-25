import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly, watchmanOrAdmin, residentOnly } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';
import { overview, dailyStaff, guests, delivery, scan, logs } from '../controllers/visitorController.js';

const router = Router();
router.use(protect);

router.get('/overview', adminOnly, overview.admin);
router.get('/watchman/overview', watchmanOrAdmin, overview.watchman);
router.get('/resident/overview', residentOnly, overview.resident);

router.post(
  '/daily-staff',
  watchmanOrAdmin,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'idProof', maxCount: 1 }]),
  dailyStaff.register
);
router.get('/daily-staff', adminOnly, dailyStaff.getAll);
router.get('/daily-staff/:id', adminOnly, dailyStaff.getOne);
router.post('/daily-staff/:id/approve', adminOnly, dailyStaff.approve);
router.post('/daily-staff/:id/reject', adminOnly, dailyStaff.reject);

router.post('/guests', residentOnly, guests.create);
router.get('/guests', guests.getAll);
router.get('/guests/:id', guests.getOne);
router.post('/guests/:id/approve', adminOnly, guests.approve);
router.post('/guests/:id/reject', adminOnly, guests.reject);

router.post('/delivery', watchmanOrAdmin, delivery.create);
router.post('/delivery/:id/exit', watchmanOrAdmin, delivery.exit);
router.get('/delivery', watchmanOrAdmin, delivery.getAll);

router.get('/scan/lookup', watchmanOrAdmin, scan.lookup);
router.post('/scan', watchmanOrAdmin, scan.process);

router.get('/logs', adminOnly, logs.getAll);
router.get('/logs/search', adminOnly, logs.search);
router.get('/live', adminOnly, logs.live);

export default router;
