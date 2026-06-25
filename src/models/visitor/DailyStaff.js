import mongoose from 'mongoose';

const STAFF_TYPES = ['Maid', 'Cook', 'Driver', 'Cleaner', 'Tutor', 'Newspaper Vendor', 'Milkman', 'Other'];
const APPROVAL_STATUSES = ['Pending Approval', 'Approved', 'Rejected'];
const CURRENT_STATUSES = ['Inside', 'Exited'];

const dailyStaffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    photo: { type: String, default: '' },
    emergencyContact: { type: String, trim: true, default: '' },
    idProof: { type: String, default: '' },
    staffType: { type: String, enum: STAFF_TYPES, required: true },
    flatIds: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flat'
      }],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one flat must be assigned'
      }
    },
    workDescription: { type: String, trim: true, default: '' },
    workingTimeSlot: { type: String, trim: true, default: '' },
    qrToken: { type: String, unique: true, sparse: true },
    qrCodePath: { type: String, default: '' },
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'Pending Approval' },
    currentStatus: { type: String, enum: CURRENT_STATUSES, default: 'Exited' },
    lastEntryAt: { type: Date },
    lastExitAt: { type: Date },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

dailyStaffSchema.index({ fullName: 1 });
dailyStaffSchema.index({ mobile: 1 });
dailyStaffSchema.index({ approvalStatus: 1 });
dailyStaffSchema.index({ currentStatus: 1 });

export { STAFF_TYPES, APPROVAL_STATUSES, CURRENT_STATUSES };
export default mongoose.model('DailyStaff', dailyStaffSchema);
