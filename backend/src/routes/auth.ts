import express, { Router, Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

const generateToken = (userId: string, isAdmin: boolean): string => {
  return jwt.sign(
    { userId, isAdmin },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, age } = req.body;

    if (!email || !password || !age) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (age < 17) {
      return res.status(400).json({
        success: false,
        error: 'Must be at least 17 years old',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    const user = new User({
      email,
      password,
      age,
      isAdmin: email === process.env.ADMIN_EMAIL,
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.isAdmin);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        age: user.age,
        isAdmin: user.isAdmin,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'User account is blocked',
      });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id.toString(), user.isAdmin);

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        age: user.age,
        isAdmin: user.isAdmin,
        reputation: user.reputation,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Register Device Token (for push notifications)
router.post('/register-device', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'Device token required',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Device token registered',
    });
  } catch (error) {
    console.error('Device token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device token',
    });
  }
});

export default router;
