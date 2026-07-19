import express, { Router, Request, Response } from 'express';
import User from '../models/User';
import Pin from '../models/Pin';
import { adminMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Get all users
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// Block user
router.post('/users/:userId/block', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.isBlocked = true;
    await user.save();

    res.json({
      success: true,
      message: 'User blocked',
      data: user,
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block user',
    });
  }
});

// Unblock user
router.post('/users/:userId/unblock', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.isBlocked = false;
    await user.save();

    res.json({
      success: true,
      message: 'User unblocked',
      data: user,
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user',
    });
  }
});

// Delete pin (admin)
router.delete('/pins/:pinId', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pin = await Pin.findById(req.params.pinId);
    if (!pin) {
      return res.status(404).json({
        success: false,
        error: 'Pin not found',
      });
    }

    const { reason } = req.body;
    console.log(`[Admin] Deleted pin ${req.params.pinId} by ${req.userId}. Reason: ${reason || 'No reason provided'}`);

    await Pin.deleteOne({ _id: req.params.pinId });

    res.json({
      success: true,
      message: 'Pin deleted by admin',
    });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pin',
    });
  }
});

// Get statistics
router.get('/stats', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalPins = await Pin.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true });

    res.json({
      success: true,
      data: {
        totalUsers,
        blockedUsers,
        activeUsers: totalUsers - blockedUsers,
        totalPins,
        totalAdmins,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;
