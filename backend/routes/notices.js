// routes/notices.js
import express from 'express';
const router = express.Router();
import Notice from '../models/notice.js';
import { auth } from '../middleware/auth.js';

// @route   GET api/notices
// @desc    Get all notices
// @access  Public (or Private if you want to restrict)
router.get('/', async (req, res) => {
  try {
    // Sort by createdAt in descending order (newest first)
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/notices
// @desc    Create a notice
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    console.log("req.user", req.user);
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { title, content, priority } = req.body;

    const newNotice = new Notice({
      title,
      content,
      priority,
      createdBy: req.user.name || 'Admin' // Assuming user has a name field
    });

    const notice = await newNotice.save();
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/notices/:id
// @desc    Update a notice
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log("req.user", req.user);
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { title, content, priority } = req.body;

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    notice.title = title || notice.title;
    notice.content = content || notice.content;
    notice.priority = priority || notice.priority;
    notice.updatedAt = Date.now();

    await notice.save();
    res.json(notice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notice not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/notices/:id
// @desc    Delete a notice
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const result = await Notice.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: 'Notice not found' });
    }
    res.json({ msg: 'Notice removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notice not found' });
    }
    res.status(500).send('Server Error');
  }
});

export default router;