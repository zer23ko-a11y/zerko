import { create } from 'zustand';
import { Pin } from '../types';

interface PinsStore {
  pins: Pin[];
  selectedPin: Pin | null;
  addPin: (pin: Pin) => void;
  removePin: (id: string) => void;
  updatePin: (id: string, pin: Partial<Pin>) => void;
  selectPin: (pin: Pin | null) => void;
  getPinById: (id: string) => Pin | undefined;
  getPinsByRegion: (lat: number, lon: number, radius: number) => Pin[];
}

export const usePinsStore = create<PinsStore>((set, get) => ({
  pins: [],
  selectedPin: null,

  addPin: (pin: Pin) => {
    set((state) => ({
      pins: [...state.pins, pin],
    }));
  },

  removePin: (id: string) => {
    set((state) => ({
      pins: state.pins.filter((pin) => pin.id !== id),
    }));
  },

  updatePin: (id: string, updates: Partial<Pin>) => {
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === id ? { ...pin, ...updates } : pin
      ),
    }));
  },

  selectPin: (pin: Pin | null) => {
    set({ selectedPin: pin });
  },

  getPinById: (id: string) => {
    return get().pins.find((pin) => pin.id === id);
  },

  getPinsByRegion: (lat: number, lon: number, radius: number) => {
    const { pins } = get();
    return pins.filter((pin) => {
      const distance = calculateDistance(
        lat,
        lon,
        pin.latitude,
        pin.longitude
      );
      return distance <= radius;
    });
  },
}));

// Helper function to calculate distance between two coordinates (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
