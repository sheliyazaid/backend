import mongoose from 'mongoose';

const parkingEntryExitSchema = new mongoose.Schema(
  {
    recordType: { type: String, enum: ['Entry', 'Exit'], required: true },
    vehicleNumber: { type: String, required: true, uppercase: true },
    passId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingPass' },
    allocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingAllocation' },
    visitorPassId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorParkingPass' },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
    holderName: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    gate: { type: String, trim: true, default: 'Main Gate' },
    securityGuardId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, default: Date.now },
    validationResult: {
      type: String,
      enum: ['Valid', 'Invalid', 'Expired', 'Blocked', 'No Allocation'],
      default: 'Valid',
    },
    entryType: { type: String, enum: ['Registered', 'Unregistered', 'Resident', 'Visitor'], default: 'Registered' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

parkingEntryExitSchema.index({ vehicleNumber: 1, scannedAt: -1 });
parkingEntryExitSchema.index({ recordType: 1 });

export default mongoose.model('ParkingEntryExit', parkingEntryExitSchema);
