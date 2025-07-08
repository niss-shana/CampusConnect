import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: {
    type: String,
    enum: ['high', 'medium', 'normal'],
    default: 'normal'
  },
  createdBy: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);