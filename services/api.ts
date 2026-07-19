import axios, { AxiosInstance } from 'axios';
import { Pin, ApiResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pinsApi = {
  // Get all pins
  getAllPins: async (): Promise<Pin[]> => {
    const response = await apiClient.get<ApiResponse<Pin[]>>('/api/pins');
    return response.data.data || [];
  },

  // Get pins by region
  getPinsByRegion: async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<Pin[]> => {
    const response = await apiClient.get<ApiResponse<Pin[]>>(
      `/api/pins/region`,
      {
        params: { latitude, longitude, radius },
      }
    );
    return response.data.data || [];
  },

  // Get single pin
  getPin: async (id: string): Promise<Pin | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Pin>>(`/api/pins/${id}`);
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Create pin
  createPin: async (pin: Omit<Pin, 'id'>): Promise<Pin | null> => {
    try {
      const response = await apiClient.post<ApiResponse<Pin>>(
        '/api/pins',
        pin
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error creating pin:', error);
      return null;
    }
  },

  // Update pin
  updatePin: async (id: string, updates: Partial<Pin>): Promise<Pin | null> => {
    try {
      const response = await apiClient.patch<ApiResponse<Pin>>(
        `/api/pins/${id}`,
        updates
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error updating pin:', error);
      return null;
    }
  },

  // Delete pin
  deletePin: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/pins/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting pin:', error);
      return false;
    }
  },
};

export default apiClient;
