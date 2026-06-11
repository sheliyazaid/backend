import * as flatService from '../services/flatService.js';

const handle = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req, res);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getFlats = async (req, res, next) => {
  try {
    const result = await flatService.getFlats(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
export const getFlat = handle((req) => flatService.getFlatById(req.params.id));
export const createFlat = handle((req) => flatService.createFlat(req.body, req.user._id));
export const updateFlat = handle((req) => flatService.updateFlat(req.params.id, req.body, req.user._id));
export const deleteFlat = handle((req) => flatService.deleteFlat(req.params.id, req.user._id));
export const getFlat360 = handle((req) => flatService.getFlat360(req.params.id));
export const globalSearch = handle((req) => flatService.globalSearch(req.query.q));
