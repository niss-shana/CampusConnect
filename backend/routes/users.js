// routes/users.js
import express from 'express';
const router = express.Router();
import User from '../models/user.js';
import { auth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { check, validationResult } from 'express-validator';

// @route   GET api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if the requested user matches the authenticated user
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to access this profile' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').optional().isLength({ min: 6 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if the requested user matches the authenticated user
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this profile' });
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

    res.json({ 
      msg: 'Profile updated successfully',
      user 
    });
  } catch (err) {
    console.error(err.message);
    
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    
    res.status(500).send('Server Error');
  }
});
// Get all students (admin only)
router.get('/students', async (req, res) => {
    console.log("viewing students");
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
  
      // Find all students (role = 'student')
      const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ createdAt: -1 });
  
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete a user (admin only)
  router.delete('/:id', async (req, res) => {
    try {
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
  
      // Prevent admin from deleting themselves
      if (req.user.id === req.params.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
  
      const user = await User.findByIdAndDelete(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

export default router;