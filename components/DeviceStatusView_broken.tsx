import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';
import { UserDevice } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface DeviceStatusViewProps {
  device: UserDevice | null | undefined;
  isDarkMode?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const DeviceStatusView: React.FC<DeviceStatusViewProps> = ({ device, isDarkMode = false }) => {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - BEFORE ANY CONDITIONAL LOGIC
  const pressScale = useSharedValue(1);
  const [refreshing, setRefreshing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  // Use the device status hook with the device ID from serverConfig
  const deviceId = device?.serverConfig?.deviceId || '111001'; // Default to first simulated device
  console.log('🔍 DeviceStatusView rendered with deviceId:', deviceId, 'device:', device);
  
  const {
    device: deviceData,
    loading,
    error,
    refreshData,
    calibrateSensors: calibrateDevice,
  } = useDeviceStatus(deviceId);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });
  // Function definitions after hooks
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.log('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };  const handleCalibratePress = async () => {
    console.log('🔧 Calibrate button pressed, deviceId:', deviceId);
    
    if (!deviceId) {
      console.log('❌ Calibration blocked: no device ID');
      if (Platform.OS === 'web') {
        alert("Помилка: Неможливо виконати калібрування: відсутній ID пристрою");
      } else {
        Alert.alert("Помилка", "Неможливо виконати калібрування: відсутній ID пристрою");
      }
      return;
    }

    console.log('✅ Device ID valid, showing confirmation dialog');

    // Show web-compatible confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = confirm("Ви впевнені, що хочете запустити калібрування всіх датчиків? Це може зайняти кілька хвилин.");
      if (confirmed) {
        await performCalibration();
      }
    } else {
      setShowCalibrationDialog(true);
    }
  };

  const performCalibration = async () => {
    console.log('🚀 Starting calibration process...');
    try {
      setIsCalibrating(true);
      console.log('📡 Calling calibrateDevice function...');
      
      const result = await calibrateDevice();
      console.log('📋 Calibration result:', result);
      
      setIsCalibrating(false);
      
      if (result?.success) {
        console.log('✅ Calibration successful');
        const successMessage = result.message || "Калібрування успішно завершено. Наступне калібрування рекомендовано: " + 
          (result.nextCalibrationDate || "через 30 днів");
        
        if (Platform.OS === 'web') {
          alert("Успіх: " + successMessage);
        } else {
          Alert.alert("Успіх", successMessage, [
            { text: "ОК", onPress: () => refreshData() }
          ]);
        }
        refreshData();
      } else {
        console.log('❌ Calibration failed with error code:', result?.errorCode);
        let title = "Помилка";
        let message = result?.message || "Не вдалося виконати калібрування. Перевірте підключення пристрою.";
        
        if (result?.errorCode === 'ALREADY_CALIBRATED') {
          title = "Інформація";
          message = `${result.message}. Наступне калібрування рекомендовано: ${result.nextCalibrationDate || "через 30 днів"}`;
        } else if (result?.errorCode === 'DEVICE_NOT_FOUND') {
          message = "Пристрій з таким ID не знайдено в системі.";
        } else if (result?.errorCode === 'MAINTENANCE_MODE') {
          message = "Пристрій у режимі обслуговування. Спробуйте пізніше.";
        } else if (result?.errorCode === 'SENSORS_ERROR') {
          message = "Помилка датчиків під час калібрування. Зверніться до сервісного центру.";
        }
        
        if (Platform.OS === 'web') {
          alert(title + ": " + message);
        } else {
          Alert.alert(title, message);
        }
      }
    } catch (err) {
      console.error("🚨 Calibration error:", err);
      setIsCalibrating(false);
      const errorMessage = "Не вдалося підключитися до сервера для калібрування. Перевірте мережеве з'єднання та спробуйте знову.";
      
      if (Platform.OS === 'web') {
        alert("Помилка: " + errorMessage);
      } else {
        Alert.alert("Помилка", errorMessage);
      }    }
  };
  
  // NOW IT'S SAFE TO DO EARLY RETURNS AFTER ALL HOOKS
  if (!device && !deviceData) {
    return (
      <View style={[styles.scrollContentContainer, styles.centered, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <ThemedText style={isDarkMode && { color: Colors.dark.text }}>Немає даних про пристрій</ThemedText>
      </View>
    );
  }
  // Раннє завантаження - до початку рендерингу
  if (loading && !deviceData) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? Colors.dark.tint : Colors.light.tint} />
        <ThemedText style={[styles.loadingText, isDarkMode && { color: Colors.dark.text }]}>Отримання даних про пристрій...</ThemedText>
      </View>
    );
  } else if (error) {
    return (
      <View style={[styles.errorContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
        <ThemedText style={[styles.errorText, isDarkMode && { color: Colors.dark.text }]}>Помилка завантаження даних</ThemedText>
        <TouchableOpacity style={[styles.retryButton, isDarkMode && { backgroundColor: Colors.dark.tint }]} onPress={refreshData}>
          <ThemedText style={styles.retryButtonText}>Спробувати знову</ThemedText>
        </TouchableOpacity>      </View>
    );
  }
  
  // Use API data if available, otherwise fall back to props
  const currentDevice = deviceData || device;
  const technical = currentDevice?.technical;
  const buttonDiameter = 200; // Button size increased 2.5 times (100 * 2.5)
  const iconSize = buttonDiameter * 0.35; // Icon size
    return (
    <View style={[styles.outerContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContentContainer, isDarkMode && { backgroundColor: '#0f172a' }]
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[isDarkMode ? Colors.dark.tint : Colors.light.tint]}
            tintColor={isDarkMode ? Colors.dark.tint : Colors.light.tint}
          />
        }
      >
        <ThemedText type="title" style={[styles.title, isDarkMode && { color: Colors.dark.text }]}>Статус пристрою</ThemedText>
          {/* Основна інформація */}
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: '#1f2937' }]}
        >
          <View style={[styles.cardHeader, isDarkMode && { borderBottomColor: Colors.dark.tabIconDefault }]}
          >
            <Ionicons name="information-circle-outline" size={24} color={isDarkMode ? Colors.dark.tint : Colors.light.tint} />
            <ThemedText type="subtitle" style={[styles.cardTitle, isDarkMode && { color: Colors.dark.text }]}>Основна інформація</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="hardware-chip-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Назва пристрою:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{device?.name || device?.customName || 'Невідомий пристрій'}</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="barcode-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>ID пристрою:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{deviceId}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="location-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Розташування:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{currentDevice?.location || 'Не вказано'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="wifi-outline" size={20} color={currentDevice?.isOnline ? '#4CAF50' : '#F44336'} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Статус:</ThemedText>
            <ThemedText style={[styles.value, {color: currentDevice?.isOnline ? '#4CAF50' : '#F44336'}]}>
              {currentDevice?.isOnline ? 'Онлайн' : 'Офлайн'}
            </ThemedText>
          </View>
        </View>        {/* Технічні характеристики */}
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: '#1f2937' }]}
        >
          <View style={[styles.cardHeader, isDarkMode && { borderBottomColor: Colors.dark.tabIconDefault }]}
          >
            <Ionicons name="cog-outline" size={24} color={isDarkMode ? Colors.dark.tint : Colors.light.tint} />
            <ThemedText type="subtitle" style={[styles.cardTitle, isDarkMode && { color: Colors.dark.text }]}>Технічні характеристики</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="power-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Тип живлення:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{technical?.powerSource || 'Невідомо'}</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="time-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Час роботи:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{technical?.operatingTime || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="battery-half-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Рівень батареї:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}
            >
              {technical?.batteryLevel ? `${technical.batteryLevel}%` : 'Невідомо'}
            </ThemedText>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="pulse-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Ping:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}
            >
              {technical?.ping ? `${technical.ping} ms` : 'Невідомо'}
            </ThemedText>
          </View>
        </View>        {/* Датчики та обслуговування */}
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: '#1f2937' }]}
        >
          <View style={[styles.cardHeader, isDarkMode && { borderBottomColor: Colors.dark.tabIconDefault }]}
          >
            <Ionicons name="settings-outline" size={24} color={isDarkMode ? Colors.dark.tint : Colors.light.tint} />
            <ThemedText type="subtitle" style={[styles.cardTitle, isDarkMode && { color: Colors.dark.text }]}>Датчики та обслуговування</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="checkmark-circle-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Статус датчиків:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{technical?.sensorStatus || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="calendar-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Останнє калібрування:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{technical?.lastCalibration || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="build-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Версія прошивки:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{technical?.firmwareVersion || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="refresh-outline" size={20} color={isDarkMode ? Colors.dark.text : Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={[styles.label, isDarkMode && { color: Colors.dark.text }]}>Останнє оновлення:</ThemedText>
            <ThemedText style={[styles.value, isDarkMode && { color: Colors.dark.icon }]}>{currentDevice?.lastUpdate || 'Невідомо'}</ThemedText>
          </View>
        </View>

        {/* Попередження (якщо є) */}
        {technical?.alerts && technical.alerts.length > 0 && (
          <View style={[
            styles.alertsCard, 
            isDarkMode && { 
              backgroundColor: '#451a03', 
              borderLeftColor: '#d97706'
            }
          ]}>
            <View style={[styles.cardHeader, isDarkMode && { borderBottomColor: '#d97706' }]}>
              <Ionicons name="warning-outline" size={24} color={isDarkMode ? '#d97706' : '#FF9800'} />
              <ThemedText type="subtitle" style={[
                styles.cardTitle, 
                {color: isDarkMode ? '#d97706' : '#FF9800'}
              ]}>Попередження</ThemedText>
            </View>
            {technical.alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Ionicons name="alert-circle-outline" size={16} color={isDarkMode ? '#d97706' : '#FF9800'} style={styles.alertIcon} />
                <ThemedText style={[
                  styles.alertText,
                  isDarkMode && {color: '#d97706'}
                ]}>
                  {typeof alert === 'string' ? alert : (alert as any)?.message || 'Невідоме попередження'}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Кнопка калібрування */}
        <View style={styles.buttonContainer}>          <AnimatedTouchableOpacity 
            style={[
              styles.calibrateButton, 
              {width: buttonDiameter, height: buttonDiameter, borderRadius: buttonDiameter/2}, 
              animatedButtonStyle,
              isDarkMode && { backgroundColor: '#333', shadowOpacity: 0.5 },
              isCalibrating && { opacity: 0.8, backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }
            ]} 
            onPress={handleCalibratePress}
            activeOpacity={0.8}
            disabled={isCalibrating}
          >
            {isCalibrating ? (
              <>
                <ActivityIndicator 
                  size="large" 
                  color={isDarkMode ? Colors.dark.tint : Colors.light.tint} 
                  style={{ marginBottom: 10 }}
                />
                <ThemedText style={[
                  styles.calibrateButtonText,
                  isDarkMode && { color: '#fff' }
                ]}>{"Калібрування\nв процесі..."}</ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="construct" size={iconSize} color={isDarkMode ? '#fff' : 'black'} />
                <ThemedText style={[
                  styles.calibrateButtonText,
                  isDarkMode && { color: '#fff' }
                ]}>{"Калібрування\nдатчиків"}</ThemedText>
              </>
            )}
          </AnimatedTouchableOpacity>        </View>
      </ScrollView>
      
      {/* Confirmation Modal for native platforms */}
      <Modal
        visible={showCalibrationDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalibrationDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && { backgroundColor: '#1f2937' }]}>
            <ThemedText style={[styles.modalTitle, isDarkMode && { color: Colors.dark.text }]}>
              Калібрування датчиків
            </ThemedText>
            <ThemedText style={[styles.modalMessage, isDarkMode && { color: Colors.dark.text }]}>
              Ви впевнені, що хочете запустити калібрування всіх датчиків? Це може зайняти кілька хвилин.
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCalibrationDialog(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Скасувати</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, isDarkMode && { backgroundColor: Colors.dark.tint }]}
                onPress={() => {
                  setShowCalibrationDialog(false);
                  performCalibration();
                }}
              >
                <ThemedText style={styles.confirmButtonText}>Калібрувати</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { 
    flex: 1,
    backgroundColor: 'transparent', // Ensure this view is transparent
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: { 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 80, // Added significant paddingTop
    paddingBottom: 40, // Reduced since button is now inside ScrollView
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 25,
    textAlign: 'center',
    color: Colors.light.text,
  },
  infoCard: {
    backgroundColor: Colors.light.background, 
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 10,
  },
  infoSection: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    color: Colors.light.text,
    flexShrink: 1, 
  },
  value: {
    fontSize: 16,
    color: Colors.light.icon, 
    marginLeft: 5,
    flex: 1, 
    textAlign: 'right',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },  calibrateButton: {
    // position removed - now relative positioning inside ScrollView
    backgroundColor: 'white', // White fill for the button center
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow styles matching ScoreCircle
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  calibrateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
    marginTop: 5,
  },retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  alertsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    lineHeight: 20,
  },  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: Colors.light.tint,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default DeviceStatusView;
