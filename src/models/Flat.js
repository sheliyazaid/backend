import mongoose from 'mongoose';

const flatSchema = new mongoose.Schema(
  {
    flatNumber: { type: String, required: true, trim: true },
    wing: { type: String, trim: true, default: '' },
    floor: { type: Number, default: 0 },
    flatStatus: {
      type: String,
      enum: ['Occupied', 'Vacant', 'Under Maintenance'],
      default: 'Vacant',
    },
    notes: { type: String, default: '' },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

flatSchema.index({ flatNumber: 1 });
flatSchema.index({ wing: 1, flatNumber: 1 });

export default mongoose.model('Flat', flatSchema);
