import DailyStaff from '../models/visitor/DailyStaff.js';
import GuestRequest from '../models/visitor/GuestRequest.js';
import DeliveryVisit from '../models/visitor/DeliveryVisit.js';
import VisitorLog from '../models/visitor/VisitorLog.js';
import Flat from '../models/Flat.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { generateToken, generateVisitorQR, buildWhatsAppShareUrl } from '../utils/qrHelper.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

async function getFlatNumbers(flatIds) {
  const flats = await Flat.find({ _id: { $in: flatIds } }).select('flatNumber wing');
  return flats.map((f) => (f.wing ? `${f.wing}-${f.flatNumber}` : f.flatNumber));
}

async function logEvent({ category, action, referenceModel, referenceId, visitorName, mobile, flatNumbers, flatId, watchmanId, details }) {
  return VisitorLog.create({
    visitorCategory: category,
    action,
    referenceModel,
    referenceId,
    visitorName,
    mobile: mobile || '',
    flatNumbers: flatNumbers || [],
    flatId,
    watchmanId,
    details: details || {},
  });
}

export const overviewService = {
  async getAdminDashboard() {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      totalVisitorsToday,
      dailyStaffInside,
      guestsInside,
      deliveryInside,
      pendingStaff,
      pendingGuests,
      totalEntriesToday,
      totalExitsToday,
      recentLogs,
    ] = await Promise.all([
      VisitorLog.countDocuments({ action: { $in: ['Entry'] }, timestamp: { $gte: todayStart, $lte: todayEnd } }),
      DailyStaff.countDocuments({ approvalStatus: 'Approved', currentStatus: 'Inside' }),
      GuestRequest.countDocuments({ status: 'Inside' }),
      DeliveryVisit.countDocuments({ status: 'Inside' }),
      DailyStaff.countDocuments({ approvalStatus: 'Pending Approval' }),
      GuestRequest.countDocuments({ status: 'Pending Approval' }),
      VisitorLog.countDocuments({ action: 'Entry', timestamp: { $gte: todayStart, $lte: todayEnd } }),
      VisitorLog.countDocuments({ action: 'Exit', timestamp: { $gte: todayStart, $lte: todayEnd } }),
      VisitorLog.find({ action: { $in: ['Entry', 'Exit'] } })
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('watchmanId', 'name')
        .populate('flatId', 'flatNumber wing'),
    ]);

    return {
      totalVisitorsToday,
      dailyStaffInside,
      guestsInside,
      deliveryInside,
      pendingApprovals: pendingStaff + pendingGuests,
      pendingStaff,
      pendingGuests,
      totalEntries: totalEntriesToday,
      totalExits: totalExitsToday,
      recentLogs,
    };
  },

  async getWatchmanDashboard() {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [staffEntries, deliveryEntries, guestEntries] = await Promise.all([
      VisitorLog.countDocuments({ visitorCategory: 'Daily Staff', action: 'Entry', timestamp: { $gte: todayStart, $lte: todayEnd } }),
      VisitorLog.countDocuments({ visitorCategory: 'Delivery', action: 'Entry', timestamp: { $gte: todayStart, $lte: todayEnd } }),
      VisitorLog.countDocuments({ visitorCategory: 'Guest', action: 'Entry', timestamp: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    return { staffEntries, deliveryEntries, guestEntries };
  },

  async getResidentDashboard(residentId) {
    const today = startOfToday();
    const upcoming = await GuestRequest.find({
      residentId,
      visitingDate: { $gte: today },
      status: { $in: ['Pending Approval', 'Approved'] },
    })
      .sort({ visitingDate: 1 })
      .limit(5)
      .populate('flatId', 'flatNumber wing');

    const pending = await GuestRequest.countDocuments({ residentId, status: 'Pending Approval' });
    const history = await GuestRequest.find({ residentId, status: { $in: ['Inside', 'Exited', 'Approved'] } })
      .sort({ visitingDate: -1 })
      .limit(10)
      .populate('flatId', 'flatNumber wing');

    return { upcoming, pending, history };
  },
};

export const dailyStaffService = {
  async register(body, files, userId) {
    const flatIds = Array.isArray(body.flatIds) ? body.flatIds : JSON.parse(body.flatIds || '[]');
    if (!flatIds.length) throw new ApiError(400, 'At least one flat must be assigned');

    const staff = await DailyStaff.create({
      fullName: body.fullName,
      mobile: body.mobile,
      address: body.address || '',
      photo: files?.photo?.[0] ? `/uploads/${files.photo[0].filename}` : '',
      emergencyContact: body.emergencyContact || '',
      idProof: files?.idProof?.[0] ? `/uploads/${files.idProof[0].filename}` : '',
      staffType: body.staffType,
      flatIds,
      workDescription: body.workDescription || '',
      workingTimeSlot: body.workingTimeSlot || '',
      registeredBy: userId,
    });

    const flatNumbers = await getFlatNumbers(flatIds);
    await logEvent({
      category: 'Daily Staff',
      action: 'Registration',
      referenceModel: 'DailyStaff',
      referenceId: staff._id,
      visitorName: staff.fullName,
      mobile: staff.mobile,
      flatNumbers,
      watchmanId: userId,
      details: { staffType: staff.staffType },
    });

    return staff.populate([
      { path: 'flatIds', select: 'flatNumber wing' },
      { path: 'registeredBy', select: 'name' },
    ]);
  },

  async getAll(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.currentStatus) filter.currentStatus = query.currentStatus;
    if (query.staffType) filter.staffType = query.staffType;
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.flatId) filter.flatIds = query.flatId;

    const [data, total] = await Promise.all([
      DailyStaff.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('flatIds', 'flatNumber wing')
        .populate('registeredBy', 'name')
        .populate('approvedBy', 'name'),
      DailyStaff.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, page, limit);
  },

  async getById(id) {
    const staff = await DailyStaff.findById(id)
      .populate('flatIds', 'flatNumber wing')
      .populate('registeredBy', 'name')
      .populate('approvedBy', 'name');
    if (!staff) throw new ApiError(404, 'Daily staff not found');
    return staff;
  },

  async approve(id, userId) {
    const staff = await DailyStaff.findById(id);
    if (!staff) throw new ApiError(404, 'Daily staff not found');
    if (staff.approvalStatus !== 'Pending Approval') {
      throw new ApiError(400, 'Staff request is not pending approval');
    }

    const token = generateToken();
    const qrCodePath = await generateVisitorQR(token, 'staff');

    staff.qrToken = token;
    staff.qrCodePath = qrCodePath;
    staff.approvalStatus = 'Approved';
    staff.approvedBy = userId;
    staff.approvedAt = new Date();
    await staff.save();

    const flatNumbers = await getFlatNumbers(staff.flatIds);
    await logEvent({
      category: 'Daily Staff',
      action: 'Approval',
      referenceModel: 'DailyStaff',
      referenceId: staff._id,
      visitorName: staff.fullName,
      mobile: staff.mobile,
      flatNumbers,
      watchmanId: userId,
    });

    return staff.populate([
      { path: 'flatIds', select: 'flatNumber wing' },
      { path: 'approvedBy', select: 'name' },
    ]);
  },

  async reject(id, userId, reason) {
    const staff = await DailyStaff.findById(id);
    if (!staff) throw new ApiError(404, 'Daily staff not found');
    if (staff.approvalStatus !== 'Pending Approval') {
      throw new ApiError(400, 'Staff request is not pending approval');
    }

    staff.approvalStatus = 'Rejected';
    staff.rejectionReason = reason || '';
    staff.approvedBy = userId;
    staff.approvedAt = new Date();
    await staff.save();

    const flatNumbers = await getFlatNumbers(staff.flatIds);
    await logEvent({
      category: 'Daily Staff',
      action: 'Rejection',
      referenceModel: 'DailyStaff',
      referenceId: staff._id,
      visitorName: staff.fullName,
      mobile: staff.mobile,
      flatNumbers,
      watchmanId: userId,
      details: { reason },
    });

    return staff;
  },
};

export const guestService = {
  async create(body, residentId, flatId) {
    if (!flatId) throw new ApiError(400, 'Resident must be linked to a flat');

    const guest = await GuestRequest.create({
      guestName: body.guestName,
      mobile: body.mobile,
      relation: body.relation || '',
      visitingDate: new Date(body.visitingDate),
      expectedArrivalTime: body.expectedArrivalTime || '',
      flatId,
      residentId,
    });

    const flat = await Flat.findById(flatId);
    await logEvent({
      category: 'Guest',
      action: 'Registration',
      referenceModel: 'GuestRequest',
      referenceId: guest._id,
      visitorName: guest.guestName,
      mobile: guest.mobile,
      flatNumbers: flat ? [flat.flatNumber] : [],
      flatId,
      details: { relation: guest.relation },
    });

    return guest.populate('flatId', 'flatNumber wing');
  },

  async getAll(query, user) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (user.role === 'Resident') filter.residentId = user._id;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { guestName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.flatId) filter.flatId = query.flatId;
    if (query.dateFrom || query.dateTo) {
      filter.visitingDate = {};
      if (query.dateFrom) filter.visitingDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        filter.visitingDate.$lte = end;
      }
    }

    const [data, total] = await Promise.all([
      GuestRequest.find(filter)
        .sort({ visitingDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('flatId', 'flatNumber wing')
        .populate('residentId', 'name email mobile')
        .populate('approvedBy', 'name'),
      GuestRequest.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, page, limit);
  },

  async getById(id, user) {
    const guest = await GuestRequest.findById(id)
      .populate('flatId', 'flatNumber wing')
      .populate('residentId', 'name email mobile')
      .populate('approvedBy', 'name');
    if (!guest) throw new ApiError(404, 'Guest request not found');
    if (user?.role === 'Resident' && String(guest.residentId?._id || guest.residentId) !== String(user._id)) {
      throw new ApiError(403, 'Access denied');
    }
    return guest;
  },

  async approve(id, userId) {
    const guest = await GuestRequest.findById(id).populate('flatId', 'flatNumber wing');
    if (!guest) throw new ApiError(404, 'Guest request not found');
    if (guest.status !== 'Pending Approval') {
      throw new ApiError(400, 'Guest request is not pending approval');
    }

    const token = generateToken();
    const qrCodePath = await generateVisitorQR(token, 'guest');
    const flatLabel = guest.flatId?.wing
      ? `${guest.flatId.wing}-${guest.flatId.flatNumber}`
      : guest.flatId?.flatNumber || '';

    const message = [
      `Hello ${guest.guestName},`,
      `Your visitor pass for ${flatLabel} is approved.`,
      `Visit Date: ${new Date(guest.visitingDate).toLocaleDateString('en-IN')}`,
      guest.expectedArrivalTime ? `Expected Time: ${guest.expectedArrivalTime}` : '',
      `Show this QR at the gate. Token: ${token}`,
    ]
      .filter(Boolean)
      .join('\n');

    guest.qrToken = token;
    guest.qrCodePath = qrCodePath;
    guest.status = 'Approved';
    guest.approvedBy = userId;
    guest.approvedAt = new Date();
    guest.whatsappShareUrl = buildWhatsAppShareUrl(guest.mobile, message);
    await guest.save();

    await logEvent({
      category: 'Guest',
      action: 'Approval',
      referenceModel: 'GuestRequest',
      referenceId: guest._id,
      visitorName: guest.guestName,
      mobile: guest.mobile,
      flatNumbers: flatLabel ? [flatLabel] : [],
      flatId: guest.flatId?._id,
      watchmanId: userId,
    });

    return guest;
  },

  async reject(id, userId, reason) {
    const guest = await GuestRequest.findById(id);
    if (!guest) throw new ApiError(404, 'Guest request not found');
    if (guest.status !== 'Pending Approval') {
      throw new ApiError(400, 'Guest request is not pending approval');
    }

    guest.status = 'Rejected';
    guest.rejectionReason = reason || '';
    guest.approvedBy = userId;
    guest.approvedAt = new Date();
    await guest.save();

    const flat = await Flat.findById(guest.flatId);
    await logEvent({
      category: 'Guest',
      action: 'Rejection',
      referenceModel: 'GuestRequest',
      referenceId: guest._id,
      visitorName: guest.guestName,
      mobile: guest.mobile,
      flatNumbers: flat ? [flat.flatNumber] : [],
      flatId: guest.flatId,
      watchmanId: userId,
      details: { reason },
    });

    return guest;
  },
};

export const deliveryService = {
  async createEntry(body, userId) {
    const visit = await DeliveryVisit.create({
      deliveryPersonName: body.deliveryPersonName,
      mobile: body.mobile || '',
      companyName: body.companyName,
      flatId: body.flatId,
      parcelType: body.parcelType || '',
      recordedBy: userId,
    });

    const flat = await Flat.findById(body.flatId);
    await logEvent({
      category: 'Delivery',
      action: 'Entry',
      referenceModel: 'DeliveryVisit',
      referenceId: visit._id,
      visitorName: visit.deliveryPersonName,
      mobile: visit.mobile,
      flatNumbers: flat ? [flat.flatNumber] : [],
      flatId: body.flatId,
      watchmanId: userId,
      details: { companyName: visit.companyName, parcelType: visit.parcelType },
    });

    return visit.populate([
      { path: 'flatId', select: 'flatNumber wing' },
      { path: 'recordedBy', select: 'name' },
    ]);
  },

  async recordExit(id, userId) {
    const visit = await DeliveryVisit.findById(id);
    if (!visit) throw new ApiError(404, 'Delivery visit not found');
    if (visit.status === 'Exited') throw new ApiError(400, 'Delivery person already exited');

    visit.status = 'Exited';
    visit.exitTime = new Date();
    await visit.save();

    const flat = await Flat.findById(visit.flatId);
    await logEvent({
      category: 'Delivery',
      action: 'Exit',
      referenceModel: 'DeliveryVisit',
      referenceId: visit._id,
      visitorName: visit.deliveryPersonName,
      mobile: visit.mobile,
      flatNumbers: flat ? [flat.flatNumber] : [],
      flatId: visit.flatId,
      watchmanId: userId,
      details: { companyName: visit.companyName },
    });

    return visit.populate([
      { path: 'flatId', select: 'flatNumber wing' },
      { path: 'recordedBy', select: 'name' },
    ]);
  },

  async getAll(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { deliveryPersonName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
        { companyName: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.flatId) filter.flatId = query.flatId;

    const [data, total] = await Promise.all([
      DeliveryVisit.find(filter)
        .sort({ entryTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('flatId', 'flatNumber wing')
        .populate('recordedBy', 'name'),
      DeliveryVisit.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, page, limit);
  },
};

export const scanService = {
  async lookup(token) {
    const staff = await DailyStaff.findOne({ qrToken: token, approvalStatus: 'Approved' })
      .populate('flatIds', 'flatNumber wing');
    if (staff) {
      return {
        found: true,
        category: 'Daily Staff',
        id: staff._id,
        name: staff.fullName,
        mobile: staff.mobile,
        staffType: staff.staffType,
        photo: staff.photo,
        flats: staff.flatIds,
        currentStatus: staff.currentStatus,
        workingTimeSlot: staff.workingTimeSlot,
        workDescription: staff.workDescription,
      };
    }

    const guest = await GuestRequest.findOne({ qrToken: token, status: { $in: ['Approved', 'Inside', 'Exited'] } })
      .populate('flatId', 'flatNumber wing')
      .populate('residentId', 'name');
    if (guest) {
      const visitDate = new Date(guest.visitingDate);
      const today = startOfToday();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (visitDate < today || visitDate >= tomorrow) {
        return {
          found: true,
          category: 'Guest',
          invalid: true,
          message: 'Guest pass is not valid for today',
          name: guest.guestName,
          visitingDate: guest.visitingDate,
        };
      }
      return {
        found: true,
        category: 'Guest',
        id: guest._id,
        name: guest.guestName,
        mobile: guest.mobile,
        relation: guest.relation,
        flat: guest.flatId,
        resident: guest.residentId,
        currentStatus: guest.status === 'Inside' ? 'Inside' : 'Exited',
        visitingDate: guest.visitingDate,
        expectedArrivalTime: guest.expectedArrivalTime,
      };
    }

    return { found: false, message: 'Invalid or expired QR code' };
  },

  async scan(token, userId) {
    const lookup = await this.lookup(token);
    if (!lookup.found) throw new ApiError(404, lookup.message);
    if (lookup.invalid) throw new ApiError(400, lookup.message);

    if (lookup.category === 'Daily Staff') {
      const staff = await DailyStaff.findById(lookup.id);
      const isInside = staff.currentStatus === 'Inside';
      const action = isInside ? 'Exit' : 'Entry';

      staff.currentStatus = isInside ? 'Exited' : 'Inside';
      if (isInside) staff.lastExitAt = new Date();
      else staff.lastEntryAt = new Date();
      await staff.save();

      const flatNumbers = await getFlatNumbers(staff.flatIds);
      await logEvent({
        category: 'Daily Staff',
        action,
        referenceModel: 'DailyStaff',
        referenceId: staff._id,
        visitorName: staff.fullName,
        mobile: staff.mobile,
        flatNumbers,
        watchmanId: userId,
        details: { staffType: staff.staffType },
      });

      return {
        category: 'Daily Staff',
        action,
        currentStatus: staff.currentStatus,
        visitor: await staff.populate('flatIds', 'flatNumber wing'),
        timestamp: isInside ? staff.lastExitAt : staff.lastEntryAt,
      };
    }

    const guest = await GuestRequest.findById(lookup.id);
    const isInside = guest.status === 'Inside';
    const action = isInside ? 'Exit' : 'Entry';

    if (!isInside && guest.status === 'Approved') {
      guest.status = 'Inside';
      guest.entryTime = new Date();
    } else if (isInside) {
      guest.status = 'Exited';
      guest.exitTime = new Date();
    } else if (guest.status === 'Exited') {
      guest.status = 'Inside';
      guest.entryTime = new Date();
    }
    await guest.save();

    const flat = await Flat.findById(guest.flatId);
    await logEvent({
      category: 'Guest',
      action,
      referenceModel: 'GuestRequest',
      referenceId: guest._id,
      visitorName: guest.guestName,
      mobile: guest.mobile,
      flatNumbers: flat ? [flat.flatNumber] : [],
      flatId: guest.flatId,
      watchmanId: userId,
      details: { relation: guest.relation },
    });

    return {
      category: 'Guest',
      action,
      currentStatus: guest.status,
      visitor: await guest.populate([
        { path: 'flatId', select: 'flatNumber wing' },
        { path: 'residentId', select: 'name' },
      ]),
      timestamp: action === 'Entry' ? guest.entryTime : guest.exitTime,
    };
  },
};

export const logService = {
  async getAll(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.visitorCategory) filter.visitorCategory = query.visitorCategory;
    if (query.action) filter.action = query.action;
    if (query.search) {
      filter.$or = [
        { visitorName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
        { flatNumbers: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      filter.timestamp = {};
      if (query.dateFrom) filter.timestamp.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }
    if (query.flatNumber) {
      filter.flatNumbers = { $regex: query.flatNumber, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      VisitorLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('watchmanId', 'name')
        .populate('flatId', 'flatNumber wing'),
      VisitorLog.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, page, limit);
  },

  async getLiveVisitors() {
    const [staff, guests, deliveries] = await Promise.all([
      DailyStaff.find({ approvalStatus: 'Approved', currentStatus: 'Inside' })
        .populate('flatIds', 'flatNumber wing'),
      GuestRequest.find({ status: 'Inside' })
        .populate('flatId', 'flatNumber wing')
        .populate('residentId', 'name'),
      DeliveryVisit.find({ status: 'Inside' })
        .populate('flatId', 'flatNumber wing')
        .populate('recordedBy', 'name'),
    ]);

    return { staff, guests, deliveries };
  },
};

export const visitorSearchService = {
  async search(query) {
    const { page, limit, skip } = getPagination(query);
    const results = [];

    const logFilter = {};
    if (query.visitorType) logFilter.visitorCategory = query.visitorType;
    if (query.search) {
      logFilter.$or = [
        { visitorName: { $regex: query.search, $options: 'i' } },
        { mobile: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.flatNumber) logFilter.flatNumbers = { $regex: query.flatNumber, $options: 'i' };
    if (query.dateFrom || query.dateTo) {
      logFilter.timestamp = {};
      if (query.dateFrom) logFilter.timestamp.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        logFilter.timestamp.$lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      VisitorLog.find(logFilter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('watchmanId', 'name')
        .populate('flatId', 'flatNumber wing'),
      VisitorLog.countDocuments(logFilter),
    ]);

    return paginatedResponse(logs, total, page, limit);
  },
};
