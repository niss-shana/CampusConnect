import express from 'express';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Assignment from '../models/assignment.js';
import Submission from '../models/submission.js';

const router = express.Router();

// ---------------------- ADMIN ROUTES ---------------------- //
// Create new assignment
router.post('/', auth, upload.single('file'), async (req, res) => {
  console.log(req.user);
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, description, totalMarks, dueDate } = req.body;

    const assignmentData = {
      title,
      description,
      totalMarks,
      dueDate,
      file: req.file?.path,
      fileName: req.file?.originalname,
      createdBy: "admin"
    };
    // Attach creator if it's a valid ObjectId (i.e., if admin account stored in DB)
    if (/^[0-9a-fA-F]{24}$/.test(req.user.id)) {
      assignmentData.createdBy = req.user.id;
    }

    const newAssignment = new Assignment(assignmentData);
    
    await newAssignment.save();
    res.json(newAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update assignment
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.file = req.file.path;
      updates.fileName = req.file.originalname;
    }

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete assignment
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await Submission.deleteMany({ assignment: req.params.id });
    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// FIXED: Grade a specific submission - Updated to match frontend
router.post('/:assignmentId/submissions/:submissionId/grade', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { marks, feedback } = req.body;
    const { assignmentId, submissionId } = req.params;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify submission belongs to the assignment
    if (submission.assignment.toString() !== assignmentId) {
      return res.status(400).json({ message: 'Submission does not belong to this assignment' });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    await submission.save();

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ADDED: Delete student submission
router.delete('/:assignmentId/submissions/:submissionId', auth, async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Students can only delete their own submissions
    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own submissions' });
    }

    // Students cannot delete graded submissions
    if (req.user.role === 'student' && submission.marks !== undefined) {
      return res.status(400).json({ message: 'Cannot delete graded submissions' });
    }

    await Submission.findByIdAndDelete(submissionId);
    res.json({ message: 'Submission deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------------------- PUBLIC / AUTH ROUTES ---------------------- //
// TEMPORARY DEBUG ROUTE - Remove after fixing
router.get('/debug/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Debug: Searching for submissions with userId:', userId);
    
    // Try different query formats
    const directQuery = await Submission.find({ student: userId });
    const objectIdQuery = await Submission.find({ student: new mongoose.Types.ObjectId(userId) });
    const allSubmissions = await Submission.find();
    
    res.json({
      userId: userId,
      userIdType: typeof userId,
      directQuery: directQuery,
      objectIdQuery: objectIdQuery,
      allSubmissions: allSubmissions,
      totalSubmissions: allSubmissions.length
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// FIXED: Get all assignments with properly formatted submissions
// FIXED: Get all assignments with properly formatted submissions
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    
    if (req.user.role === 'admin') {
      // For admin, get all submissions for each assignment
      const result = [];
      for (const assignment of assignments) {
        const submissions = await Submission.find({ assignment: assignment._id })
          .populate('student', 'name email');
        
        const formattedSubmissions = submissions.map(sub => ({
          id: sub._id.toString(),
          studentId: sub.student._id.toString(),
          studentName: sub.student.name,
          submissionFile: sub.file,
          submittedAt: sub.submittedAt,
          marks: sub.marks,
          feedback: sub.feedback,
          gradedAt: sub.gradedAt
        }));

        result.push({
          id: assignment._id.toString(),
          title: assignment.title,
          description: assignment.description,
          totalMarks: assignment.totalMarks,
          dueDate: assignment.dueDate,
          file: assignment.file,
          fileName: assignment.fileName,
          createdAt: assignment.createdAt,
          createdBy: assignment.createdBy,
          updatedAt: assignment.updatedAt,
          __v: assignment.__v,
          submissions: formattedSubmissions
        });
      }
      return res.json(result);
    }

    // For students, get only their own submissions
    const result = [];
    console.log('Student ID from req.user:', req.user.id, 'Type:', typeof req.user.id);
    
    for (const assignment of assignments) {
      console.log(`Checking assignment: ${assignment._id} for student: ${req.user.id}`);
      
      // Try multiple query approaches to find user submission
      let userSubmission = await Submission.findOne({ 
        assignment: assignment._id, 
        student: req.user.id 
      });
      
      // If not found, try with ObjectId conversion
      if (!userSubmission) {
        try {
          const mongoose = require('mongoose');
          userSubmission = await Submission.findOne({ 
            assignment: assignment._id, 
            student: new mongoose.Types.ObjectId(req.user.id)
          });
        } catch (e) {
          console.log('ObjectId conversion failed:', e.message);
        }
      }
      
      // If still not found, try string conversion
      if (!userSubmission) {
        userSubmission = await Submission.findOne({ 
          assignment: assignment._id, 
          student: req.user.id.toString()
        });
      }
      
      console.log(`Found submission for assignment ${assignment._id}:`, userSubmission ? 'YES' : 'NO');
      if (userSubmission) {
        console.log('Submission details:', {
          id: userSubmission._id,
          student: userSubmission.student,
          studentType: typeof userSubmission.student,
          assignment: userSubmission.assignment,
          assignmentType: typeof userSubmission.assignment
        });
      }
      
      const formattedSubmissions = userSubmission ? [{
        id: userSubmission._id.toString(),
        studentId: userSubmission.student.toString(),
        studentName: req.user.name,
        submissionFile: userSubmission.file,
        submittedAt: userSubmission.submittedAt,
        marks: userSubmission.marks,
        feedback: userSubmission.feedback,
        gradedAt: userSubmission.gradedAt
      }] : [];

      result.push({
        id: assignment._id.toString(),
        title: assignment.title,
        description: assignment.description,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
        file: assignment.file,
        fileName: assignment.fileName,
        createdAt: assignment.createdAt,
        createdBy: assignment.createdBy,
        updatedAt: assignment.updatedAt,
        __v: assignment.__v,
        submissions: formattedSubmissions
      });
    }
    
    return res.json(result);
  } catch (err) {
    console.error('Error in GET /assignments:', err);
    res.status(500).send('Server error');
  }
});

// TEMPORARY DEBUG ROUTE - Remove after fixing
router.get('/debug/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Debug: Searching for submissions with userId:', userId);
    
    // Try different query formats
    const directQuery = await Submission.find({ student: userId });
    const objectIdQuery = await Submission.find({ student: new mongoose.Types.ObjectId(userId) });
    const allSubmissions = await Submission.find();
    
    // Check what's actually in the database
    const submissionTypes = allSubmissions.map(sub => ({
      id: sub._id,
      student: sub.student,
      studentType: typeof sub.student,
      assignment: sub.assignment,
      assignmentType: typeof sub.assignment
    }));
    
    res.json({
      userId: userId,
      userIdType: typeof userId,
      directQuery: directQuery,
      directQueryCount: directQuery.length,
      objectIdQuery: objectIdQuery,
      objectIdQueryCount: objectIdQuery.length,
      allSubmissions: submissionTypes,
      totalSubmissions: allSubmissions.length,
      userMatches: allSubmissions.filter(sub => 
        sub.student.toString() === userId || 
        sub.student === userId ||
        sub.student.toString() === userId.toString()
      )
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single assignment with submissions status
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    let response = assignment.toObject();
    response.id = response._id;
    delete response._id;

    if (req.user.role === 'admin') {
      const submissions = await Submission.find({ assignment: assignment._id }).populate('student', 'name email');
      response.submissions = submissions.map(sub => ({
        id: sub._id,
        studentId: sub.student._id,
        studentName: sub.student.name,
        submissionFile: sub.file,
        submittedAt: sub.submittedAt,
        marks: sub.marks,
        feedback: sub.feedback,
        gradedAt: sub.gradedAt
      }));
    } else {
      const submission = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
      response.submissions = submission ? [{
        id: submission._id,
        studentId: submission.student,
        studentName: req.user.name,
        submissionFile: submission.file,
        submittedAt: submission.submittedAt,
        marks: submission.marks,
        feedback: submission.feedback,
        gradedAt: submission.gradedAt
      }] : [];
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------------------- STUDENT ROUTES ---------------------- //
// Submit assignment
router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
  try {
    console.log("req.user", req.user);  
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check deadline
    if (new Date(assignment.dueDate) < new Date()) {
      return res.status(400).json({ message: 'Submission deadline passed' });
    }

    // Check if already submitted
    const existing = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
    if (existing) return res.status(400).json({ message: 'You have already submitted this assignment' });

    const newSubmission = new Submission({
      assignment: assignment._id,
      student: req.user.id,
      file: req.file.path,
      fileName: req.file.originalname,
      submittedAt: new Date()
    });
    
    await newSubmission.save();
    
    // Return formatted response
    const response = {
      id: newSubmission._id,
      studentId: newSubmission.student,
      studentName: req.user.name,
      submissionFile: newSubmission.file,
      submittedAt: newSubmission.submittedAt,
      marks: newSubmission.marks,
      feedback: newSubmission.feedback,
      gradedAt: newSubmission.gradedAt
    };
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;