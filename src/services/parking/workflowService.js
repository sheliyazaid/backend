import ParkingAllocation from '../../models/parking/ParkingAllocation.js';
import ParkingSlot from '../../models/parking/ParkingSlot.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';
import { generateNumber } from '../../utils/parkingHelpers.js';

const flatPop = { path: 'flatId', select: 'flatNumber wing' };
const slotPop = { path: 'slotId', select: 'slotNumber floor slotStatus' };
const populates = [flatPop, slotPop];

const listCrud = (Model, opts) => ({
  getAll: async (query) => {
    const { page, limit, skip } = getPagination(query);
    const filter = { status: 'active' };
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = (opts.searchFields || []).map((f) => ({ [f]: regex }));
    }
    (opts.filterFields || []).forEach((f) => { if (query[f]) filter[f] = query[f]; });
    const [data, total] = await Promise.all([
      Model.find(filter).populate(opts.populates || []).sort(opts.sort || { createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(filter),
    ]);
    return paginatedResponse(data, total, page, limit);
  },
  getById: async (id) => {
    const doc = await Model.findOne({ _id: id, status: 'active' }).populate(opts.populates || []);
    if (!doc) throw new ApiError(404, 'Record not found');
    return doc;
  },
});

export const allocationService = {
  ...listCrud(ParkingAllocation, {
    searchFields: ['allocationNumber', 'vehicleNumber', 'holderName'],
    filterFields: ['allocationStatus', 'flatId'],
    populates,
  }),

  createManual: async (data, userId) => {
    const { slotId, flatId, vehicleNumber, holderName } = data;
    if (!slotId || !flatId || !vehicleNumber?.trim() || !holderName?.trim()) {
      throw new ApiError(400, 'Slot, flat, vehicle number and holder name are required');
    }

    const normalizedVehicle = vehicleNumber.trim().toUpperCase();
    const existing = await ParkingAllocation.findOne({
      status: 'active',
      allocationStatus: 'Active',
      vehicleNumber: normalizedVehicle,
    });
    if (existing) throw new ApiError(400, 'This vehicle already has active parking');

    const slot = await ParkingSlot.findOne({ _id: slotId, status: 'active', slotStatus: 'Available' });
    if (!slot) throw new ApiError(400, 'Slot not available');

    const allocationNumber = await generateNumber(ParkingAllocation, 'allocationNumber', 'PA');
    const doc = await ParkingAllocation.create({
      allocationNumber,
      slotId,
      flatId,
      vehicleNumber: normalizedVehicle,
      holderName: holderName.trim(),
      allocatedBy: userId,
      createdBy: userId,
    });

    await ParkingSlot.findByIdAndUpdate(slotId, { slotStatus: 'Occupied' });
    return ParkingAllocation.findById(doc._id).populate(populates);
  },

  release: async (id, userId, reason = '') => {
    const alloc = await ParkingAllocation.findOne({ _id: id, allocationStatus: 'Active', status: 'active' });
    if (!alloc) throw new ApiError(404, 'Active allocation not found');

    await ParkingAllocation.findByIdAndUpdate(id, {
      allocationStatus: 'Released',
      releasedAt: new Date(),
      releasedBy: userId,
      releaseReason: reason,
    });

    await ParkingSlot.findByIdAndUpdate(alloc.slotId, { slotStatus: 'Available' });
    return alloc;
  },
};
