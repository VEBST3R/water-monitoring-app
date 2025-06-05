import { UserDevice } from '@/types';
import { getWaterQualityColor } from '@/utils/colorUtils';
import { getFromStorage, saveToStorage } from '@/utils/storageUtils';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import DeviceStatusView from '../DeviceStatusView';
import WebAPIService, { WQIResponse, WaterParameters } from './services/WebAPIService';
import WebDeviceManager from './WebDeviceManager';
import WebInteractiveCharts from './WebInteractiveCharts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WebDashboardProps {
  userDevices: UserDevice[];
  currentDeviceIndex: number;
  score: number;
  detailedParams: any;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'loading';
  lastUpdateTimestamp: number | null;
  onDeviceChange: (index: number) => void;
  onAddDevice: () => Promise<void>;
  onDeleteDevice: (deviceId: string) => void;
  onDevicesUpdate: (devices: UserDevice[]) => void;
  updateCurrentDeviceData: () => void;
}

const WebDashboard: React.FC<WebDashboardProps> = ({
  userDevices,
  currentDeviceIndex,
  score,
  detailedParams,
  connectionStatus,
  lastUpdateTimestamp,
  onDeviceChange,
  onAddDevice,
  onDeleteDevice,
  onDevicesUpdate,
  updateCurrentDeviceData,
}) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [nextUpdateTimer, setNextUpdateTimer] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'deviceStatus'>('overview');
  const [realTimeData, setRealTimeData] = useState<WQIResponse | null>(null);
  const [isRealTimeLoading, setIsRealTimeLoading] = useState(false);
  
  const apiService = WebAPIService.getInstance();
  const currentDevice = userDevices[currentDeviceIndex];
  const deviceId = currentDevice?.serverConfig?.deviceId || '111001';
  useEffect(() => {
    loadThemePreference();
    
    // Не завантажуємо дані, якщо немає пристроїв
    if (userDevices.length === 0) {
      setNextUpdateTimer(0);
      return;
    }

    loadRealTimeData();
      const timer = setInterval(() => {
      setNextUpdateTimer(prev => {
        if (prev <= 1) {
          if (userDevices.length > 0) {
            updateCurrentDeviceData();
            loadRealTimeData();
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [updateCurrentDeviceData, deviceId, userDevices.length]);
  const loadThemePreference = async () => {
    try {
      const savedTheme = await getFromStorage('@theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };const loadRealTimeData = async () => {
    // Не завантажуємо дані, якщо немає пристроїв
    if (userDevices.length === 0) {
      setRealTimeData(null);
      return;
    }

    setIsRealTimeLoading(true);
    try {
      // Тепер дані беруться ТІЛЬКИ з сервера, без fallback
      const data = await apiService.getCurrentWQI(deviceId, false);
      setRealTimeData(data);
    } catch (error) {
      console.error('Failed to load real-time data:', error);
      setRealTimeData(null);
    } finally {
      setIsRealTimeLoading(false);
    }
  };
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await saveToStorage('@theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Ніколи';
    return new Date(timestamp).toLocaleTimeString('uk-UA');
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'З\'єднано';
      case 'loading': return 'Підключення...';
      case 'error': return 'Помилка з\'єднання';
      default: return 'Відключено';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10B981';
      case 'loading': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };  // Використовуємо дані з API, якщо доступні, інакше показуємо помилку підключення
  const displayData = realTimeData || {
    wqi: 0,
    parameters: {} as WaterParameters,
    deviceId,
    timestamp: new Date().toISOString(),
    status: 'offline'
  };

  // Якщо немає даних з сервера, показуємо повідомлення про помилку
  const isServerUnavailable = !realTimeData && !isRealTimeLoading && userDevices.length > 0;

  // Якщо немає пристроїв, показуємо відповідний стан
  if (userDevices.length === 0) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
              🌊 Моніторинг якості води
            </Text>
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
              <Text style={[styles.statusText, isDarkMode && styles.darkText]}>
                Немає пристроїв
              </Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateTitle, isDarkMode && styles.darkText]}>
            Немає підключених пристроїв
          </Text>
          <Text style={[styles.emptyStateDescription, isDarkMode && styles.darkSubText]}>
            Додайте свій перший пристрій моніторингу води, щоб почати відстеження якості води
          </Text>
          <WebDeviceManager
            userDevices={userDevices}
            currentDeviceIndex={currentDeviceIndex}
            isDarkMode={isDarkMode}
            onDeviceChange={onDeviceChange}
            onDevicesUpdate={onDevicesUpdate}
            onAddDevice={onAddDevice}
            onDeleteDevice={onDeleteDevice}
          />
        </View>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'charts':
        return (
          <WebInteractiveCharts
            deviceId={deviceId}
            isDarkMode={isDarkMode}
            currentParams={displayData.parameters}
            wqiValue={displayData.wqi} // Pass WQI score
          />
        );        case 'deviceStatus':
        return (
          <DeviceStatusView
            device={currentDevice}
            isDarkMode={isDarkMode}
          />
        );
      
      default: // overview
        return renderOverview();
    }
  };
  const renderOverview = () => (
    <>
      {/* Server Status Warning */}
      {isServerUnavailable && (
        <View style={[styles.warningCard, isDarkMode && styles.darkWarningCard]}>
          <Text style={[styles.warningTitle, isDarkMode && styles.darkText]}>
            ⚠️ Сервер недоступний
          </Text>
          <Text style={[styles.warningText, isDarkMode && styles.darkSubText]}>
            Не вдалося підключитися до сервера для отримання даних. Перевірте підключення до інтернету та доступність серверу.
          </Text>
        </View>
      )}

      {/* WQI Score Card */}
      <View style={[styles.scoreCard, isDarkMode && styles.darkCard]}>
        <Text style={[styles.scoreTitle, isDarkMode && styles.darkText]}>
          Індекс якості води (WQI)
        </Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getWaterQualityColor(displayData.wqi) }]}>
            {realTimeData ? Math.round(displayData.wqi) : '--'}
          </Text>
          <View style={[styles.scoreBar, isDarkMode && styles.darkScoreBar]}>
            <View 
              style={[
                styles.scoreBarFill, 
                { 
                  width: realTimeData ? `${Math.min(displayData.wqi, 100)}%` : '0%',
                  backgroundColor: getWaterQualityColor(displayData.wqi)
                }
              ]} 
            />
          </View>
          <Text style={[styles.scoreDescription, isDarkMode && styles.darkSubText]}>
            {realTimeData ? (
              displayData.wqi >= 80 ? 'Відмінна якість' : 
              displayData.wqi >= 60 ? 'Хороша якість' : 
              displayData.wqi >= 40 ? 'Задовільна якість' : 
              displayData.wqi >= 20 ? 'Погана якість' : 'Дуже погана якість'
            ) : 'Дані недоступні'}
          </Text>
        </View>
        {isRealTimeLoading && (
          <Text style={[styles.loadingIndicator, isDarkMode && styles.darkSubText]}>
            🔄 Оновлення даних...
          </Text>
        )}
      </View>

      {/* Parameters Grid */}
      <View style={styles.parametersGrid}>
        {Object.entries({
          'pH': { value: displayData.parameters.pH, unit: '', good: [6.5, 8.5] },
          'Температура': { value: displayData.parameters.temperature, unit: '°C', good: [15, 25] },
          'TDS': { value: displayData.parameters.tds, unit: 'мг/л', good: [0, 500] },
          'Каламутність': { value: displayData.parameters.turbidity, unit: 'NTU', good: [0, 5] },
          'Кисень': { value: displayData.parameters.dissolvedOxygen, unit: 'мг/л', good: [5, 14] },
          'Провідність': { value: displayData.parameters.conductivity, unit: 'мкС/см', good: [0, 1000] }
        }).map(([name, param]) => {
          if (param.value === undefined || param.value === null) return null;
          
          const isGood = param.value >= param.good[0] && param.value <= param.good[1];
          return (
            <View key={name} style={[styles.parameterCard, isDarkMode && styles.darkCard]}>
              <Text style={[styles.parameterName, isDarkMode && styles.darkSubText]}>
                {name}
              </Text>
              <Text style={[
                styles.parameterValue, 
                { color: isGood ? '#10B981' : '#EF4444' }
              ]}>
                {typeof param.value === 'number' ? param.value.toFixed(1) : param.value} {param.unit}
              </Text>
              <View style={styles.parameterIndicator}>
                <View 
                  style={[
                    styles.parameterDot, 
                    { backgroundColor: isGood ? '#10B981' : '#EF4444' }
                  ]} 
                />
                <Text style={[styles.parameterStatus, isDarkMode && styles.darkSubText]}>
                  {isGood ? 'Норма' : 'Увага'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={[styles.controlsTitle, isDarkMode && styles.darkText]}>
          Наступне оновлення через: {nextUpdateTimer}с
        </Text>
        <View style={styles.controlsButtons}>          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => {
              if (userDevices.length > 0) {
                updateCurrentDeviceData();
                loadRealTimeData();
              }
            }}
            disabled={isRealTimeLoading || userDevices.length === 0}
          >
            <Text style={styles.buttonText}>
              {isRealTimeLoading ? '🔄 Оновлення...' : '🔄 Оновити зараз'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, isDarkMode && styles.darkSecondaryButton]} 
            onPress={toggleTheme}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText, isDarkMode && styles.darkText]}>
              {isDarkMode ? '☀️ Світла тема' : '🌙 Темна тема'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Device Info */}
      {userDevices.length > 0 && (
        <View style={[styles.deviceInfo, isDarkMode && styles.darkCard]}>
          <Text style={[styles.deviceInfoTitle, isDarkMode && styles.darkText]}>
            Пристрій: {userDevices[currentDeviceIndex]?.customName || 'Невідомий'}
          </Text>
          <Text style={[styles.deviceInfoId, isDarkMode && styles.darkSubText]}>
            ID: {deviceId}
          </Text>
          {realTimeData && (
            <Text style={[styles.deviceInfoId, isDarkMode && styles.darkSubText]}>
              API статус: {realTimeData.status}
            </Text>
          )}
        </View>
      )}
    </>
  );
  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            🌊 Моніторинг якості води
          </Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
            <Text style={[styles.statusText, isDarkMode && styles.darkText]}>
              {getConnectionStatusText()}
            </Text>
            {realTimeData && (
              <Text style={[styles.apiStatus, isDarkMode && styles.darkSubText]}>
                • Node-RED API активний
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.deviceName, isDarkMode && styles.darkText]}>
            {userDevices[currentDeviceIndex]?.customName || userDevices[currentDeviceIndex]?.name || 'Невідомий пристрій'}
          </Text>
          <Text style={[styles.updateTime, isDarkMode && styles.darkSubText]}>
            Останнє оновлення: {formatTime(lastUpdateTimestamp)}
          </Text>
        </View>
      </View>

      {/* Main Layout: Two Columns */}
      <View style={styles.mainLayout}>
        {/* Left Panel: Device Manager */}
        <View style={[styles.leftPanel, isDarkMode && styles.darkLeftPanel]}>
          <WebDeviceManager
            userDevices={userDevices}
            currentDeviceIndex={currentDeviceIndex}
            isDarkMode={isDarkMode}
            onDeviceChange={onDeviceChange}
            onDevicesUpdate={onDevicesUpdate}
            onAddDevice={onAddDevice}
            onDeleteDevice={onDeleteDevice}
          />
        </View>

        {/* Right Panel: Main Content */}
        <View style={styles.rightPanel}>
          {/* Tab Navigation */}
          <View style={[styles.tabNavigation, isDarkMode && styles.darkTabNavigation]}>            {[
              { key: 'overview', label: '📊 Огляд', icon: '📊' },
              { key: 'charts', label: '📈 Графіки', icon: '📈' },
              { key: 'deviceStatus', label: '🔧 Статус пристрою', icon: '🔧' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                  isDarkMode && styles.tabButtonDark
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.tabButtonTextActive,
                  isDarkMode && activeTab !== tab.key && styles.darkText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderTabContent()}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  } as ViewStyle,
  darkContainer: {
    backgroundColor: '#111827',
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  } as TextStyle,
  darkText: {
    color: '#f9fafb',
  } as TextStyle,
  darkSubText: {
    color: '#9ca3af',
  } as TextStyle,
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  } as ViewStyle,
  darkHeader: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  } as TextStyle,
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  } as ViewStyle,
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  } as TextStyle,
  headerRight: {
    alignItems: 'flex-end',
  } as ViewStyle,
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  } as TextStyle,
  updateTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  } as TextStyle,
  content: {
    flex: 1,
    padding: 20,
  } as ViewStyle,
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  } as ViewStyle,
  darkCard: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  } as ViewStyle,
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
    textAlign: 'center',
  } as TextStyle,
  scoreContainer: {
    alignItems: 'center',
  } as ViewStyle,
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  } as TextStyle,
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  } as ViewStyle,
  darkScoreBar: {
    backgroundColor: '#374151',
  } as ViewStyle,
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  } as ViewStyle,
  scoreDescription: {
    fontSize: 14,
    color: '#6b7280',
  } as TextStyle,
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  } as ViewStyle,
  parameterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    margin: 10,
    width: '30%',
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  } as ViewStyle,
  parameterName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 5,
  } as TextStyle,
  parameterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  } as TextStyle,
  parameterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  parameterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  } as ViewStyle,
  parameterStatus: {
    fontSize: 12,
    color: '#6b7280',
  } as TextStyle,
  controls: {
    marginTop: 30,
    alignItems: 'center',
  } as ViewStyle,
  controlsTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 15,
  } as TextStyle,
  controlsButtons: {
    flexDirection: 'row',
    gap: 15,
  } as ViewStyle,
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#ffffff',
  } as TextStyle,
  primaryButton: {
    backgroundColor: '#007AFF',
  } as ViewStyle,
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  } as ViewStyle,
  secondaryButtonText: {
    color: '#374151',
  } as TextStyle,
  darkSecondaryButton: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  } as ViewStyle,
  deviceInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  } as ViewStyle,
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 5,
  } as TextStyle,
  deviceInfoId: {
    fontSize: 14,
    color: '#6b7280',
  } as TextStyle,
  analyticsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,
  analyticsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  } as TextStyle,
  analyticsDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  } as TextStyle,
  loadingIndicator: {
    marginLeft: 10,
  } as TextStyle,
  apiStatus: {
    fontSize: 12,
    color: '#6b7280',
  } as TextStyle,
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  } as ViewStyle,
  darkTabNavigation: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  } as ViewStyle,
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10, // Adjusted for spacing
    marginHorizontal: 4, // Added for spacing
    borderRadius: 8,
    minHeight: 44, // Ensure consistent height
    // gap: 8, // Can be used if preferred over margin/padding for icon-text spacing
  } as ViewStyle,
  tabButtonActive: {
    backgroundColor: '#3b82f6', // Active tab background
    // No separate dark mode active, color is set directly
  } as ViewStyle,
  tabButtonDark: {
    // backgroundColor: '#1f2937', // Keep dark tabs distinct if needed
  } as ViewStyle,
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  } as TextStyle,
  tabButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  } as TextStyle,
  // New styles for two-column layout
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  } as ViewStyle,
  leftPanel: {
    width: 320,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 15,
  } as ViewStyle,
  darkLeftPanel: {
    backgroundColor: '#1f2937',
    borderRightColor: '#374151',
  } as ViewStyle,
  rightPanel: {
    flex: 1,
    flexDirection: 'column',
  } as ViewStyle,
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  } as TextStyle,
  emptyStateDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 400,
  } as TextStyle,
  
  // Warning card styles
  warningCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  } as ViewStyle,
  darkWarningCard: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  } as ViewStyle,
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  } as TextStyle,
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  } as TextStyle,
};

export default WebDashboard;
