import { slotService } from '../services/parking/areaSlotService.js';
import { allocationService } from '../services/parking/workflowService.js';
import { entryExitService, gateService, overviewService } from '../services/parking/operationsService.js';

const crud = (service, extras = {}) => ({
  getAll: async (req, res, next) => {
    try {
      const result = await service.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  },
  getOne: async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.getById(req.params.id) });
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      res.status(201).json({ success: true, data: await service.create(req.body, req.user._id) });
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      res.json({ success: true, data: await service.update(req.params.id, req.body, req.user._id) });
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      await service.remove(req.params.id, req.user._id);
      res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
  },
  ...extras,
});

export const slots = {
  ...crud(slotService),
  getAvailable: async (req, res, next) => {
    try {
      res.json({ success: true, data: await slotService.getAvailable() });
    } catch (e) { next(e); }
  },
};

export const allocations = {
  ...crud(allocationService),
  createManual: async (req, res, next) => {
    try {
      res.status(201).json({ success: true, data: await allocationService.createManual(req.body, req.user._id) });
    } catch (e) { next(e); }
  },
  release: async (req, res, next) => {
    try {
      res.json({ success: true, data: await allocationService.release(req.params.id, req.user._id, req.body.reason) });
    } catch (e) { next(e); }
  },
};

export const entryExit = crud(entryExitService);

export const gate = {
  lookup: async (req, res, next) => {
    try {
      res.json({ success: true, data: await gateService.lookup(req.query.digits) });
    } catch (e) { next(e); }
  },
  log: async (req, res, next) => {
    try {
      res.json({ success: true, data: await gateService.log(req.body, req.user._id) });
    } catch (e) { next(e); }
  },
};

export const overview = {
  getDashboard: async (req, res, next) => {
    try {
      res.json({ success: true, data: await overviewService.getDashboard() });
    } catch (e) { next(e); }
  },
};
