import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'Scooter', 'EV'],
      required: true,
    },
    parkingSlot: { type: String, trim: true, default: '' },
    brand: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ flatId: 1 });
vehicleSchema.index({ vehicleNumber: 1 });

export default mongoose.model('Vehicle', vehicleSchema);
