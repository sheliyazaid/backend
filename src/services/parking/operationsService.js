import ParkingEntryExit from '../../models/parking/ParkingEntryExit.js';
import ParkingAllocation from '../../models/parking/ParkingAllocation.js';
import ParkingSlot from '../../models/parking/ParkingSlot.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

const flatPop = { path: 'flatId', select: 'flatNumber wing' };

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
});

const entryPopulates = [
  { path: 'securityGuardId', select: 'name role' },
  flatPop,
  { path: 'allocationId', select: 'vehicleNumber holderName', populate: { path: 'slotId', select: 'slotNumber' } },
];

export const entryExitService = {
  ...listCrud(ParkingEntryExit, {
    searchFields: ['vehicleNumber', 'holderName', 'mobile', 'gate'],
    filterFields: ['recordType', 'entryType'],
    populates: entryPopulates,
    sort: { scannedAt: -1 },
  }),
};

const getVehicleStatus = async (vehicleNumber, allocationId) => {
  const filter = { status: 'active' };
  if (allocationId) {
    filter.$or = [{ allocationId }, { vehicleNumber }];
  } else {
    filter.vehicleNumber = vehicleNumber;
  }
  const lastLog = await ParkingEntryExit.findOne(filter).sort({ scannedAt: -1 });
  if (!lastLog) return { currentStatus: 'Outside', lastLog: null };
  return {
    currentStatus: lastLog.recordType === 'Entry' ? 'Inside' : 'Outside',
    lastLog,
  };
};

export const gateService = {
  lookup: async (digits) => {
    if (!/^\d{4}$/.test(digits)) {
      throw new ApiError(400, 'Enter exactly 4 digits of vehicle number');
    }

    const allocations = await ParkingAllocation.find({
      status: 'active',
      allocationStatus: 'Active',
    }).populate([flatPop, { path: 'slotId', select: 'slotNumber floor slotStatus' }]);

    const filtered = allocations.filter((alloc) =>
      (alloc.vehicleNumber || '').toUpperCase().endsWith(digits)
    );

    const matches = await Promise.all(
      filtered.map(async (alloc) => {
        const status = await getVehicleStatus(alloc.vehicleNumber, alloc._id);
        return {
          type: 'registered',
          allocationId: alloc._id,
          vehicleNumber: alloc.vehicleNumber,
          holderName: alloc.holderName,
          flatNumber: alloc.flatId?.flatNumber || '',
          wing: alloc.flatId?.wing || '',
          slotNumber: alloc.slotId?.slotNumber || '',
          currentStatus: status.currentStatus,
          lastLog: status.lastLog,
        };
      })
    );

    return { found: matches.length > 0, matches };
  },

  log: async (data, userId) => {
    const { recordType, gate = 'Main Gate' } = data;
    if (!['Entry', 'Exit'].includes(recordType)) {
      throw new ApiError(400, 'Record type must be Entry or Exit');
    }

    if (data.allocationId) {
      const alloc = await ParkingAllocation.findOne({
        _id: data.allocationId,
        allocationStatus: 'Active',
        status: 'active',
      }).populate([flatPop, { path: 'slotId', select: 'slotNumber' }]);
      if (!alloc) throw new ApiError(404, 'Registered vehicle not found');

      const record = await ParkingEntryExit.create({
        recordType,
        vehicleNumber: alloc.vehicleNumber,
        allocationId: alloc._id,
        flatId: alloc.flatId?._id || alloc.flatId,
        holderName: alloc.holderName,
        gate,
        securityGuardId: userId,
        validationResult: 'Valid',
        entryType: 'Registered',
        createdBy: userId,
      });

      const status = await getVehicleStatus(alloc.vehicleNumber, alloc._id);
      return {
        record: await ParkingEntryExit.findById(record._id).populate(entryPopulates),
        vehicle: {
          type: 'registered',
          vehicleNumber: alloc.vehicleNumber,
          holderName: alloc.holderName,
          flatNumber: alloc.flatId?.flatNumber,
          slotNumber: alloc.slotId?.slotNumber,
          currentStatus: status.currentStatus,
        },
      };
    }

    const { vehicleNumber, holderName, mobile } = data;
    if (!vehicleNumber?.trim() || !holderName?.trim()) {
      throw new ApiError(400, 'Vehicle number and name are required for unregistered vehicles');
    }

    const normalizedVehicle = vehicleNumber.trim().toUpperCase();
    const record = await ParkingEntryExit.create({
      recordType,
      vehicleNumber: normalizedVehicle,
      holderName: holderName.trim(),
      mobile: mobile?.trim() || '',
      gate,
      securityGuardId: userId,
      validationResult: 'No Allocation',
      entryType: 'Unregistered',
      createdBy: userId,
    });

    const status = await getVehicleStatus(normalizedVehicle);
    return {
      record: await ParkingEntryExit.findById(record._id).populate(entryPopulates),
      vehicle: {
        type: 'unregistered',
        vehicleNumber: normalizedVehicle,
        holderName: holderName.trim(),
        mobile: mobile?.trim() || '',
        currentStatus: status.currentStatus,
      },
    };
  },
};

export const overviewService = {
  getDashboard: async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalSlots, availableSlots, activeAllocations, todayLogs, recentLogs] = await Promise.all([
      ParkingSlot.countDocuments({ status: 'active' }),
      ParkingSlot.countDocuments({ status: 'active', slotStatus: 'Available' }),
      ParkingAllocation.countDocuments({ status: 'active', allocationStatus: 'Active' }),
      ParkingEntryExit.countDocuments({ status: 'active', scannedAt: { $gte: startOfToday } }),
      ParkingEntryExit.find({ status: 'active' })
        .sort({ scannedAt: -1 })
        .limit(15)
        .populate([{ path: 'securityGuardId', select: 'name' }, flatPop]),
    ]);

    return {
      totalSlots,
      availableSlots,
      occupiedSlots: totalSlots - availableSlots,
      activeAllocations,
      todayLogs,
      recentLogs,
    };
  },
};
