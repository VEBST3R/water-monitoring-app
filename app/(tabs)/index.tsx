import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, Extrapolate, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import DetailedParametersView from '@/components/DetailedParametersView';
import DeviceSelectionView from '@/components/DeviceSelectionView';
import DeviceStatusView from '@/components/DeviceStatusView';
import ScoreCircle from '@/components/ScoreCircle';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WaveAnimation from '@/components/WaveAnimation';
import WQIChartView from '@/components/WQIChartView';
import { Colors } from '@/constants/Colors';
import { UserDevice } from '@/types';
import { getWaterQualityColor } from '@/utils/colorUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CENTRAL_SERVER_ENDPOINT = '192.168.1.104:1880';
const ASYNC_STORAGE_DEVICES_KEY = '@userDevices';
const ASYNC_STORAGE_CURRENT_DEVICE_INDEX_KEY = '@currentDeviceIndex';

// Змінюємо функцію formatTime для кращого відображення секунд
const formatTime = (seconds: number) => {
  if (seconds < 0) return '0с';
  return `${seconds}с`; // Просто показуємо секунди
};

export default function HomeScreen() {
  // State variables
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [detailedParams, setDetailedParams] = useState<any>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showDeviceStatusView, setShowDeviceStatusView] = useState(false);
  const [showDeviceSelectionView, setShowDeviceSelectionView] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [newUserDeviceName, setNewUserDeviceName] = useState('');
  const [newPhysicalDeviceId, setNewPhysicalDeviceId] = useState('');  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number | null>(null);
  const [nextUpdateTimer, setNextUpdateTimer] = useState(0);
  const [showWQIChart, setShowWQIChart] = useState(false);
  
  // Shared values for animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Refs
  const nextUpdateIntervalRef = useRef<number | null>(null);
  const dataUpdateIntervalRef = useRef<number | null>(null);
  
  // Constants
  const UPDATE_INTERVAL = 5000;
  const currentDevice = userDevices[currentDeviceIndex];
  
  // ✅ Define ALL useCallback hooks together in the same place
  const handleScoreUpdate = useCallback((newScore: number, details: any) => {
    setScore(newScore); 
    setDetailedParams(details);
    setConnectionStatus('connected');
    setLastUpdateTimestamp(Date.now());
  }, []);
  
  // Оновлена функція оновлення даних - Moved up before it's used
  const updateCurrentDeviceData = useCallback(() => {
    if (currentDevice?.serverConfig?.deviceId && connectionStatus !== 'error') {
      // Напряму робимо запит до API для отримання даних
      fetch(`http://${CENTRAL_SERVER_ENDPOINT}/api/getWQI?device=${currentDevice.serverConfig.deviceId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && typeof data.wqi === 'number' && data.parameters) {
            const newScore = Math.max(0, Math.min(100, Math.round(data.wqi)));
            setScore(newScore);
            setDetailedParams(data.parameters);
            setConnectionStatus('connected');
            setLastUpdateTimestamp(Date.now());
          }
        })
        .catch(error => {
          console.error("Fetch error:", error);
          setConnectionStatus('error');
        });
    }
  }, [currentDevice, connectionStatus, CENTRAL_SERVER_ENDPOINT]);

  // Now define handleScoreCirclePress AFTER updateCurrentDeviceData is defined
  const handleScoreCirclePress = useCallback(() => {
    // Запускаємо оновлення даних при натисканні та дозволяємо внутрішню анімацію ScoreCircle
    updateCurrentDeviceData();
  }, [updateCurrentDeviceData]);
  
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

    // Перевіряємо, чи вже існує пристрій з таким ID
    const deviceExists = userDevices.some(device => 
      device.serverConfig?.deviceId === trimmedDeviceId
    );
    
    if (deviceExists) {
      Alert.alert("Помилка", `Пристрій з ID '${trimmedDeviceId}' вже додано до вашого списку.`);
      return;
    }

    // Validate device ID with the server
    try {
      const validationUrl = `http://${CENTRAL_SERVER_ENDPOINT}/api/getWQI?device=${trimmedDeviceId}`;
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
    
    // Закриваємо модальне вікно додавання пристрою
    setAddDeviceModalVisible(false);
    
    // Закриваємо меню вибору пристрою та перекидаємо в головне меню
    setShowDeviceSelectionView(false);
    translateY.value = withTiming(0, { 
      duration: 500,
      easing: Easing.bezier(0.16, 1, 0.3, 1)
    });
    
    // Скидаємо стани для нового пристрою
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

  const handleFetchError = (error: string) => { // Changed error type to string
    // console.error("Fetch error from ScoreCircle:", error);
    setConnectionStatus('error');
    // Optionally, display a more user-friendly message or log the error
  };

  const handleDeviceSelect = (index: number) => {
    // Закриваємо меню вибору пристрою в будь-якому випадку
    setShowDeviceSelectionView(false);
    translateY.value = withTiming(0, { 
      duration: 500,
      easing: Easing.bezier(0.16, 1, 0.3, 1)
    });
    
    // Скидаємо стани тільки якщо вибрано інший пристрій
    if (index !== currentDeviceIndex) {
      setCurrentDeviceIndex(index);
      // Скидаємо інші стани при перемиканні пристроїв
      setScore(0);
      setDetailedParams(null);
      setConnectionStatus('disconnected');
      setLastUpdateTimestamp(null);
    }
  };

  const handleClearDevices = () => {
    setUserDevices([]);
    setCurrentDeviceIndex(0);
    setShowDeviceSelectionView(false);
    translateY.value = withTiming(0, { 
      duration: 500, // Збільшено тривалість для повільнішого повернення
      easing: Easing.bezier(0.16, 1, 0.3, 1) // Плавніша крива анімації
    });
    setScore(0);
    setDetailedParams(null);
    setConnectionStatus('disconnected');
    setLastUpdateTimestamp(null);
  };

  // Змінюємо ефект для таймера оновлення
  useEffect(() => {
    if (nextUpdateIntervalRef.current) {
      clearInterval(nextUpdateIntervalRef.current);
    }
    
    if (connectionStatus === 'connected' && lastUpdateTimestamp) {
      const updateCountdown = () => {
        const elapsed = Math.floor((Date.now() - lastUpdateTimestamp) / 1000);
        const nextUpdateIn = Math.max(0, Math.floor(UPDATE_INTERVAL / 1000) - (elapsed % Math.floor(UPDATE_INTERVAL / 1000)));
        setNextUpdateTimer(nextUpdateIn);
      };
      
      updateCountdown(); 
      nextUpdateIntervalRef.current = setInterval(updateCountdown, 1000) as unknown as number;
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
      if (userDevices.length === 0 || showDeviceSelectionView) return; // Disable horizontal swipes when device selection is shown
      if (showDetailedView) {
        // When detailed view is shown (parameters), main screen is at -screenWidth.
        // Swiping right (positive event.translationX) should bring main screen towards 0.
        translateX.value = Math.min(0, -screenWidth + event.translationX);
      } else if (showDeviceStatusView) {
        // When device status view is shown, main screen is at screenWidth.
        // Swiping left (negative event.translationX) should bring main screen towards 0.
        translateX.value = Math.max(0, screenWidth + event.translationX);
      } else {
        // When main screen is shown, it's at 0.
        // Swiping left (negative event.translationX) brings detailed params view.
        // Swiping right (positive event.translationX) brings device status view.
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (userDevices.length === 0 || showDeviceSelectionView) return; // Disable horizontal swipes when device selection is shown
      const { translationX } = event;

      if (showDetailedView) { // Currently showing detailed parameters view (left of main)
        if (translationX > screenWidth / 4) { // Swiped right enough to close it
          runOnJS(setShowDetailedView)(false);
          translateX.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        } else { // Not swiped enough, snap back to detailed view
          translateX.value = withTiming(-screenWidth, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        }
      } else if (showDeviceStatusView) { // Currently showing device status view (right of main)
        if (translationX < -screenWidth / 4) { // Swiped left enough to close it
          runOnJS(setShowDeviceStatusView)(false);
          translateX.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        } else { // Not swiped enough, snap back to device status view
          translateX.value = withTiming(screenWidth, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        }
      } else { // Currently showing main screen
        if (translationX < -screenWidth / 4) { // Swiped left for detailed params
          runOnJS(setShowDetailedView)(true);
          translateX.value = withTiming(-screenWidth, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        } else if (translationX > screenWidth / 4) { // Swiped right for device status
          runOnJS(setShowDeviceStatusView)(true);
          translateX.value = withTiming(screenWidth, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        } else { // Not swiped enough, snap back to main screen
          translateX.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        }
      }
    });

  const verticalSwipeGesture = Gesture.Pan()
    .activeOffsetY([-20, 20]) 
    .onUpdate((event) => {
      if (showDeviceSelectionView) {
        // When device selection is shown, handle swipe up to close
        // Constrain movement to prevent overscrolling
        translateY.value = Math.max(0, Math.min(screenHeight, screenHeight + event.translationY));
      } else if (!showDetailedView && !showDeviceStatusView) {
        // When main screen is shown, handle swipe down to open device selection
        // Only allow downward swipes to open device selection
        translateY.value = Math.max(0, Math.min(screenHeight, event.translationY));
      }
    })
    .onEnd((event) => {
      const swipeThreshold = screenHeight / 4; // Reduced threshold for easier interaction
      
      if (showDeviceSelectionView) {
        // Device selection is open - handle swipe up to close
        if (event.translationY < -swipeThreshold || event.velocityY < -500) {
          // Close if swiped up far enough or with enough velocity
          runOnJS(setShowDeviceSelectionView)(false);
          translateY.value = withTiming(0, { 
            duration: 500, // Збільшено тривалість для повільнішого повернення 
            easing: Easing.bezier(0.16, 1, 0.3, 1) // Плавніша крива анімації
          });
        } else {
          // Not swiped enough, snap back to open state
          translateY.value = withTiming(screenHeight, { 
            duration: 400, // Середня тривалість для повернення назад
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
          });
        }
      } else if (!showDetailedView && !showDeviceStatusView) {
        // Main screen is shown - handle device switching or opening device selection
        if (event.translationY > swipeThreshold || event.velocityY > 500) {
          // Swipe down - open device selection if there are devices
          if (userDevices.length > 0) {
            runOnJS(setShowDeviceSelectionView)(true);
            translateY.value = withTiming(screenHeight, { 
              duration: 400, // Збалансована тривалість для плавного відкриття
              easing: Easing.bezier(0.33, 0.1, 0.38, 1) // Крива з акцентом на початок руху
            });
          } else {
            translateY.value = withTiming(0, { 
              duration: 400, 
              easing: Easing.bezier(0.16, 1, 0.3, 1) 
            });
          }
        } else if (event.translationY < -swipeThreshold || event.velocityY < -500) { 
          // Swipe up - switch to next device (legacy behavior)
          if (userDevices.length > 1) {
            runOnJS(setCurrentDeviceIndex)((prevIndex) => (prevIndex + 1) % userDevices.length);
          }
          translateY.value = withTiming(0, { 
            duration: 400, 
            easing: Easing.bezier(0.16, 1, 0.3, 1)  
          });
        } else {
          // Not enough movement, return to original position
          translateY.value = withTiming(0, { 
            duration: 350, 
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
          });
        }
      }
    });
    
  const animatedMainScreenStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { 
          translateY: interpolate(
            translateY.value,
            [0, screenHeight],
            [0, screenHeight], // Main screen moves down by the same amount as device selection comes down
            Extrapolate.CLAMP
          )
        }
      ],
    };
  });

  const animatedDeviceSelectionViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            translateY.value,
            [0, screenHeight],
            [-screenHeight, 0], // Device selection slides down from -screenHeight to 0
            Extrapolate.CLAMP
          ),
        },
      ],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 200,
      opacity: interpolate(
        translateY.value,
        [0, screenHeight * 0.15], // Показувати швидше для плавнішого переходу
        [0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const animatedDetailedViewStyle = useAnimatedStyle(() => {
    // DetailedParametersView slides in from the right (translateX from screenWidth to 0)
    // when main screen moves from 0 to -screenWidth.
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-screenWidth, 0],
            [0, screenWidth], // Detailed view is at 0 when main is at -screenWidth
            Extrapolate.CLAMP
          ),
        },
      ],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 150, 
    };
  });

  const animatedDeviceStatusViewStyle = useAnimatedStyle(() => {
    // DeviceStatusView slides in from the left (translateX from -screenWidth to 0)
    // when main screen moves from 0 to screenWidth.
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [0, screenWidth],
            [-screenWidth, 0], // DeviceStatusView is at 0 when main is at screenWidth
            Extrapolate.CLAMP
          ),
        },
      ],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 150, // Same zIndex as detailed view, or higher if it should overlap
    };
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}> 
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Завантаження пристроїв...</ThemedText> 
      </ThemedView>
    );
  }  const renderInfoCards = () => {
    if (!currentDevice && userDevices.length === 0) {
      return (
        <View style={styles.infoCard}>
          <Ionicons name="water-outline" size={24} color={Colors.light.tint} />
          <View style={styles.cardTextContainer}>
            <ThemedText style={styles.cardTitle}>Моніторинг якості води</ThemedText>
            <ThemedText style={styles.cardSubtitle}>Додайте перший пристрій для початку</ThemedText>
          </View>
        </View>
      );
    }
    
    if (!currentDevice && userDevices.length > 0 && !isLoading) {
      return (
        <View style={styles.infoCard}>
          <Ionicons name="warning-outline" size={24} color={Colors.light.tabIconDefault} />
          <View style={styles.cardTextContainer}>
            <ThemedText style={styles.cardTitle}>Виберіть пристрій</ThemedText>
            <ThemedText style={styles.cardSubtitle}>Потягніть вниз щоб відкрити меню</ThemedText>
          </View>
        </View>
      );
    }
    
    if (!currentDevice) return null;

    // Функція для оцінки загальної якості води (спрощена версія)
    const getQuickWaterAssessment = (params: any) => {
      if (!params) return { statusColor: Colors.light.tabIconDefault, statusText: 'Завантаження даних', statusIcon: 'time-outline' };
      
      let issues = 0;
      let warnings = 0;
      
      if (params.pH !== undefined) {
        if (params.pH < 6.0 || params.pH > 9.0) issues++;
        else if (params.pH < 6.5 || params.pH > 8.5) warnings++;
      }
      
      if (params.temperature !== undefined) {
        if (params.temperature > 30) issues++;
        else if (params.temperature < 5 || params.temperature > 25) warnings++;
      }
      
      if (params.tds !== undefined) {
        if (params.tds > 500) issues++;
        else if (params.tds > 300) warnings++;
      }
      
      if (params.turbidity !== undefined) {
        if (params.turbidity > 10) issues++;
        else if (params.turbidity > 5) issues++;
        else if (params.turbidity > 1) warnings++;
      }
      
      if (issues > 0) {
        return { statusColor: '#F44336', statusText: 'Потребує уваги', statusIcon: 'alert-circle' };
      } else if (warnings > 0) {
        return { statusColor: '#FF9800', statusText: 'Прийнятна якість', statusIcon: 'warning-outline' };
      } else {
        return { statusColor: '#4CAF50', statusText: 'Відмінна якість', statusIcon: 'checkmark-circle' };
      }
    };    const waterAssessment = getQuickWaterAssessment(detailedParams);
    
    const handleInfoCardPress = () => {
      setShowDetailedView(true);
      translateX.value = withTiming(-screenWidth, { 
        duration: 300, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      });
    };

    // Компактна карточка з інформацією про пристрій
    return (
      <TouchableOpacity 
        style={[styles.infoCard, { borderLeftColor: waterAssessment.statusColor || Colors.light.tint }]}
        onPress={handleInfoCardPress}
        activeOpacity={0.7}
      >
        <Ionicons name="hardware-chip-outline" size={24} color={Colors.light.tint} />
        <View style={styles.cardTextContainer}>
          <ThemedText style={styles.cardTitle}>{currentDevice.customName}</ThemedText>
          <View style={styles.statusRow}>
            <View style={styles.connectionStatusItem}>
              <Ionicons 
                name={
                  connectionStatus === 'connected' ? 'wifi' :
                  connectionStatus === 'error' ? 'cloud-offline-outline' :
                  'cloud-outline'
                }
                size={14} 
                color={
                  connectionStatus === 'connected' ? Colors.light.success :
                  connectionStatus === 'error' ? Colors.light.error :
                  Colors.light.tabIconDefault
                }
              />
              <ThemedText style={[styles.statusText, {
                color: connectionStatus === 'connected' ? Colors.light.success :
                       connectionStatus === 'error' ? Colors.light.error :
                       Colors.light.tabIconDefault
              }]}>
                {connectionStatus === 'connected' ? 'Підключено' :
                 connectionStatus === 'error' ? 'Помилка' :
                 'Не підключено'}
              </ThemedText>
            </View>
            
            <View style={styles.waterQualityItem}>
              <Ionicons name={waterAssessment.statusIcon as any} size={14} color={waterAssessment.statusColor} />
              <ThemedText style={[styles.statusText, { color: waterAssessment.statusColor }]}>
                {waterAssessment.statusText}
              </ThemedText>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward-outline" size={16} color={Colors.light.tabIconDefault} />
      </TouchableOpacity>
    );
  };
  // Додаємо функцію для рендерингу карточки WQI діаграми
  const renderWQIChartCard = () => {
    if (!currentDevice || userDevices.length === 0) {
      return null;
    }    const handleWQICardPress = () => {
      setShowWQIChart(true);
    };

    return (
      <TouchableOpacity 
        style={styles.wqiChartCard}
        onPress={handleWQICardPress}
        activeOpacity={0.7}
      >
        <View style={styles.wqiChartCardHeader}>
          <Ionicons name="analytics-outline" size={24} color={Colors.light.tint} />
          <ThemedText style={styles.wqiChartCardTitle}>Індекс якості води (WQI)</ThemedText>
          <Ionicons name="chevron-forward-outline" size={20} color={Colors.light.tabIconDefault} />
        </View>
        
        <View style={styles.wqiChartCardContent}>
          <View style={styles.wqiScoreDisplay}>
            <ThemedText style={[styles.wqiScoreText, { color: getWaterQualityColor(score) }]}>
              {score}
            </ThemedText>
            <ThemedText style={styles.wqiScoreLabel}>WQI</ThemedText>
          </View>
          
          <View style={styles.wqiProgressContainer}>
            <View style={styles.wqiProgressBar}>
              <View 
                style={[
                  styles.wqiProgressFill, 
                  { 
                    width: `${score}%`,
                    backgroundColor: getWaterQualityColor(score)
                  }
                ]} 
              />
            </View>
            <View style={styles.wqiLabelsContainer}>
              <ThemedText style={styles.wqiProgressLabel}>0</ThemedText>
              <ThemedText style={styles.wqiProgressLabel}>50</ThemedText>
              <ThemedText style={styles.wqiProgressLabel}>100</ThemedText>
            </View>
          </View>
        </View>
        
        <ThemedText style={styles.wqiChartCardSubtitle}>
          Натисніть для перегляду детальної діаграми
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const handleDeleteDevice = (deviceId: string) => {
    Alert.alert(
      "Видалення пристрою",
      "Ви впевнені, що хочете видалити цей пристрій?",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Видалити", 
          style: "destructive",
          onPress: () => {
            const updatedDevices = userDevices.filter(device => device.id !== deviceId);
            setUserDevices(updatedDevices);
            
            // Якщо видаляємо поточний пристрій або список стає порожнім
            if (updatedDevices.length === 0 || deviceId === userDevices[currentDeviceIndex].id) {
              setCurrentDeviceIndex(0);
              setScore(0);
              setDetailedParams(null);
              setConnectionStatus('disconnected');
              setLastUpdateTimestamp(null);
            } 
            // Якщо видаляємо пристрій з індексом, меншим ніж поточний
            else if (userDevices.findIndex(d => d.id === deviceId) < currentDeviceIndex) {
              setCurrentDeviceIndex(currentDeviceIndex - 1);
            }
          }
        }
      ]
    );
  };

  // Додаємо визначення combinedGesture, яке було видалено
  const combinedGesture = showDeviceSelectionView 
    ? verticalSwipeGesture // Only allow vertical swipes when device selection is shown
    : Gesture.Race(panGesture, verticalSwipeGesture); // Normal gesture handling

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <WaveAnimation score={userDevices.length === 0 ? 50 : score} translateY={translateY} />
      
      <GestureDetector gesture={combinedGesture}>
        {/* This Animated.View needs a transparent background to see WaveAnimation behind it */}
        <Animated.View style={{ flex: 1, backgroundColor: 'transparent' }}> 
          {/* ThemedView also needs a transparent background */}
          <ThemedView style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* WaveAnimation is no longer here */}
              <Animated.View style={[styles.infoCardsContainer, animatedMainScreenStyle]}>
              {renderInfoCards()}
            </Animated.View>            <Animated.View style={[styles.mainContentContainer, animatedMainScreenStyle]}>
              {userDevices.length === 0 ? (
                <ScoreCircle
                  size={screenWidth * 0.55}
                  strokeWidth={15}
                  isAddMode={true}
                  onAddButtonPress={openAddDeviceModal}
                />
              ) : currentDevice && currentDevice.serverConfig ? (
                <ScoreCircle
                  key={currentDevice.id} 
                  size={screenWidth * 0.55}
                  strokeWidth={15}
                  initialScore={score}
                  serverEndpoint={CENTRAL_SERVER_ENDPOINT}
                  deviceId={currentDevice.serverConfig.deviceId}
                  onScoreUpdate={handleScoreUpdate}
                  onFetchError={handleFetchError}
                  onPress={handleScoreCirclePress}
                />
              ) : currentDevice ? (
                <View style={styles.centeredMessageContainer}>
                  <ActivityIndicator size="large" color={Colors.light.tint} />
                  <ThemedText style={styles.loadingText}>Конфігурація пристрою неповна...</ThemedText>
                </View>
              ) : (
                <View style={styles.centeredMessageContainer}>
                  <ActivityIndicator size="large" color={Colors.light.tint} />
                  <ThemedText style={styles.loadingText}>Завантаження даних пристрою...</ThemedText>
                </View>
              )}
            </Animated.View>

            {/* WQI Chart Card в нижній частині екрану */}
            <Animated.View style={[styles.wqiChartCardContainer, animatedMainScreenStyle]}>
              {renderWQIChartCard()}
            </Animated.View>          {userDevices.length > 0 && currentDevice && (
            <Animated.View style={[styles.detailedViewContainer, animatedDetailedViewStyle]}>
              <DetailedParametersView 
                parameters={detailedParams} 
                onRefresh={updateCurrentDeviceData}
                deviceId={currentDevice?.serverConfig?.deviceId || '111001'}
              />
            </Animated.View>
          )}

          {userDevices.length > 0 && currentDevice && (
            <Animated.View style={[styles.deviceStatusViewContainer, animatedDeviceStatusViewStyle]}> 
              <DeviceStatusView device={currentDevice} />
            </Animated.View>
          )}

          {/* Device Selection View */}
          {userDevices.length > 0 && (
            <Animated.View style={[styles.deviceSelectionViewContainer, animatedDeviceSelectionViewStyle]}>
              <DeviceSelectionView
                devices={userDevices}
                currentDeviceIndex={currentDeviceIndex}
                onDeviceSelect={handleDeviceSelect}
                onDeleteDevice={handleDeleteDevice} // Додаємо новий проп для видалення окремого пристрою
                // onClearDevices={handleClearDevices} // Прибираємо проп очищення списку
              />
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
            </View>          </Modal>
        </ThemedView>
      </Animated.View>
    </GestureDetector>
    
    {/* WQI Chart Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={showWQIChart}
      onRequestClose={() => setShowWQIChart(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: Colors.light.background,
          borderRadius: 20,
          padding: 20,
          margin: 20,
          width: screenWidth - 40,
          height: screenHeight * 0.7,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <ThemedText style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.text,
            }}>
              Індекс якості води (WQI)
            </ThemedText>
            <TouchableOpacity onPress={() => setShowWQIChart(false)}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
            <WQIChartView 
            deviceId={currentDevice?.serverConfig?.deviceId || '111001'}
          />
        </View>
      </View>
    </Modal>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: Colors.light.background, // Background is now on the root View
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
    top: Platform.OS === 'ios' ? 90 : 60, // Further increased top padding for iOS
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
  },  connectionIcon: {
    marginRight: 8, // Space between icon and status text
  },
  statusTextContainer: { // New container for status texts
    alignItems: 'flex-end', // Align text to the right if it wraps
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
  },  mainContentContainer: {
    flex: 1,
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -200, // Зміщуємо коло трішки вище центру
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  detailedViewContainer: {
    width: screenWidth,
    height: screenHeight, 
    backgroundColor: 'transparent', 
  },
  deviceStatusViewContainer: { 
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent', // Changed to transparent to show waves
    // position: 'absolute', // Already applied in animated style
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    // zIndex: 150, // Already applied in animated style
  },
  deviceSelectionViewContainer: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
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
  },  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },  infoCardsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 90,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  infoCard: {
    backgroundColor: Colors.light.background, 
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },  cardSubtitle: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  // Стилі для компактної карточки
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  waterQualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Стилі для карточки WQI діаграми
  wqiChartCardContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 120,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  wqiChartCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },  wqiChartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },wqiChartCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginLeft: 8,
  },
  wqiChartCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wqiScoreDisplay: {
    alignItems: 'center',
    marginRight: 16,
  },  wqiScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  wqiScoreLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  wqiProgressContainer: {
    flex: 1,
  },
  wqiProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  wqiProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  wqiLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  wqiProgressLabel: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
  },
  wqiChartCardSubtitle: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },
});
