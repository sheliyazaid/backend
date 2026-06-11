import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status !== 'active') {
    throw new ApiError(403, 'Account is inactive');
  }
  const token = generateToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      flatId: user.flatId,
    },
  };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate({ path: 'flatId', select: 'flatNumber wing floor' });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};
