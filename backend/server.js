import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import assignmentRoutes from './routes/assignments.js';
import noticeRoutes from './routes/notices.js';
import { ensureDirectories } from './utils/fileUtils.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure upload directories exist
ensureDirectories();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes); // Auth routes (public)
app.use('/api/users', userRoutes); // User routes (mixed auth)
app.use('/api/assignments', assignmentRoutes); // Assignment routes (protected)
app.use('/api/notices', noticeRoutes); // Notice routes (protected)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));