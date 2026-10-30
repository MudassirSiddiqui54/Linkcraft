import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  alias: { type: String, required: true, unique: true, trim: true, minlength: 4, maxlength: 40, index: true },
  destination: { type: String, required: true, maxlength: 2048 },
  title: { type: String, trim: true, maxlength: 100, default: '' },
  ownerTokenHash: { type: String, required: true, select: false },
  enabled: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date, default: null, index: true },
  totalClicks: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

linkSchema.index({ alias: 1 }, { unique: true });
linkSchema.index({ createdAt: -1 });
export default mongoose.model('Link', linkSchema);
