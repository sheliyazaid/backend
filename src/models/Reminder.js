import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    reminderStatus: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

reminderSchema.index({ flatId: 1 });
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ reminderStatus: 1 });

export default mongoose.model('Reminder', reminderSchema);
