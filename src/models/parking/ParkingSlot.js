import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    floor: { type: String, trim: true, default: '' },
    slotStatus: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Blocked', 'Maintenance'],
      default: 'Available',
    },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

parkingSlotSchema.index({ slotStatus: 1 });

export default mongoose.model('ParkingSlot', parkingSlotSchema);
