import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema(
  {
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

familyMemberSchema.index({ flatId: 1 });
familyMemberSchema.index({ name: 1 });
familyMemberSchema.index({ mobile: 1 });

export default mongoose.model('FamilyMember', familyMemberSchema);
