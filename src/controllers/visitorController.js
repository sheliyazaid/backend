import {
  overviewService,
  dailyStaffService,
  guestService,
  deliveryService,
  scanService,
  logService,
  visitorSearchService,
} from '../services/visitorService.js';
import { parseQRData } from '../utils/qrHelper.js';

export const overview = {
  admin: async (req, res, next) => {
    try {
      res.json({ success: true, data: await overviewService.getAdminDashboard() });
    } catch (e) { next(e); }
  },
  watchman: async (req, res, next) => {
    try {
      res.json({ success: true, data: await overviewService.getWatchmanDashboard() });
    } catch (e) { next(e); }
  },
  resident: async (req, res, next) => {
    try {
      res.json({ success: true, data: await overviewService.getResidentDashboard(req.user._id) });
    } catch (e) { next(e); }
  },
};

export const dailyStaff = {
  register: async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await dailyStaffService.register(req.body, req.files, req.user._id),
      });
    } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      res.json({ success: true, ...(await dailyStaffService.getAll(req.query)) });
    } catch (e) { next(e); }
  },
  getOne: async (req, res, next) => {
    try {
      res.json({ success: true, data: await dailyStaffService.getById(req.params.id) });
    } catch (e) { next(e); }
  },
  approve: async (req, res, next) => {
    try {
      res.json({ success: true, data: await dailyStaffService.approve(req.params.id, req.user._id) });
    } catch (e) { next(e); }
  },
  reject: async (req, res, next) => {
    try {
      res.json({ success: true, data: await dailyStaffService.reject(req.params.id, req.user._id, req.body.reason) });
    } catch (e) { next(e); }
  },
};

export const guests = {
  create: async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await guestService.create(req.body, req.user._id, req.user.flatId),
      });
    } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      res.json({ success: true, ...(await guestService.getAll(req.query, req.user)) });
    } catch (e) { next(e); }
  },
  getOne: async (req, res, next) => {
    try {
      res.json({ success: true, data: await guestService.getById(req.params.id, req.user) });
    } catch (e) { next(e); }
  },
  approve: async (req, res, next) => {
    try {
      res.json({ success: true, data: await guestService.approve(req.params.id, req.user._id) });
    } catch (e) { next(e); }
  },
  reject: async (req, res, next) => {
    try {
      res.json({ success: true, data: await guestService.reject(req.params.id, req.user._id, req.body.reason) });
    } catch (e) { next(e); }
  },
};

export const delivery = {
  create: async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: await deliveryService.createEntry(req.body, req.user._id),
      });
    } catch (e) { next(e); }
  },
  exit: async (req, res, next) => {
    try {
      res.json({ success: true, data: await deliveryService.recordExit(req.params.id, req.user._id) });
    } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      res.json({ success: true, ...(await deliveryService.getAll(req.query)) });
    } catch (e) { next(e); }
  },
};

export const scan = {
  lookup: async (req, res, next) => {
    try {
      const token = parseQRData(req.query.token || req.query.qr);
      res.json({ success: true, data: await scanService.lookup(token) });
    } catch (e) { next(e); }
  },
  process: async (req, res, next) => {
    try {
      const token = parseQRData(req.body.token || req.body.qr);
      res.json({ success: true, data: await scanService.scan(token, req.user._id) });
    } catch (e) { next(e); }
  },
};

export const logs = {
  getAll: async (req, res, next) => {
    try {
      res.json({ success: true, ...(await logService.getAll(req.query)) });
    } catch (e) { next(e); }
  },
  live: async (req, res, next) => {
    try {
      res.json({ success: true, data: await logService.getLiveVisitors() });
    } catch (e) { next(e); }
  },
  search: async (req, res, next) => {
    try {
      res.json({ success: true, ...(await visitorSearchService.search(req.query)) });
    } catch (e) { next(e); }
  },
};
