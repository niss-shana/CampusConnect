// routes/users.js
import express from 'express';
const router = express.Router();
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { check, validationResult } from 'express-validator';
import { auth, admin } from '../middleware/auth.js';



// Get all students (admin only)
router.get('/students', auth, admin, async (req, res) => {
  try {
    console.log('Fetching all students');
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Error in GET /api/students:', error);
    res.status(500).json({ 
      message: 'Error fetching students',
      error: error.message 
    });
  }
});

// Get user profile (auth required - users can only access their own profile, admins can access any)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is requesting their own profile or if they're an admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Update user profile (auth required - users can only update their own profile, admins can update any)
router.put('/:id', [
  auth,
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').optional().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is updating their own profile or if they're an admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, email, password } = req.body;

    // Build user object
    const userFields = {
      name,
      email
    };

    // If password is provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
    }

    let user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (err) {
    console.error(err.message);
    
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Delete user (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    console.log(`Deleting user with ID: ${req.params.id}`);
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
    } catch (error) {
    console.error('Error in DELETE /api/users:', error);
      res.status(500).json({ 
      message: 'Error deleting user',
        error: error.message 
      });
    }
  });

export default router;