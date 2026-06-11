import { Router } from 'express';
import {
  getFlats,
  getFlat,
  createFlat,
  updateFlat,
  deleteFlat,
  getFlat360,
  globalSearch,
} from '../controllers/flatController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/roles.js';

const router = Router();

router.use(protect, adminOnly);
router.get('/search', globalSearch);
router.get('/360/:id', getFlat360);
router.get('/', getFlats);
router.get('/:id', getFlat);
router.post('/', createFlat);
router.put('/:id', updateFlat);
router.delete('/:id', deleteFlat);

export default router;
