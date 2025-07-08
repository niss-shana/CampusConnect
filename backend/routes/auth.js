import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config();
const router = express.Router();

// Student Registration
router.post('/register', async (req, res) => {
  console.log("Registering user");
  const { name, email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    user = new User({ name, email, password, role: 'student' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    console.log("Successfully registered user",user);
    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Student Login
router.post('/login', async (req, res) => {
  console.log("Successfully logged in user");
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    console.log("Successfully logged in user",user);
    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
  console.log("Admin login request received");
  const { email, password } = req.body;
  
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(400).json({ message: 'Invalid admin credentials' });
  }
  console.log("Successfully logged in admin");
  
  const payload = { user: { id: 'admin', name: 'Admin', email: email, role: 'admin' } };
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, 
    (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: 'admin', name: 'Admin', email: email, role: 'admin' } });
    }
  );
});

export default router;