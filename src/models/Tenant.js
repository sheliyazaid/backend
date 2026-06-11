import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    tenantName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    agreementStartDate: { type: Date },
    agreementEndDate: { type: Date },
    policeVerificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Not Required'],
      default: 'Pending',
    },
    idProof: { type: String, default: '' },
    isCurrent: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

tenantSchema.index({ flatId: 1 });
tenantSchema.index({ tenantName: 1 });
tenantSchema.index({ mobile: 1 });
tenantSchema.index({ agreementEndDate: 1 });

export default mongoose.model('Tenant', tenantSchema);
