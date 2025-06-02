import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';
import { UserDevice } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface DeviceStatusViewProps {
  device: UserDevice | null | undefined;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const DeviceStatusView: React.FC<DeviceStatusViewProps> = ({ device }) => {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - BEFORE ANY CONDITIONAL LOGIC
  const pressScale = useSharedValue(1);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use the device status hook with the device ID from serverConfig
  const deviceId = device?.serverConfig?.deviceId || '111001'; // Default to first simulated device
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
    refreshData();
    setRefreshing(false);
  };

  const handleCalibratePress = async () => {
    if (!deviceId || deviceId === '111001') {
      Alert.alert("Помилка", "Неможливо виконати калібрування: відсутній ID пристрою або використовується тестовий пристрій");
      return;
    }

    pressScale.value = withTiming(0.9, { duration: 100, easing: Easing.out(Easing.quad) }, () => {
      pressScale.value = withTiming(1, {duration: 150, easing: Easing.inOut(Easing.ease)});
    });

    Alert.alert(
      "Калібрування датчиків", 
      "Ви впевнені, що хочете запустити калібрування всіх датчиків? Це може зайняти кілька хвилин.",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Калібрувати", 
          onPress: async () => {
            try {
              const result = await calibrateDevice();
              
              if (result?.success) {
                Alert.alert("Успіх", result.message || "Калібрування успішно завершено");
              } else {
                Alert.alert("Помилка", result?.message || "Не вдалося виконати калібрування");
              }
            } catch (err) {
              Alert.alert("Помилка", "Не вдалося підключитися до сервера для калібрування");
            }
          }
        }
      ]
    );
  };

  // NOW IT'S SAFE TO DO EARLY RETURNS AFTER ALL HOOKS
  if (!device && !deviceData) {
    return (
      <View style={[styles.scrollContentContainer, styles.centered]}>
        <ThemedText>Немає даних про пристрій</ThemedText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.scrollContentContainer, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.text} />
        <ThemedText style={{ marginTop: 10 }}>Завантаження даних пристрою...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.scrollContentContainer, styles.centered]}>
        <ThemedText style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
          Помилка: {error}
        </ThemedText>
        <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Спробувати ще раз</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // Use API data if available, otherwise fall back to props
  const currentDevice = deviceData || device;
  const technical = currentDevice?.technical;
  const buttonDiameter = 200; // Button size increased 2.5 times (100 * 2.5)
  const iconSize = buttonDiameter * 0.35; // Icon size

  return (
    <View style={styles.outerContainer}>
      <View style={styles.scrollContentContainer}>
        <ThemedText type="title" style={styles.title}>Статус пристрою</ThemedText>
        <View style={styles.infoCard}>
          <View style={styles.infoSection}>
            <Ionicons name="hardware-chip-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Назва пристрою:</ThemedText>
            <ThemedText style={styles.value}>{currentDevice?.name || currentDevice?.customName || 'Невідомий пристрій'}</ThemedText>
          </View>

          <View style={styles.infoSection}>
           <Ionicons name="barcode-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>ID пристрою:</ThemedText>
            <ThemedText style={styles.value}>{deviceId}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="location-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Розташування:</ThemedText>
            <ThemedText style={styles.value}>{currentDevice?.location || 'Не вказано'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="wifi-outline" size={20} color={currentDevice?.isOnline ? '#4CAF50' : '#F44336'} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Статус:</ThemedText>
            <ThemedText style={[styles.value, {color: currentDevice?.isOnline ? '#4CAF50' : '#F44336'}]}>
              {currentDevice?.isOnline ? 'Онлайн' : 'Офлайн'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoSection}>
            <Ionicons name="power-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Тип живлення:</ThemedText>
            <ThemedText style={styles.value}>{technical?.powerSource || 'Невідомо'}</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="time-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Час роботи:</ThemedText>
            <ThemedText style={styles.value}>{technical?.operatingTime || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="battery-half-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Рівень батареї:</ThemedText>
            <ThemedText style={styles.value}>
              {technical?.batteryLevel ? `${technical.batteryLevel}%` : 'Невідомо'}
            </ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="cellular-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Сила сигналу:</ThemedText>
            <ThemedText style={styles.value}>
              {technical?.ping ? `${technical.ping} dBm` : 'Невідомо'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoSection}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Статус датчиків:</ThemedText>
            <ThemedText style={styles.value}>{technical?.sensorStatus || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="calendar-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Останнє калібрування:</ThemedText>
            <ThemedText style={styles.value}>{technical?.lastCalibration || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="build-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Версія прошивки:</ThemedText>
            <ThemedText style={styles.value}>{technical?.firmwareVersion || 'Невідомо'}</ThemedText>
          </View>
          
          <View style={styles.infoSection}>
            <Ionicons name="refresh-outline" size={20} color={Colors.light.text} style={styles.icon} />
            <ThemedText type="defaultSemiBold" style={styles.label}>Останнє оновлення:</ThemedText>
            <ThemedText style={styles.value}>{currentDevice?.lastUpdate || 'Невідомо'}</ThemedText>
          </View>
        </View>

        {technical?.alerts && technical.alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.infoSection}>
              <Ionicons name="warning-outline" size={20} color="#FF9800" style={styles.icon} />
              <ThemedText type="defaultSemiBold" style={[styles.label, {color: '#FF9800'}]}>Попередження:</ThemedText>
            </View>
            {technical.alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <ThemedText style={[styles.value, {color: '#FF9800', textAlign: 'left'}]}>
                  {typeof alert === 'string' ? alert : (alert as any)?.message || 'Невідоме попередження'}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <AnimatedTouchableOpacity 
        style={[styles.calibrateButton, {width: buttonDiameter, height: buttonDiameter, borderRadius: buttonDiameter/2}, animatedButtonStyle]} 
        onPress={handleCalibratePress}
        activeOpacity={0.8}
      >
        <Ionicons name="construct" size={iconSize} color="black" />
        <ThemedText style={styles.calibrateButtonText}>{"Калібрування\nдатчиків"}</ThemedText>
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { 
    flex: 1,
    backgroundColor: 'transparent', // Ensure this view is transparent
  },
  scrollContentContainer: { 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 80, // Added significant paddingTop
    paddingBottom: 160, // Increased paddingBottom for much larger button
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 2,
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
  calibrateButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 75 : 30, // Adjusted bottom spacing slightly
    alignSelf: 'center',
    // width and height are now set dynamically via inline style
    // borderRadius is now set dynamically via inline style
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
  },
  retryButton: {
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 2,
  },
  alertItem: {
    marginLeft: 30,
    marginBottom: 5,
  },
});

export default DeviceStatusView;
