import admin from 'firebase-admin';
import User from '../models/User';
import Pin from '../models/Pin';
import Notification from '../models/Notification';
import { calculateDistance } from '../utils/helpers';
import { IUser } from '../models/User';
import { IPin } from '../models/Pin';

export class NotificationService {
  private firebaseAdmin: typeof admin;

  constructor() {
    if (process.env.FIREBASE_PROJECT_ID) {
      this.initializeFirebase();
    }
  }

  private initializeFirebase() {
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
      this.firebaseAdmin = admin;
      console.log('✅ Firebase initialized for push notifications');
    } catch (error) {
      console.warn('⚠️ Firebase initialization failed. Push notifications disabled.', error);
    }
  }

  async notifyNearbyUsers(
    pin: IPin,
    creator: IUser,
    radiusKm: number
  ): Promise<void> {
    try {
      const allUsers = await User.find({ _id: { $ne: creator._id }, isBlocked: false });

      const nearbyUsers = allUsers.filter((user) => {
        // In a real app, you'd store user's last location and check distance
        // For now, we'll notify all active users
        return user.deviceTokens.length > 0;
      });

      const notificationPromises = nearbyUsers.map(async (user) => {
        const notification = new Notification({
          userId: user._id,
          pinId: pin._id,
          title: pin.title,
          body: pin.description,
          data: {
            latitude: pin.latitude,
            longitude: pin.longitude,
            actionType: pin.actionType,
          },
        });

        await notification.save();

        // Send Firebase push notification
        if (this.firebaseAdmin && user.deviceTokens.length > 0) {
          await this.sendPushNotification(
            user.deviceTokens,
            pin.title,
            pin.description,
            {
              pinId: pin._id.toString(),
              latitude: pin.latitude.toString(),
              longitude: pin.longitude.toString(),
            }
          );
        }
      });

      await Promise.all(notificationPromises);
      console.log(`📢 Notifications sent to ${nearbyUsers.length} nearby users`);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private async sendPushNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    if (!this.firebaseAdmin) return;

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await this.firebaseAdmin.messaging().sendMulticast({
        ...message,
        tokens: deviceTokens,
      });

      console.log(`✅ Push notifications sent: ${response.successCount} successful`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
