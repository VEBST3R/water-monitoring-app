import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolate, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import DetailedParametersView from '@/components/DetailedParametersView';
import ScoreCircle from '@/components/ScoreCircle';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WaveAnimation from '@/components/WaveAnimation';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CENTRAL_SERVER_ENDPOINT = '192.168.0.198:1880';
const ASYNC_STORAGE_DEVICES_KEY = '@userDevices';
const ASYNC_STORAGE_CURRENT_DEVICE_INDEX_KEY = '@currentDeviceIndex';

// Helper function to format time
const formatTime = (seconds: number) => {
  if (seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

interface ServerConfig {
  deviceId: string;
  serverName: string; 
}

interface UserDevice {
  id: string; 
  customName: string; 
  serverConfig: ServerConfig;
}

export default function HomeScreen() {
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [detailedParams, setDetailedParams] = useState<any>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const translateX = useSharedValue(0);
  const [isLoading, setIsLoading] = useState(true); 

  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [newUserDeviceName, setNewUserDeviceName] = useState('');
  const [newPhysicalDeviceId, setNewPhysicalDeviceId] = useState(''); // Added state for 6-digit device ID

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number | null>(null);
  const [nextUpdateTimer, setNextUpdateTimer] = useState(0);
  const nextUpdateIntervalRef = useRef<number | null>(null); // Changed type to number | null

  const currentDevice = userDevices[currentDeviceIndex];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedDevicesJson = await AsyncStorage.getItem(ASYNC_STORAGE_DEVICES_KEY);
        if (storedDevicesJson) {
          setUserDevices(JSON.parse(storedDevicesJson));
        } else {
          setUserDevices([]); // Initialize if nothing in storage
        }

        const storedIndexJson = await AsyncStorage.getItem(ASYNC_STORAGE_CURRENT_DEVICE_INDEX_KEY);
        if (storedIndexJson) {
          const index = JSON.parse(storedIndexJson);
          // Ensure index is valid for the loaded devices
          if (storedDevicesJson && JSON.parse(storedDevicesJson).length > 0) {
            setCurrentDeviceIndex(index < JSON.parse(storedDevicesJson).length ? index : 0);
          } else {
            setCurrentDeviceIndex(0);
          }
        } else {
          setCurrentDeviceIndex(0); // Initialize if nothing in storage
        }
      } catch (e) {
        console.error("Failed to load data from AsyncStorage", e);
        setUserDevices([]);
        setCurrentDeviceIndex(0);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Effect to save devices and current index to AsyncStorage
  useEffect(() => {
    const saveData = async () => {
      if (!isLoading) { // Only save if initial loading is complete
        try {
          await AsyncStorage.setItem(ASYNC_STORAGE_DEVICES_KEY, JSON.stringify(userDevices));
          // Ensure currentDeviceIndex is valid before saving, especially if userDevices is empty
          const indexToSave = userDevices.length > 0 && currentDeviceIndex < userDevices.length ? currentDeviceIndex : 0;
          await AsyncStorage.setItem(ASYNC_STORAGE_CURRENT_DEVICE_INDEX_KEY, JSON.stringify(indexToSave));
        } catch (e) {
          console.error("Failed to save data to AsyncStorage", e);
        }
      }
    };
    saveData();
  }, [userDevices, currentDeviceIndex, isLoading]);


  const openAddDeviceModal = () => {
    setNewUserDeviceName('');
    setNewPhysicalDeviceId(''); // Reset new physical device ID
    setAddDeviceModalVisible(true);
  };

  const handleAddDevice = async () => { // Make the function async
    const trimmedDeviceId = newPhysicalDeviceId.trim();
    if (!/^\d{6}$/.test(trimmedDeviceId)) {
      Alert.alert("Помилка", "пристрою з таким ID не існує.");
      return;
    }
    if (!newUserDeviceName.trim()) {
      Alert.alert("Помилка", "Будь ласка, введіть назву пристрою.");
      return;
    }

    // Validate device ID with the server
    try {
      const validationUrl = `http://${CENTRAL_SERVER_ENDPOINT}/getWQI?device=${trimmedDeviceId}`;
      // console.log('Validating device ID:', validationUrl);
      const response = await fetch(validationUrl);
      // console.log('Validation response status:', response.status);

      if (!response.ok) {
        // Assuming a non-ok response (e.g., 404) means the device ID is invalid or not found
        const errorData = await response.text().catch(() => 'Не вдалося отримати деталі помилки');
        // console.log('Validation error data:', errorData);
        Alert.alert("Помилка валідації", `Датчик з ID '${trimmedDeviceId}' не знайдено або не підключений до сервера. Перевірте ID та налаштування сервера. (Статус: ${response.status})`);
        return;
      }
      // Optionally, you could check the content of response.json() if the server returns specific data for valid IDs
      // For now, a successful HTTP status is enough for validation.

    } catch (error) {
      // console.error("Error validating device ID:", error);
      Alert.alert("Помилка мережі", `Не вдалося перевірити ID датчика '${trimmedDeviceId}'. Перевірте з'єднання з мережею та доступність сервера Node-RED (${CENTRAL_SERVER_ENDPOINT}).`);
      return;
    }

    const newDevice: UserDevice = {
      id: `user_device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      customName: newUserDeviceName.trim(),
      serverConfig: {
        deviceId: trimmedDeviceId, // Use the 6-digit ID
        serverName: `Датчик ${trimmedDeviceId}`, // Set serverName based on the ID
      },
    };
    const updatedDevices = [...userDevices, newDevice];
    setUserDevices(updatedDevices);
    setCurrentDeviceIndex(updatedDevices.length - 1); 
    setAddDeviceModalVisible(false);
    setScore(0); 
    setDetailedParams(null);
    setConnectionStatus('disconnected'); 
  };

  useEffect(() => {
    setScore(0);
    setDetailedParams(null);
    setConnectionStatus('disconnected');
    setLastUpdateTimestamp(null);
  }, [currentDevice?.id]); 

  const handleScoreUpdate = useCallback((newScore: number, details: any) => {
    setScore(newScore); 
    setDetailedParams(details);
    setConnectionStatus('connected');
    setLastUpdateTimestamp(Date.now());
  }, []);

  const handleFetchError = (error: string) => { // Changed error type to string
    // console.error("Fetch error from ScoreCircle:", error);
    setConnectionStatus('error');
    // Optionally, display a more user-friendly message or log the error
  };

  useEffect(() => {
    if (nextUpdateIntervalRef.current) {
      clearInterval(nextUpdateIntervalRef.current);
    }
    if (connectionStatus === 'connected' && lastUpdateTimestamp) {
      const updateCountdown = () => {
        const elapsed = Math.floor((Date.now() - lastUpdateTimestamp) / 100);
        const nextUpdateIn = Math.max(0, 300 - elapsed); 
        setNextUpdateTimer(nextUpdateIn);
      };
      updateCountdown(); 
      nextUpdateIntervalRef.current = setInterval(updateCountdown, 1000) as unknown as number; // Cast to number
    } else {
      setNextUpdateTimer(0);
    }
    return () => {
      if (nextUpdateIntervalRef.current) {
        clearInterval(nextUpdateIntervalRef.current);
      }
    };
  }, [connectionStatus, lastUpdateTimestamp]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) 
    .onUpdate((event) => {
      if (userDevices.length === 0) return;
      if (showDetailedView) {
        // When detailed view is shown, main screen is at -screenWidth.
        // Swiping right (positive event.translationX) should bring main screen towards 0.
        translateX.value = Math.min(0, -screenWidth + event.translationX);
      } else {
        // When main screen is shown, it's at 0.
        // Swiping left (negative event.translationX) should bring main screen towards -screenWidth.
        translateX.value = Math.max(-screenWidth, event.translationX);
      }
    })
    .onEnd((event) => {
      if (userDevices.length === 0) return;
      if (showDetailedView) {
        if (event.translationX > screenWidth / 4) {
          runOnJS(setShowDetailedView)(false);
          translateX.value = withTiming(0);
        } else {
          // Corrected: Snap back to detailed view if swipe is not enough
          translateX.value = withTiming(-screenWidth); 
        }
      } else {
        if (event.translationX < -screenWidth / 4) {
          runOnJS(setShowDetailedView)(true);
          translateX.value = withTiming(-screenWidth); 
        } else {
          translateX.value = withTiming(0); 
        }
      }
    });

  const verticalSwipeGesture = Gesture.Pan()
    .activeOffsetY([-20, 20]) 
    .onEnd((event) => {
      if (userDevices.length <= 1) return; 
      const swipeThreshold = screenHeight / 6;
      if (event.translationY < -swipeThreshold) { 
        runOnJS(setCurrentDeviceIndex)((prevIndex) => (prevIndex + 1) % userDevices.length);
      } else if (event.translationY > swipeThreshold) { 
        runOnJS(setCurrentDeviceIndex)((prevIndex) => (prevIndex - 1 + userDevices.length) % userDevices.length);
      }
    });
    
  const animatedMainScreenStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedDetailedViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-screenWidth, 0],
            [0, screenWidth],
            Extrapolate.CLAMP
          ),
        },
      ],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 150, // Increased zIndex to be above the header
    };
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}> 
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Завантаження пристроїв...</ThemedText> 
      </ThemedView>
    );
  }

  const renderHeaderContent = () => { // Renamed from renderHeader
    if (!currentDevice && userDevices.length === 0) {
        return (
            <ThemedText type="subtitle" style={styles.headerPlaceholderText}>Моніторинг якості води</ThemedText>
        );
    }
    if (!currentDevice && userDevices.length > 0 && !isLoading) {
        return (
            <ThemedText type="subtitle" style={styles.headerPlaceholderText}>Виберіть пристрій</ThemedText>
        );
    }
    if (!currentDevice) return null;

    return (
      <>
        <View style={styles.headerLeft}>
          <ThemedText type="title" style={styles.deviceName}>{currentDevice.customName}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.deviceServerName}>({currentDevice.serverConfig.serverName})</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={
              connectionStatus === 'connected' ? 'wifi' :
              connectionStatus === 'error' ? 'cloud-offline-outline' :
              'cloud-outline'
            }
            size={24} // Increased icon size
            color={
              connectionStatus === 'connected' ? Colors.light.success :
              connectionStatus === 'error' ? Colors.light.error :
              Colors.light.text // Default color for disconnected
            }
            style={styles.connectionIcon}
          />
          <View style={styles.statusTextContainer}>
            {connectionStatus === 'connected' && lastUpdateTimestamp && (
            <ThemedText type="default" style={styles.nextUpdateText}>
                Оновл: {formatTime(nextUpdateTimer)}
              </ThemedText>
            )}
            {connectionStatus === 'error' && (
              <ThemedText type="default" style={[styles.statusText, styles.errorStatusText]}>
                Помилка
              </ThemedText>
            )}
            {connectionStatus === 'disconnected' && (
              <ThemedText type="default" style={styles.statusText}>
                Не підключено
              </ThemedText>
            )}
          </View>
        </View>
      </>
    );
  };

  const combinedGesture = Gesture.Race(panGesture, verticalSwipeGesture);
  const waveScore = userDevices.length === 0 ? 50 : score; 

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}> {/* New static root View */}
      <WaveAnimation score={waveScore} /> {/* WaveAnimation as a background */}
      
      <GestureDetector gesture={combinedGesture}>
        {/* This Animated.View needs a transparent background to see WaveAnimation behind it */}
        <Animated.View style={{ flex: 1, backgroundColor: 'transparent' }}> 
          {/* ThemedView also needs a transparent background */}
          <ThemedView style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* WaveAnimation is no longer here */}
            
            <Animated.View style={[styles.headerContainer, animatedMainScreenStyle]}>
              {renderHeaderContent()}
            </Animated.View>

            <Animated.View style={[styles.mainContentContainer, animatedMainScreenStyle]}>
              {userDevices.length === 0 ? (
                <ScoreCircle
                  size={screenWidth * 0.7}
                  strokeWidth={20}
                  isAddMode={true}
                  onAddButtonPress={openAddDeviceModal}
                  // Optional props are omitted as per their definition in ScoreCircleProps for add mode
                  // serverEndpoint={undefined} // No longer explicitly passing undefined
                  // deviceId={undefined}
                  // initialScore={undefined}
                  // onScoreUpdate={undefined}
                  // onFetchError={undefined}
                />
              ) : currentDevice ? (
                <ScoreCircle
                  key={currentDevice.id} 
                  size={screenWidth * 0.7}
                  strokeWidth={20}
                  initialScore={score} // Pass the score from HomeScreen state
                  serverEndpoint={CENTRAL_SERVER_ENDPOINT}
                  deviceId={currentDevice.serverConfig.deviceId}
                  onScoreUpdate={handleScoreUpdate}
                  onFetchError={handleFetchError}
                  // isAddMode is implicitly false or can be omitted
                />
              ) : (
                <View style={styles.centeredMessageContainer}>
                  <ActivityIndicator size="large" color={Colors.light.tint} />
                  <ThemedText style={styles.loadingText}>Завантаження даних пристрою...</ThemedText>
                </View>
              )}
            </Animated.View>

          {userDevices.length > 0 && currentDevice && (
            <Animated.View style={[styles.detailedViewContainer, animatedDetailedViewStyle]}>
              <DetailedParametersView parameters={detailedParams} />
            </Animated.View>
          )}

          {userDevices.length > 0 && (
            <TouchableOpacity style={styles.fab} onPress={openAddDeviceModal}>
              <Ionicons name="add" size={30} color={Colors.light.tint} />
            </TouchableOpacity>
          )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isAddDeviceModalVisible}
            onRequestClose={() => setAddDeviceModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ThemedText type="subtitle" style={styles.modalTitle}>Додати новий пристрій</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Назва пристрою (напр., Кухня)"
                  value={newUserDeviceName}
                  onChangeText={setNewUserDeviceName}
                  placeholderTextColor="#aaa"
                />
                <TextInput
                  style={styles.input}
                  placeholder="ID фізичного датчика (6 цифр)"
                  value={newPhysicalDeviceId}
                  onChangeText={setNewPhysicalDeviceId}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#aaa"
                />
                
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddDeviceModalVisible(false)}>
                    <Text style={styles.modalButtonText}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.modalButton, 
                      styles.addButton,
                      (!/^\d{6}$/.test(newPhysicalDeviceId.trim()) || !newUserDeviceName.trim()) && styles.disabledButton
                    ]} 
                    onPress={handleAddDevice} 
                    disabled={!/^\d{6}$/.test(newPhysicalDeviceId.trim()) || !newUserDeviceName.trim()}
                  >
                    <Text style={styles.addButtonText}>Додати</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ThemedView>
      </Animated.View>
    </GestureDetector>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Adjusted top padding
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15, // Increased vertical padding
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Vertically center items in header
    zIndex: 100,
    // backgroundColor: 'rgba(255,255,255,0.1)', // Optional: for debugging layout
  },
  headerPlaceholderText: { // Style for placeholder text when no device
    fontSize: 18,
    color: Colors.light.text,
    textAlign: 'center',
    width: '100%',
  },
  headerLeft: {
    flex: 1, // Allow left side to take available space
    alignItems: 'flex-start',
    marginRight: 10, // Add some space between left and right content
  },
  headerRight: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Vertically center icon and text
  },
  deviceName: {
    fontSize: 24, // Increased font size
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2, // Space between device name and server name
  },
  deviceServerName: {
    fontSize: 14, // Adjusted font size
    color: Colors.light.text,
    opacity: 0.7, // Slightly less prominent
  },
  connectionIcon: {
    marginRight: 8, // Space between icon and status text
  },
  statusTextContainer: { // New container for status texts
    alignItems: 'flex-end', // Align text to the right if it wraps
  },
  statusText: { // Base style for status texts
    fontSize: 14, // Increased font size
    color: Colors.light.text,
  },
  nextUpdateText: {
    fontSize: 14, // Increased font size
    color: Colors.light.text,
    opacity: 0.8,
  },
  errorStatusText: {
    // fontSize: 14, // Inherits from statusText
    color: Colors.light.error,
    fontWeight: 'bold',
  },
  mainContentContainer: {
    flex: 1,
    width: screenWidth,
    alignItems: 'center', // Горизонтальне центрування
    paddingTop: screenHeight * 0.20, // Додаємо відступ зверху, щоб підняти ScoreCircle
                                     // Це приблизно 15% висоти екрана. Можна налаштувати.
    zIndex: 10, // Переконуємося, що цей контейнер вище за WaveAnimation
    backgroundColor: 'transparent', // Додано для прозорості над WaveAnimation
  },
  detailedViewContainer: {
    width: screenWidth,
    height: screenHeight, 
    backgroundColor: 'transparent', // Змінено на прозорий
  },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    backgroundColor: 'white', // Changed to white
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 200, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.light.background, // Changed to light tint for better contrast
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
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
    marginBottom: 24, // Increased margin
    textAlign: 'center',
    fontSize: 20,
    color: Colors.light.text, // Added for better contrast
    fontWeight: 'bold', // Added for emphasis
  },
  input: {
    height: 50,
    borderColor: Colors.light.icon, 
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff', 
    color: Colors.light.text, 
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space buttons evenly
  },
  modalButton: {
    flex: 1, 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5, 
  },
  cancelButton: {
    backgroundColor: Colors.dark.icon, 
  },
  addButton: {
    backgroundColor: Colors.light.tint,
  },
  disabledButton: { // Added style for disabled button
    backgroundColor: Colors.dark.icon, // Or any color that indicates disabled state
    opacity: 0.7,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButtonText: { // New style for the Add button's text
    color: Colors.dark.text, // Assuming Colors.dark.text is a dark color suitable for light backgrounds
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
