import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
  linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true, index: true },
  clickedAt: { type: Date, default: Date.now, index: true },
  referrer: { type: String, maxlength: 500, default: 'Direct / Unknown' },
  device: { type: String, enum: ['Desktop', 'Mobile', 'Tablet', 'Bot', 'Other'], default: 'Other' },
  browser: { type: String, maxlength: 80, default: 'Unknown' }
}, { versionKey: false });
clickSchema.index({ linkId: 1, clickedAt: -1 });
export default mongoose.model('Click', clickSchema);
