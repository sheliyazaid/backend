import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/roles.js';
import { listWatchmen, createWatchman, deactivateWatchman } from '../controllers/userController.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/watchmen', listWatchmen);
router.post('/watchmen', createWatchman);
router.delete('/watchmen/:id', deactivateWatchman);

export default router;
