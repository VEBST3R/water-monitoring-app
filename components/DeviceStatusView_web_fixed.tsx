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

interface DeviceStatusViewProps {
  device: UserDevice | null | undefined;
  isDarkMode?: boolean;
}

const DeviceStatusView: React.FC<DeviceStatusViewProps> = ({ device, isDarkMode = false }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  
  const deviceId = device?.serverConfig?.deviceId || '111001';
  console.log('🔍 DeviceStatusView rendered with deviceId:', deviceId, 'device:', device);
  
  const {
    device: deviceData,
    loading,
    error,
    refreshData,
    calibrateSensors: calibrateDevice,
  } = useDeviceStatus(deviceId);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.log('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCalibratePress = async () => {
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
      }
    }
  };

  // Early returns after all hooks
  if (!device && !deviceData) {
    return (
      <View style={[styles.scrollContentContainer, styles.centered, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <ThemedText style={isDarkMode && { color: Colors.dark.text }}>Немає даних про пристрій</ThemedText>
      </View>
    );
  }

  if (loading && !deviceData) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? Colors.dark.tint : Colors.light.tint} />
        <ThemedText style={[styles.loadingText, isDarkMode && { color: Colors.dark.text }]}>Отримання даних про пристрій...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
        <ThemedText style={[styles.errorText, isDarkMode && { color: Colors.dark.text }]}>Помилка завантаження даних</ThemedText>
        <TouchableOpacity style={[styles.retryButton, isDarkMode && { backgroundColor: Colors.dark.tint }]} onPress={refreshData}>
          <ThemedText style={styles.retryButtonText}>Спробувати знову</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  
  const currentDevice = deviceData || device;
  const technical = currentDevice?.technical;
  const buttonDiameter = 200;
  const iconSize = buttonDiameter * 0.35;

  return (
    <View style={[styles.outerContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContentContainer, isDarkMode && { backgroundColor: '#0f172a' }]}
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
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: '#1f2937' }]}>
          <View style={[styles.cardHeader, isDarkMode && { borderBottomColor: Colors.dark.tabIconDefault }]}>
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
        </View>

        {/* Кнопка калібрування */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.calibrateButton, 
              {width: buttonDiameter, height: buttonDiameter, borderRadius: buttonDiameter/2}, 
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
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: { 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 80,
    paddingBottom: 40,
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
  },
  cardHeader: {
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
  },
  calibrateButton: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
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
  },
  loadingContainer: {
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
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
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
    minWidth: 300,
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
