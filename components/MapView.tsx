import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { Pin, MapRegion } from '../types';

interface GoogleMapViewProps {
  region?: MapRegion;
  pins: Pin[];
  onMarkerPress?: (pin: Pin) => void;
  onLongPress?: (event: { latitude: number; longitude: number }) => void;
}

const MAP_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  region,
  pins,
  onMarkerPress,
  onLongPress,
}) => {
  const defaultRegion: MapRegion = region || {
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        onLongPress={(event) => {
          if (onLongPress) {
            onLongPress(event.nativeEvent.coordinate);
          }
        }}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{
              latitude: pin.latitude,
              longitude: pin.longitude,
            }}
            title={pin.title}
            description={pin.description}
            onPress={() => {
              if (onMarkerPress) {
                onMarkerPress(pin);
              }
            }}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default GoogleMapView;
