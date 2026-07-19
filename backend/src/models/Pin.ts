import mongoose, { Schema, Document } from 'mongoose';

export interface IPin extends Document {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  severity: 'low' | 'medium' | 'high';
  actionType: 'stopped' | 'sitting' | 'breathalyzer' | 'drugs';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pinSchema = new Schema<IPin>(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    actionType: {
      type: String,
      enum: ['stopped', 'sitting', 'breathalyzer', 'drugs'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index - automatically delete expired pins
pinSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Geospatial index for location queries
pinSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model<IPin>('Pin', pinSchema);
