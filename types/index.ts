export interface Pin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high';
  userId?: string;
  imageUrl?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
