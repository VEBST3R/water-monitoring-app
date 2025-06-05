import { CalibrationResponse, DeviceStatusResponse, UserDevice } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://192.168.1.101:1880/api'; // Node-RED API endpoints

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
  }, [deviceId]);  const calibrateSensors = useCallback(async (): Promise<CalibrationResponse> => {
    console.log('🔧 calibrateSensors called for device:', deviceId);
    try {
      const url = `${API_BASE_URL}/calibrateSensors?device=${deviceId}`;
      console.log('📡 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Обробка помилок HTTP
      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          return {
            success: false,
            message: errorData.message || 'Калібрування вже було проведено для цього пристрою недавно',
            errorCode: 'ALREADY_CALIBRATED',
            nextCalibrationDate: errorData.nextCalibrationDate
          };
        } else if (response.status === 404) {
          return {
            success: false,
            message: 'Пристрій з таким ID не знайдено',
            errorCode: 'DEVICE_NOT_FOUND'
          };
        } else if (response.status === 400) {
          return {
            success: false,
            message: 'Некоректний ID пристрою або параметри запиту',
            errorCode: 'INVALID_PARAMS'
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);      }

      const result: CalibrationResponse = await response.json();
      console.log('📋 Parsed calibration result:', result);
      
      // Refresh device status after calibration
      if (result.success) {
        console.log('✅ Calibration successful, refreshing device status...');
        await fetchDeviceStatus();
      }
      
      return result;
    } catch (err) {
      console.error('Error calibrating sensors:', err);
      return {
        success: false,
        message: err instanceof Error 
          ? `Помилка під час калібрування датчиків: ${err.message}` 
          : 'Невідома помилка під час калібрування датчиків',
        errorCode: 'UNKNOWN_ERROR'
      };
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