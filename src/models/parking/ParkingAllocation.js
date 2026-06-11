import mongoose from 'mongoose';

const parkingAllocationSchema = new mongoose.Schema(
  {
    allocationNumber: { type: String, required: true, unique: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
    holderName: { type: String, required: true, trim: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    allocationDate: { type: Date, default: Date.now },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    allocationStatus: {
      type: String,
      enum: ['Active', 'Released'],
      default: 'Active',
    },
    releasedAt: { type: Date },
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    releaseReason: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

parkingAllocationSchema.index({ allocationNumber: 1 });
parkingAllocationSchema.index({ allocationStatus: 1 });
parkingAllocationSchema.index({ vehicleNumber: 1 });
parkingAllocationSchema.index({ slotId: 1 });
parkingAllocationSchema.index({ flatId: 1 });

export default mongoose.model('ParkingAllocation', parkingAllocationSchema);
