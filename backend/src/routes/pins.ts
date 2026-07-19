import express, { Router, Request, Response } from 'express';
import Pin from '../models/Pin';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { calculateDistance } from '../utils/helpers';
import moment from 'moment-timezone';

const router: Router = express.Router();
const notificationService = new NotificationService();

const NEARBY_PIN_RADIUS = parseFloat(process.env.NEARBY_PIN_RADIUS_METERS || '100') / 1000; // Convert to km
const NOTIFICATION_RADIUS = parseFloat(process.env.NOTIFICATION_RADIUS_KM || '5');

// Get pins by region
router.get('/region', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({
        success: false,
        error: 'latitude, longitude, and radius required',
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const rad = parseFloat(radius as string);

    const pins = await Pin.find().populate('userId', 'email');

    const filteredPins = pins.filter((pin) => {
      const distance = calculateDistance(lat, lon, pin.latitude, pin.longitude);
      return distance <= rad;
    });

    res.json({
      success: true,
      data: filteredPins,
    });
  } catch (error) {
    console.error('Error fetching pins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pins',
    });
  }
});

// Check if pin exists at location
router.get('/check-exists', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radiusMeters } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude required',
      });
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const radius = (parseFloat(radiusMeters as string) || 100) / 1000;

    const pins = await Pin.findOne();
    if (!pins) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const allPins = await Pin.find();
    const existingPin = allPins.find((pin) => {
      const distance = calculateDistance(lat, lon, pin.latitude, pin.longitude);
      return distance <= radius;
    });

    res.json({
      success: true,
      data: existingPin || null,
    });
  } catch (error) {
    console.error('Error checking pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check pin',
    });
  }
});

// Create pin
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'User not authorized',
      });
    }

    const { latitude, longitude, title, description, actionType } = req.body;

    if (!latitude || !longitude || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check for existing pin nearby
    const allPins = await Pin.find();
    const existingPin = allPins.find((pin) => {
      const distance = calculateDistance(latitude, longitude, pin.latitude, pin.longitude);
      return distance <= NEARBY_PIN_RADIUS;
    });

    if (existingPin) {
      return res.status(409).json({
        success: false,
        error: 'Pin already exists at this location',
      });
    }

    const pinLifetimeHours = parseInt(process.env.PIN_LIFETIME_HOURS || '5', 10);
    const expiresAt = moment().add(pinLifetimeHours, 'hours').toDate();

    const pin = new Pin({
      latitude,
      longitude,
      title,
      description,
      actionType,
      userId: req.userId,
      expiresAt,
    });

    await pin.save();

    // Send notifications to nearby users
    await notificationService.notifyNearbyUsers(pin, user, NOTIFICATION_RADIUS);

    res.status(201).json({
      success: true,
      data: pin,
    });
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pin',
    });
  }
});

// Delete pin (user's own pin)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) {
      return res.status(404).json({
        success: false,
        error: 'Pin not found',
      });
    }

    if (pin.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this pin',
      });
    }

    await Pin.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Pin deleted',
    });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pin',
    });
  }
});

export default router;
