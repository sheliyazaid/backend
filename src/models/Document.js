import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    documentType: {
      type: String,
      enum: ['Sale Deed', 'Rent Agreement', 'Aadhaar', 'PAN', 'NOC', 'Other Documents'],
      required: true,
    },
    title: { type: String, trim: true, default: '' },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

documentSchema.index({ flatId: 1 });
documentSchema.index({ documentType: 1 });

export default mongoose.model('Document', documentSchema);
