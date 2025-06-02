import { CalibrationResponse, DeviceStatusResponse, UserDevice } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://192.168.1.103:1880/api'; // Node-RED API endpoints

export const useDeviceStatus = (deviceId: string) => {
  const [device, setDevice] = useState<UserDevice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeviceStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/getDeviceStatus?device=${deviceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DeviceStatusResponse = await response.json();
      
      // Transform API response to UserDevice format
      const userDevice: UserDevice = {
        id: data.deviceId,
        name: `Пристрій ${data.deviceId}`,
        location: 'Київ, Україна', // Default location
        isOnline: data.isOnline,
        lastUpdate: data.lastUpdate,
        technical: data.technical,
      };

      setDevice(userDevice);
    } catch (err) {
      console.error('Error fetching device status:', err);
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);
  const calibrateSensors = useCallback(async (): Promise<CalibrationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/calibrateSensors?device=${deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CalibrationResponse = await response.json();
      
      // Refresh device status after calibration
      if (result.success) {
        await fetchDeviceStatus();
      }
      
      return result;
    } catch (err) {
      console.error('Error calibrating sensors:', err);
      throw err;
    }
  }, [deviceId, fetchDeviceStatus]);

  const refreshData = useCallback(() => {
    fetchDeviceStatus();
  }, [fetchDeviceStatus]);

  useEffect(() => {
    fetchDeviceStatus();
  }, [fetchDeviceStatus]);

  return {
    device,
    loading,
    error,
    refreshData,
    calibrateSensors,
  };
};