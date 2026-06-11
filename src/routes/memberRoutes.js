import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';
import {
  owners,
  occupants,
  familyMembers,
  tenants,
  vehicles,
  documents,
  notes,
  tags,
  reminders,
} from '../controllers/memberController.js';

const memoryUpload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(protect, adminOnly);

router.get('/owners', owners.getAll);
router.get('/owners/:id', owners.getOne);
router.post('/owners', owners.create);
router.put('/owners/:id', owners.update);
router.delete('/owners/:id', owners.remove);

router.get('/occupants', occupants.getAll);
router.get('/occupants/:id', occupants.getOne);
router.post('/occupants', occupants.create);
router.put('/occupants/:id', occupants.update);
router.delete('/occupants/:id', occupants.remove);

router.get('/family-members', familyMembers.getAll);
router.get('/family-members/:id', familyMembers.getOne);
router.post('/family-members', familyMembers.create);
router.put('/family-members/:id', familyMembers.update);
router.delete('/family-members/:id', familyMembers.remove);

router.get('/tenants/expiring', tenants.getExpiring);
router.get('/tenants/history/:flatId', tenants.getHistory);
router.get('/tenants', tenants.getAll);
router.get('/tenants/:id', tenants.getOne);
router.post('/tenants', tenants.create);
router.put('/tenants/:id', tenants.update);
router.delete('/tenants/:id', tenants.remove);

router.get('/vehicles/history/:flatId', vehicles.getHistory);
router.get('/vehicles', vehicles.getAll);
router.get('/vehicles/:id', vehicles.getOne);
router.post('/vehicles', vehicles.create);
router.put('/vehicles/:id', vehicles.update);
router.delete('/vehicles/:id', vehicles.remove);

router.get('/documents', documents.getAll);
router.get('/documents/:id', documents.getOne);
router.get('/documents/:id/download', documents.download);
router.get('/documents/:id/preview', documents.preview);
router.post('/documents', upload.single('file'), documents.upload);
router.delete('/documents/:id', documents.remove);

router.get('/notes', notes.getAll);
router.get('/notes/:id', notes.getOne);
router.post('/notes', notes.create);
router.put('/notes/:id', notes.update);
router.delete('/notes/:id', notes.remove);

router.get('/tags', tags.getAll);
router.post('/tags', tags.create);
router.put('/tags/:id', tags.update);
router.delete('/tags/:id', tags.remove);
router.put('/tags/assign/:flatId', tags.assignToFlat);
router.delete('/tags/assign/:flatId/:tagId', tags.removeFromFlat);

router.get('/reminders', reminders.getAll);
router.get('/reminders/:id', reminders.getOne);
router.post('/reminders', reminders.create);
router.put('/reminders/:id', reminders.update);
router.delete('/reminders/:id', reminders.remove);

export { memoryUpload };
export default router;
