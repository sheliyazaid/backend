import mongoose from 'mongoose';

const DELIVERY_STATUSES = ['Inside', 'Exited'];

const deliveryVisitSchema = new mongoose.Schema(
  {
    deliveryPersonName: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true, default: '' },
    companyName: { type: String, required: true, trim: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    parcelType: { type: String, trim: true, default: '' },
    status: { type: String, enum: DELIVERY_STATUSES, default: 'Inside' },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

deliveryVisitSchema.index({ deliveryPersonName: 1 });
deliveryVisitSchema.index({ mobile: 1 });
deliveryVisitSchema.index({ status: 1 });
deliveryVisitSchema.index({ entryTime: -1 });

export { DELIVERY_STATUSES };
export default mongoose.model('DeliveryVisit', deliveryVisitSchema);
