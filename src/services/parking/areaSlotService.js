import ParkingSlot from '../../models/parking/ParkingSlot.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

const crud = (Model, config) => {
  const { entityType, nameField, searchFields = [], sort = { createdAt: -1 } } = config;

  const buildFilter = (query) => {
    const filter = { status: 'active' };
    if (query.search && searchFields.length) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = searchFields.map((f) => ({ [f]: regex }));
    }
    if (query.slotStatus) filter.slotStatus = query.slotStatus;
    return filter;
  };

  return {
    getAll: async (query) => {
      const { page, limit, skip } = getPagination(query);
      const filter = buildFilter(query);
      const [data, total] = await Promise.all([
        Model.find(filter).sort(sort).skip(skip).limit(limit),
        Model.countDocuments(filter),
      ]);
      return paginatedResponse(data, total, page, limit);
    },
    getById: async (id) => {
      const doc = await Model.findOne({ _id: id, status: 'active' });
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      return doc;
    },
    create: async (data, userId) => {
      if (config.beforeCreate) config.beforeCreate(data);
      const doc = await Model.create({ ...data, createdBy: userId });
      return Model.findById(doc._id);
    },
    update: async (id, data) => {
      const doc = await Model.findOneAndUpdate(
        { _id: id, status: 'active' },
        data,
        { new: true, runValidators: true }
      );
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      return doc;
    },
    remove: async (id) => {
      const doc = await Model.findOneAndUpdate(
        { _id: id, status: 'active' },
        { status: 'inactive' },
        { new: true }
      );
      if (!doc) throw new ApiError(404, `${entityType} not found`);
      return doc;
    },
  };
};

export const slotService = {
  ...crud(ParkingSlot, {
    entityType: 'ParkingSlot',
    nameField: 'slotNumber',
    searchFields: ['slotNumber', 'notes', 'floor'],
    sort: { slotNumber: 1 },
    beforeCreate: (data) => {
      data.slotNumber = data.slotNumber?.toUpperCase();
    },
  }),

  getAvailable: async () =>
    ParkingSlot.find({ status: 'active', slotStatus: 'Available' }).sort({ slotNumber: 1 }),
};
