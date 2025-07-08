import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: String, required: true },
  fileName: { type: String, required: true },
  marks: { type: Number },
  feedback: { type: String },
  gradedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema); 