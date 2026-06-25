import mongoose from 'mongoose';

const VISITOR_CATEGORIES = ['Daily Staff', 'Delivery', 'Guest'];
const LOG_ACTIONS = ['Entry', 'Exit', 'Registration', 'Approval', 'Rejection'];

const visitorLogSchema = new mongoose.Schema(
  {
    visitorCategory: { type: String, enum: VISITOR_CATEGORIES, required: true },
    action: { type: String, enum: LOG_ACTIONS, required: true },
    referenceModel: { type: String, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    visitorName: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true, default: '' },
    flatNumbers: [{ type: String }],
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
    watchmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

visitorLogSchema.index({ visitorCategory: 1, timestamp: -1 });
visitorLogSchema.index({ visitorName: 1 });
visitorLogSchema.index({ mobile: 1 });
visitorLogSchema.index({ timestamp: -1 });

export { VISITOR_CATEGORIES, LOG_ACTIONS };
export default mongoose.model('VisitorLog', visitorLogSchema);
