import mongoose from 'mongoose';

const GUEST_STATUSES = ['Pending Approval', 'Approved', 'Rejected', 'Inside', 'Exited'];

const guestRequestSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    relation: { type: String, trim: true, default: '' },
    visitingDate: { type: Date, required: true },
    expectedArrivalTime: { type: String, trim: true, default: '' },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrToken: { type: String, unique: true, sparse: true },
    qrCodePath: { type: String, default: '' },
    status: { type: String, enum: GUEST_STATUSES, default: 'Pending Approval' },
    entryTime: { type: Date },
    exitTime: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    whatsappShareUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

guestRequestSchema.index({ guestName: 1 });
guestRequestSchema.index({ mobile: 1 });
guestRequestSchema.index({ status: 1 });
guestRequestSchema.index({ visitingDate: 1 });
guestRequestSchema.index({ residentId: 1 });

export { GUEST_STATUSES };
export default mongoose.model('GuestRequest', guestRequestSchema);
