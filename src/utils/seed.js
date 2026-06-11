import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Tag from '../models/Tag.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const DEFAULT_TAGS = [
  { name: 'Defaulter', color: '#ef4444', isDefault: true },
  { name: 'Rental Flat', color: '#f59e0b', isDefault: true },
  { name: 'Committee Member', color: '#3b82f6', isDefault: true },
  { name: 'VIP', color: '#8b5cf6', isDefault: true },
  { name: 'Vacant Flat', color: '#6b7280', isDefault: true },
];

const USERS = [
  { name: 'Society Admin', email: 'admin@society.com', password: 'admin123', role: 'Admin' },
  { name: 'Gate Watchman', email: 'watchman@society.com', password: 'watchman123', role: 'Watchman', mobile: '9999900001' },
  { name: 'Demo Resident', email: 'resident@society.com', password: 'resident123', role: 'Resident', mobile: '9876543210' },
];

const seed = async () => {
  await connectDB();

  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create(u);
      console.log(`Created ${u.role}: ${u.email}`);
    } else if (existing.role !== u.role) {
      existing.role = u.role;
      await existing.save();
      console.log(`Updated role for ${u.email} → ${u.role}`);
    }
  }

  for (const tag of DEFAULT_TAGS) {
    await Tag.findOneAndUpdate(
      { name: tag.name },
      { ...tag, status: 'active' },
      { upsert: true, new: true }
    );
  }
  console.log('Default tags ready');

  console.log('Seed completed — no sample flats or parking data');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
