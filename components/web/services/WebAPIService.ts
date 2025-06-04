
// Базовий URL для Node-RED API (порт 1880 за замовчуванням)
const NODE_RED_BASE_URL = 'http://localhost:1880/api';

export interface WaterParameters {
  pH: number;
  temperature: number;
  tds: number;
  turbidity: number;
  dissolvedOxygen?: number;
  conductivity?: number;
}

export interface WQIResponse {
  wqi: number;
  parameters: WaterParameters;
  deviceId: string;
  timestamp: string;
  status: string;
}

export interface ParameterHistoryPoint {
  timestamp: number;
  value: number;
}

export interface ParameterHistoryResponse {
  success: boolean;
  data: ParameterHistoryPoint[];
  parameter: string;
  deviceId: string;
  hoursBack: number;
}

export interface DeviceStatusResponse {
  deviceId: string;
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate: string;
  batteryLevel?: number;
  signalStrength?: number;
}

class WebAPIService {
  private static instance: WebAPIService;
  
  public static getInstance(): WebAPIService {
    if (!WebAPIService.instance) {
      WebAPIService.instance = new WebAPIService();
    }
    return WebAPIService.instance;
  }  /**
   * Отримання поточного WQI та параметрів
   */
  async getCurrentWQI(deviceId: string, allowMockData: boolean = false): Promise<WQIResponse> {
    try {
      const response = await fetch(`${NODE_RED_BASE_URL}/getWQI?device=${deviceId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        wqi: data.wqi,
        parameters: {
          pH: data.parameters?.pH,
          temperature: data.parameters?.temperature,
          tds: data.parameters?.tds,
          turbidity: data.parameters?.turbidity,
          dissolvedOxygen: data.parameters?.dissolvedOxygen,
          conductivity: data.parameters?.conductivity,
        },
        deviceId: data.deviceId || deviceId,
        timestamp: data.timestamp,
        status: data.status
      };
    } catch (error) {
      console.error('Failed to fetch current WQI:', error);
      throw error;
    }
  }
  /**
   * Отримання історичних даних для конкретного параметра
   */
  async getParameterHistory(
    deviceId: string, 
    parameter: string, 
    hours: number = 24
  ): Promise<ParameterHistoryResponse> {
    try {
      const response = await fetch(
        `${NODE_RED_BASE_URL}/getParameterHistory?device=${deviceId}&parameter=${parameter}&hours=${hours}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success,
        data: data.data,
        parameter: data.parameter || parameter,
        deviceId: data.deviceId || deviceId,
        hoursBack: data.hoursBack || hours
      };
    } catch (error) {
      console.error(`Failed to fetch ${parameter} history:`, error);
      throw error;
    }
  }
  /**
   * Отримання статусу пристрою
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
    try {
      const response = await fetch(`${NODE_RED_BASE_URL}/getDeviceStatus?device=${deviceId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        deviceId: data.deviceId || deviceId,
        status: data.status,
        lastUpdate: data.lastUpdate,
        batteryLevel: data.batteryLevel,
        signalStrength: data.signalStrength
      };
    } catch (error) {
      console.error('Failed to fetch device status:', error);
      throw error;
    }
  }
  /**
   * Отримання списку підтримуваних параметрів
   */
  async getSupportedParameters(): Promise<string[]> {
    try {
      const response = await fetch(`${NODE_RED_BASE_URL}/getSupportedParameters`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.supportedParameters;
    } catch (error) {
      console.error('Failed to fetch supported parameters:', error);
      throw error;
    }
  }
  /**
   * Калібрування датчиків
   */
  async calibrateSensors(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${NODE_RED_BASE_URL}/calibrateSensors?device=${deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Failed to calibrate sensors:', error);
      throw error;
    }
  }

  /**
   * Отримання кольору для параметра на основі його значення
   */
  getParameterColor(parameter: string, value: number): string {
    switch (parameter.toLowerCase()) {
      case 'wqi':
        if (value >= 80) return '#10b981';
        if (value >= 60) return '#3b82f6';
        if (value >= 40) return '#f59e0b';
        if (value >= 20) return '#ef4444';
        return '#dc2626';
      
      case 'ph':
        if (value >= 7.0 && value <= 7.6) return '#10b981';
        if (value >= 6.5 && value <= 8.5) return '#3b82f6';
        return '#ef4444';
      
      case 'temperature':
        if (value >= 18 && value <= 22) return '#10b981';
        if (value >= 15 && value <= 25) return '#3b82f6';
        return '#ef4444';
      
      case 'tds':
        if (value <= 300) return '#10b981';
        if (value <= 500) return '#3b82f6';
        if (value <= 800) return '#f59e0b';
        return '#ef4444';
      
      case 'turbidity':
        if (value <= 1) return '#10b981';
        if (value <= 5) return '#3b82f6';
        if (value <= 10) return '#f59e0b';
        return '#ef4444';
      
      default:
        return '#6b7280';
    }
  }
}

export default WebAPIService;
