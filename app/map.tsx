import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GoogleMapView } from '../components/MapView';
import { PinDialog } from '../components/PinDialog';
import { usePinsStore } from '../stores/pinsStore';
import { useLocation } from '../hooks/useLocation';
import { Pin, MapRegion } from '../types';
import { pinsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { calculateDistance } from '../utils/helpers';

const MapScreen: React.FC = () => {
  const { location, loading: locationLoading } = useLocation();
  const { pins, addPin, selectPin, selectedPin, removePin } = usePinsStore();
  const { user, isCurrentUserAdmin } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyPinDistance] = useState(100); // meters - distance threshold for duplicate pins

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      loadPins();
    }
  }, [location]);

  // Setup auto-delete timer for pins (5 hours = 18000000 ms)
  useEffect(() => {
    const PIN_LIFETIME = 5 * 60 * 60 * 1000; // 5 hours

    const timers = pins.map((pin) => {
      const createdTime = new Date(pin.timestamp).getTime();
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - createdTime;
      const timeUntilDelete = PIN_LIFETIME - elapsedTime;

      if (timeUntilDelete <= 0) {
        // Pin has already expired
        removePin(pin.id);
        pinsApi.deletePin(pin.id);
        return null;
      }

      return setTimeout(() => {
        removePin(pin.id);
        pinsApi.deletePin(pin.id);
      }, timeUntilDelete);
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [pins, removePin]);

  const loadPins = async () => {
    try {
      setLoading(true);
      if (location) {
        const nearbyPins = await pinsApi.getPinsByRegion(
          location.latitude,
          location.longitude,
          5 // 5km radius
        );
        nearbyPins.forEach(pin => addPin(pin));
      }
    } catch (error) {
      console.error('Error loading pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPin = (latitude: number, longitude: number): Pin | null => {
    // Check if there's already a pin within the nearby pin distance threshold
    return pins.find((pin) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        pin.latitude,
        pin.longitude
      );
      return distance <= nearbyPinDistance / 1000; // Convert meters to km
    }) || null;
  };

  const handleLongPress = (coordinate: { latitude: number; longitude: number }) => {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to report incidents');
      return;
    }

    // Check if pin already exists at this location
    const existingPin = checkExistingPin(coordinate.latitude, coordinate.longitude);
    if (existingPin) {
      Alert.alert(
        'Pin već postavljen',
        'Na ovoj lokaciji je već postavljen pin. Čekaj da istekne prije nego što možeš dodati novi report na istoj lokaciji.',
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
      return;
    }

    setSelectedCoordinates(coordinate);
    setShowDialog(true);
  };

  const handlePinCreate = async (actionType: string, description: string) => {
    if (!selectedCoordinates || !user) return;

    // Double-check no pin exists at this location (race condition check)
    const existingPin = checkExistingPin(selectedCoordinates.latitude, selectedCoordinates.longitude);
    if (existingPin) {
      Alert.alert(
        'Pin već postavljen',
        'Na ovoj lokaciji je već postavljen pin. Čekaj da istekne prije nego što možeš dodati novi report na istoj lokaciji.'
      );
      setShowDialog(false);
      setSelectedCoordinates(null);
      return;
    }

    const newPin: Omit<Pin, 'id'> = {
      latitude: selectedCoordinates.latitude,
      longitude: selectedCoordinates.longitude,
      title: `Police Stop - ${actionType}`,
      description: description,
      timestamp: new Date(),
      severity: 'medium',
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    };

    try {
      setLoading(true);
      const createdPin = await pinsApi.createPin(newPin);
      if (createdPin) {
        addPin(createdPin);
        Alert.alert('Success', 'Report submitted successfully');
        setShowDialog(false);
        setSelectedCoordinates(null);
      }
    } catch (error) {
      console.error('Error creating pin:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (pin: Pin) => {
    selectPin(pin);
    const expiresAt = pin.expiresAt ? new Date(pin.expiresAt) : null;
    const timeRemaining = expiresAt ? Math.max(0, expiresAt.getTime() - Date.now()) : null;
    const hoursRemaining = timeRemaining ? Math.ceil(timeRemaining / (60 * 60 * 1000)) : null;

    const description = pin.description + (hoursRemaining ? `\n\nIstječe za: ${hoursRemaining}h` : '');

    const isOwner = user?.id === pin.userId;
    const isAdmin = isCurrentUserAdmin();

    Alert.alert(
      pin.title,
      description,
      [
        {
          text: 'Close',
          onPress: () => selectPin(null),
        },
        ...(isOwner || isAdmin
          ? [
              {
                text: 'Delete',
                onPress: () => {
                  if (isAdmin) {
                    Alert.alert(
                      'Delete Report',
                      'As admin, are you sure you want to delete this report?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            removePin(pin.id);
                            pinsApi.deletePin(pin.id);
                            selectPin(null);
                          },
                        },
                      ]
                    );
                  } else {
                    removePin(pin.id);
                    pinsApi.deletePin(pin.id);
                    selectPin(null);
                  }
                },
                style: 'destructive' as const,
              },
            ]
          : []),
        ...(isAdmin
          ? [
              {
                text: 'Block User',
                onPress: () => {
                  Alert.alert(
                    'Block User',
                    `Are you sure you want to block user ${pin.userId}?\n\nBlocked users cannot post reports.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Block',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await pinsApi.blockUser(pin.userId || '');
                            Alert.alert('Success', 'User has been blocked');
                            selectPin(null);
                          } catch (error) {
                            Alert.alert('Error', 'Failed to block user');
                          }
                        },
                      },
                    ]
                  );
                },
              },
            ]
          : []),
      ]
    );
  };

  if (locationLoading || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleMapView
        region={mapRegion}
        pins={pins}
        onMarkerPress={handleMarkerPress}
        onLongPress={handleLongPress}
      />
      {showDialog && selectedCoordinates && (
        <PinDialog
          visible={showDialog}
          onClose={() => setShowDialog(false)}
          onSubmit={handlePinCreate}
          isLoading={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});

export default MapScreen;
