import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    alternateMobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    aadhaarNumber: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, default: '' },
    ownershipStartDate: { type: Date },
    isPrimary: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ownerSchema.index({ flatId: 1 });
ownerSchema.index({ fullName: 1 });
ownerSchema.index({ mobile: 1 });

export default mongoose.model('Owner', ownerSchema);
