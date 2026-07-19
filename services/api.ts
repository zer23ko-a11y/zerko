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

  // Check if pin exists at location
  checkPinExists: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 100
  ): Promise<Pin | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Pin | null>>(
        '/api/pins/check-exists',
        {
          params: { latitude, longitude, radiusMeters },
        }
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error checking pin existence:', error);
      return null;
    }
  },

  // Block user
  blockUser: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `/api/admin/users/${userId}/block`
      );
      return response.data.success || false;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `/api/admin/users/${userId}/unblock`
      );
      return response.data.success || false;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        '/api/admin/users'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Delete pin (admin)
  deletePinAsAdmin: async (pinId: string, reason: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(
        `/api/admin/pins/${pinId}`,
        {
          data: { reason },
        }
      );
      return response.data.success || false;
    } catch (error) {
      console.error('Error deleting pin as admin:', error);
      return false;
    }
  },
};

export default apiClient;
