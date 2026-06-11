import {
  ownerService,
  occupantService,
  familyMemberService,
  tenantService,
  vehicleService,
  documentService,
  noteService,
  tagService,
  reminderService,
} from '../services/memberService.js';
import path from 'path';

const crudHandlers = (service) => ({
  getAll: async (req, res, next) => {
    try {
      const result = await service.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
  getOne: async (req, res, next) => {
    try {
      const data = await service.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    try {
      const data = await service.create(req.body, req.user._id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  update: async (req, res, next) => {
    try {
      const data = await service.update(req.params.id, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  remove: async (req, res, next) => {
    try {
      await service.remove(req.params.id);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
});

export const owners = crudHandlers(ownerService);
export const occupants = crudHandlers(occupantService);
export const familyMembers = crudHandlers(familyMemberService);
export const tenants = {
  ...crudHandlers(tenantService),
  getHistory: async (req, res, next) => {
    try {
      const data = await tenantService.getHistory(req.params.flatId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  getExpiring: async (req, res, next) => {
    try {
      const data = await tenantService.getExpiring(req.query.days);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
export const vehicles = {
  ...crudHandlers(vehicleService),
  getHistory: async (req, res, next) => {
    try {
      const data = await vehicleService.getHistory(req.params.flatId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
export const notes = crudHandlers(noteService);
export const reminders = crudHandlers(reminderService);

export const documents = {
  getAll: async (req, res, next) => {
    try {
      const result = await documentService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
  getOne: async (req, res, next) => {
    try {
      const data = await documentService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  upload: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File is required' });
      }
      const data = await documentService.upload(req.body, req.file, req.user._id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  download: async (req, res, next) => {
    try {
      const doc = await documentService.getById(req.params.id);
      res.download(path.resolve(doc.filePath), doc.originalName);
    } catch (err) {
      next(err);
    }
  },
  preview: async (req, res, next) => {
    try {
      const doc = await documentService.getById(req.params.id);
      res.sendFile(path.resolve(doc.filePath));
    } catch (err) {
      next(err);
    }
  },
  remove: async (req, res, next) => {
    try {
      await documentService.remove(req.params.id);
      res.json({ success: true, message: 'Document deleted' });
    } catch (err) {
      next(err);
    }
  },
};

export const tags = {
  getAll: async (req, res, next) => {
    try {
      const data = await tagService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  create: async (req, res, next) => {
    try {
      const data = await tagService.create(req.body, req.user._id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  update: async (req, res, next) => {
    try {
      const data = await tagService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  remove: async (req, res, next) => {
    try {
      await tagService.remove(req.params.id);
      res.json({ success: true, message: 'Tag deleted' });
    } catch (err) {
      next(err);
    }
  },
  assignToFlat: async (req, res, next) => {
    try {
      const data = await tagService.assignToFlat(req.params.flatId, req.body.tagIds);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  removeFromFlat: async (req, res, next) => {
    try {
      const data = await tagService.removeFromFlat(req.params.flatId, req.params.tagId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
