export interface WaterQualityData {
  temperature: number;
  ph: number;
  turbidity: number;
  dissolvedOxygen: number;
  conductivity: number;
  totalDissolvedSolids: number;
  wqi: number;
  timestamp: string;
}

export interface DeviceAlert {
  id?: string;
  type?: string;
  severity?: string;
  message: string;
  timestamp?: number;
  acknowledged?: boolean;
}

export interface TechnicalParameters {
  powerSource?: string;
  operatingTime?: string;
  sensorStatus?: string;
  lastCalibration?: string;
  batteryLevel?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  connectionStatus?: string;
  alerts?: (string | DeviceAlert)[];
}

export interface ServerConfig {
  deviceId: string;
  serverName: string;
}

export interface UserDevice {
  id: string;
  name?: string;
  customName?: string;
  location?: string;
  isOnline?: boolean;
  lastUpdate?: string;
  serverConfig?: ServerConfig;
  waterQuality?: WaterQualityData;
  technical?: TechnicalParameters;
}

export interface DeviceStatusResponse {
  deviceId: string;
  name: string;
  customName: string;
  serverConfig: ServerConfig;
  isOnline: boolean;
  location: string;
  lastUpdate: string;
  technical: TechnicalParameters;
  timestamp: string;
}

export interface CalibrationResponse {
  success: boolean;
  message: string;
  nextCalibrationDate: string;
}

export interface AvailableSensorsResponse {
  deviceId: string;
  sensors: Array<{
    id: string;
    name: string;
    status: string;
    lastCalibration: string;
  }>;
}