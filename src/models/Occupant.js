import mongoose from 'mongoose';

const occupantSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['Owner', 'Tenant', 'Family Member'],
      required: true,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

occupantSchema.index({ flatId: 1 });
occupantSchema.index({ name: 1 });
occupantSchema.index({ mobile: 1 });

export default mongoose.model('Occupant', occupantSchema);
