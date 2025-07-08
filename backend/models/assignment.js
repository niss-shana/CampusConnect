import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  file: { type: String },
  fileName: { type: String },
  createdBy: { type: String }
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);