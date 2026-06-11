import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';

export const listWatchmen = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { role: 'Watchman', status: 'active' };
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
  }
  const [data, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return paginatedResponse(data, total, page, limit);
};

export const createWatchman = async (data, adminId) => {
  const { name, email, password, mobile } = data;
  if (!name?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already in use');

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    mobile: mobile?.trim() || '',
    role: 'Watchman',
    createdBy: adminId,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
  };
};

export const deactivateWatchman = async (id) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: 'Watchman', status: 'active' },
    { status: 'inactive' },
    { new: true }
  ).select('-password');
  if (!user) throw new ApiError(404, 'Watchman not found');
  return user;
};
