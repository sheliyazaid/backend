import Flat from '../models/Flat.js';
import Owner from '../models/Owner.js';
import Occupant from '../models/Occupant.js';
import FamilyMember from '../models/FamilyMember.js';
import Tenant from '../models/Tenant.js';
import Vehicle from '../models/Vehicle.js';
import Document from '../models/Document.js';
import Note from '../models/Note.js';
import Tag from '../models/Tag.js';
import Reminder from '../models/Reminder.js';
import ActivityLog from '../models/ActivityLog.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { logActivity } from '../utils/activityLogger.js';

const buildFlatFilter = (query) => {
  const filter = { status: 'active' };
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ flatNumber: regex }, { wing: regex }, { notes: regex }];
  }
  if (query.flatStatus) filter.flatStatus = query.flatStatus;
  if (query.wing) filter.wing = query.wing;
  return filter;
};

export const getFlats = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildFlatFilter(query);
  const [data, total] = await Promise.all([
    Flat.find(filter)
      .populate('tagIds', 'name color')
      .sort({ wing: 1, flatNumber: 1 })
      .skip(skip)
      .limit(limit),
    Flat.countDocuments(filter),
  ]);
  return paginatedResponse(data, total, page, limit);
};

export const getFlatById = async (id) => {
  const flat = await Flat.findOne({ _id: id, status: 'active' }).populate('tagIds', 'name color');
  if (!flat) throw new ApiError(404, 'Flat not found');
  return flat;
};

export const createFlat = async (data, userId) => {
  const flat = await Flat.create({ ...data, createdBy: userId });
  await logActivity({
    flatId: flat._id,
    action: 'Flat Created',
    entityType: 'Flat',
    entityId: flat._id,
    description: `Flat ${flat.flatNumber} created`,
    createdBy: userId,
  });
  return flat;
};

export const updateFlat = async (id, data, userId) => {
  const flat = await Flat.findOneAndUpdate(
    { _id: id, status: 'active' },
    data,
    { new: true, runValidators: true }
  );
  if (!flat) throw new ApiError(404, 'Flat not found');
  await logActivity({
    flatId: flat._id,
    action: 'Flat Updated',
    entityType: 'Flat',
    entityId: flat._id,
    description: `Flat ${flat.flatNumber} updated`,
    createdBy: userId,
  });
  return flat;
};

export const deleteFlat = async (id, userId) => {
  const flat = await Flat.findOneAndUpdate(
    { _id: id, status: 'active' },
    { status: 'inactive' },
    { new: true }
  );
  if (!flat) throw new ApiError(404, 'Flat not found');
  return flat;
};

export const getFlat360 = async (id) => {
  const flat = await getFlatById(id);
  const [
    owners,
    occupants,
    familyMembers,
    tenants,
    vehicles,
    documents,
    notes,
    reminders,
    activities,
    ownerCount,
    occupantCount,
    vehicleCount,
    documentCount,
    activeReminders,
  ] = await Promise.all([
    Owner.find({ flatId: id, status: 'active' }).sort({ isPrimary: -1 }),
    Occupant.find({ flatId: id, status: 'active' }),
    FamilyMember.find({ flatId: id, status: 'active' }),
    Tenant.find({ flatId: id, status: 'active' }).sort({ isCurrent: -1, createdAt: -1 }),
    Vehicle.find({ flatId: id, status: 'active' }),
    Document.find({ flatId: id, status: 'active' }).sort({ createdAt: -1 }),
    Note.find({ flatId: id, status: 'active' }).sort({ createdAt: -1 }),
    Reminder.find({ flatId: id, status: 'active' }).sort({ dueDate: 1 }),
    ActivityLog.find({ flatId: id, status: 'active' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50),
    Owner.countDocuments({ flatId: id, status: 'active' }),
    Occupant.countDocuments({ flatId: id, status: 'active' }),
    Vehicle.countDocuments({ flatId: id, status: 'active' }),
    Document.countDocuments({ flatId: id, status: 'active' }),
    Reminder.countDocuments({ flatId: id, status: 'active', reminderStatus: 'Pending' }),
  ]);

  const tags = flat.tagIds?.length
    ? await Tag.find({ _id: { $in: flat.tagIds }, status: 'active' })
    : [];

  return {
    flat,
    overview: {
      flatNumber: flat.flatNumber,
      wing: flat.wing,
      floor: flat.floor,
      flatStatus: flat.flatStatus,
      ownerCount,
      occupantCount,
      vehicleCount,
      documentCount,
      activeReminders,
    },
    owners,
    occupants,
    familyMembers,
    tenants,
    vehicles,
    documents,
    notes,
    tags,
    reminders,
    activities,
  };
};

export const globalSearch = async (searchTerm) => {
  if (!searchTerm?.trim()) return { flats: [], owners: [], vehicles: [] };
  const regex = new RegExp(searchTerm.trim(), 'i');

  const [flats, owners, vehicles] = await Promise.all([
    Flat.find({
      status: 'active',
      $or: [{ flatNumber: regex }, { wing: regex }],
    })
      .limit(10)
      .select('flatNumber wing floor flatStatus'),
    Owner.find({
      status: 'active',
      $or: [{ fullName: regex }, { mobile: regex }],
    })
      .limit(10)
      .populate('flatId', 'flatNumber wing'),
    Vehicle.find({
      status: 'active',
      vehicleNumber: regex,
    })
      .limit(10)
      .populate('flatId', 'flatNumber wing'),
  ]);

  return { flats, owners, vehicles };
};
