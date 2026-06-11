import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { parkingAdmin, parkingGate } from '../middleware/parkingAuth.js';
import { slots, allocations, entryExit, gate, overview } from '../controllers/parkingController.js';

const router = Router();
router.use(protect);

router.get('/overview', parkingAdmin, overview.getDashboard);

router.get('/slots/available', parkingAdmin, slots.getAvailable);
router.get('/slots', parkingAdmin, slots.getAll);
router.post('/slots', parkingAdmin, slots.create);
router.get('/slots/:id', parkingAdmin, slots.getOne);
router.put('/slots/:id', parkingAdmin, slots.update);
router.delete('/slots/:id', parkingAdmin, slots.remove);

router.get('/allocations', parkingAdmin, allocations.getAll);
router.post('/allocations', parkingAdmin, allocations.createManual);
router.get('/allocations/:id', parkingAdmin, allocations.getOne);
router.post('/allocations/:id/release', parkingAdmin, allocations.release);

router.get('/gate/lookup', parkingGate, gate.lookup);
router.post('/gate/log', parkingGate, gate.log);

router.get('/entry-exit', parkingAdmin, entryExit.getAll);

export default router;
