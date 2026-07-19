import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Location as LocationType } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getLocation = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission denied');
          setLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({});
        if (mounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy || undefined,
            altitude: currentLocation.coords.altitude || undefined,
          });
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    };

    getLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return { location, error, loading };
};
