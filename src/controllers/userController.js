import * as userService from '../services/userService.js';

export const listWatchmen = async (req, res, next) => {
  try {
    const result = await userService.listWatchmen(req.query);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const createWatchman = async (req, res, next) => {
  try {
    const data = await userService.createWatchman(req.body, req.user._id);
    res.status(201).json({ success: true, data, message: 'Watchman account created' });
  } catch (e) { next(e); }
};

export const deactivateWatchman = async (req, res, next) => {
  try {
    const data = await userService.deactivateWatchman(req.params.id);
    res.json({ success: true, data, message: 'Watchman deactivated' });
  } catch (e) { next(e); }
};
