import { Colors } from '@/constants/Colors'; // Import Colors for default tint
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Dimensions, NativeEventSubscription, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'; // Added NativeEventSubscription
import Animated, { Easing, interpolateColor, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg'; // Imported Circle
import { getWaterQualityColor } from '../utils/colorUtils';
import { calculateWQI } from '../utils/wqiUtils';
import { WaterParameters } from './DetailedParametersView'; // Import WaterParameters type

export interface ScoreCircleProps {
  initialScore?: number; // Made optional
  size: number;
  strokeWidth: number;
  serverEndpoint?: string; // Made optional
  deviceId?: string; // Made optional
  onScoreUpdate?: (score: number, detailedParams: any) => void;
  onFetchError?: (error: string) => void;
  isAddMode?: boolean;
  onAddButtonPress?: () => void;
  style?: ViewStyle;
  id?: string; // Додаємо властивість id для ідентифікації
  onManualRefresh?: () => void; // Новий проп для ручного оновлення
  onPress?: () => void; // Додаємо новий проп для обробки натискань
}

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const PAN_ACTIVATION_THRESHOLD = 10; // Minimum pixels to move before pan activates
const MIN_FETCH_INTERVAL = 10000; // 1 second - Defined MIN_FETCH_INTERVAL

// Використовуємо forwardRef для підтримки передачі ref
const ScoreCircle = forwardRef<any, ScoreCircleProps>(
  ({ 
    initialScore = 0,
    size,
    strokeWidth,
    serverEndpoint,
    deviceId,
    onScoreUpdate,
    onFetchError,
    isAddMode = false,
    onAddButtonPress,
    style,
    id, // Отримуємо id з пропсів
    onManualRefresh, // Додали новий проп
    onPress, // Отримуємо проп
  }, ref) => {
    const [currentScore, setCurrentScore] = useState(initialScore);
    const [wqiText, setWqiText] = useState('WQI');
    const [isLoading, setIsLoading] = useState(!isAddMode); // Only load if not in add mode
    const [error, setError] = useState<string | null>(null);
    const [detailedParameters, setDetailedParameters] = useState<WaterParameters | null>(null); // Reinstated: This state is used in fetchDataAndUpdateState

    const previousColorSV = useSharedValue(getWaterQualityColor(initialScore));
    const currentColorSV = useSharedValue(getWaterQualityColor(initialScore));
    const colorAnimation = useSharedValue(0); 
    const pressScale = useSharedValue(1);
    const appState = useRef(AppState.currentState);
    const updateIntervalRef = useRef<number | null>(null);
    const lastFetchTimeRef = useRef<number>(0);

    const defaultStrokeColor = Colors.light.tint; // Defined here

    // Define animated props for the circle's stroke property
    const animatedCircleStrokeProps = useAnimatedProps(() => {
      'worklet';
      if (isAddMode) {
        return {
          stroke: defaultStrokeColor, // Use static color in add mode
        };
      } else {
        return {
          stroke: currentColorSV.value, // Use shared value for dynamic color
        };
      }
    }, [isAddMode]); // Recreate worklet if isAddMode changes

    // Define fetchDataAndUpdateState before fetchDataRef
    const fetchDataAndUpdateState = useCallback(async (isInitialFetch = false) => {
      if (isAddMode || !serverEndpoint || !deviceId) {
        if (isAddMode && onAddButtonPress && isInitialFetch) { 
          // If it's a manual press on the add button, call onAddButtonPress
          // This logic might need refinement based on exact intention of isManualFetch vs isInitialFetch
          // For now, let's assume onAddButtonPress is called by the handlePress method directly for add mode.
        }
        return;
      }
      if (Date.now() - lastFetchTimeRef.current < MIN_FETCH_INTERVAL && !isInitialFetch) {
        // console.log("Fetch throttled");
        return;
      }
      lastFetchTimeRef.current = Date.now();
      // console.log(`Fetching data for device: ${deviceId} from ${serverEndpoint}`);
      setIsLoading(true);    setError(null);
      try {
        const response = await fetch(`http://${serverEndpoint}/api/getWQI?device=${deviceId}`);
        if (!response.ok) {
          const errorText = await response.text();
          // console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          throw new Error(`Помилка сервера: ${response.status} - ${errorText || 'Невідома помилка'}`);
        }        const data = await response.json();
        // console.log("Data fetched:", data);

        if (data && data.parameters) {          // Calculate WQI locally if server didn't provide it or to ensure consistency
          const localWQI = calculateWQI(data.parameters);
          const serverWQI = typeof data.wqi === 'number' && data.wqi > 0 ? data.wqi : 0;
          
          // Use the server WQI if available, otherwise use the locally calculated one
          const newScore = Math.max(0, Math.min(100, Math.round(serverWQI || localWQI)));
          
          setCurrentScore(newScore);
          setWqiText('WQI');
          colorAnimation.value = 0;
          colorAnimation.value = withTiming(1, { duration: 500 });
          previousColorSV.value = currentColorSV.value;
          currentColorSV.value = getWaterQualityColor(newScore);
          setDetailedParameters(data.parameters);
          if (onScoreUpdate) {
            runOnJS(onScoreUpdate)(newScore, data.parameters);
          }
        } else {
          // console.error("Invalid data structure received:", data);
          throw new Error('Некоректна структура даних від сервера.');
        }
      } catch (e: any) {
        // console.error("Failed to fetch WQI data:", e);
        setError(e.message || 'Не вдалося завантажити дані. Перевірте з\'єднання.');
        if (onFetchError) {
          // runOnJS(onFetchError)(e); // Changed to pass e.message
          runOnJS(onFetchError)(e.message || 'Unknown fetch error');
        }
      } finally {
        setIsLoading(false);
      }
    }, [serverEndpoint, deviceId, /*currentScore,*/ previousColorSV, currentColorSV, colorAnimation, onScoreUpdate, onFetchError, isAddMode, onAddButtonPress]); // Removed currentScore from deps as it causes re-creation too often, added onAddButtonPress
    
    const fetchDataRef = useRef(fetchDataAndUpdateState);

    useEffect(() => {
      fetchDataRef.current = fetchDataAndUpdateState;
    }, [fetchDataAndUpdateState]);

    // Використовуємо радіус з пропсів, а не з глобальних констант
    const actualRadius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * actualRadius;

    // useEffect for AppState listener - REMOVING LOGS
    useEffect(() => {
      if (isAddMode || !serverEndpoint || !deviceId) {
        return;
      }

      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          fetchDataRef.current();
        }
        appState.current = nextAppState;
      };

      let appStateSubscription: NativeEventSubscription | undefined;

      try {
        fetchDataRef.current(true); // Initial fetch
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        if (subscription && typeof subscription.remove === 'function') {
          appStateSubscription = subscription; 
        } else {
          // console.warn("ScoreCircle: AppState.addEventListener did not return a valid subscription object. DeviceID:", deviceId, "Returned value:", subscription);
        }
      } catch (e) {
        // console.error("ScoreCircle: Error during AppState.addEventListener or initial fetch:", e, "DeviceID:", deviceId);
        return; 
      }

      return () => {
        if (appStateSubscription) { 
          try {
            appStateSubscription.remove();
          } catch (e) {
            // console.error("ScoreCircle AppState Cleanup: Error during appStateSubscription.remove() call:", e, "DeviceID:", deviceId, "Subscription object:", appStateSubscription);
          }
        }
      };
    }, [isAddMode, serverEndpoint, deviceId]); // Dependencies: re-run if these change. fetchDataRef and appState.current are stable.

    useEffect(() => {
      if (isAddMode || !serverEndpoint || !deviceId) {
        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }
        return;
      }
      
      const intervalId = setInterval(() => {
        fetchDataAndUpdateState();
      }, 300000); // 5 minutes
      updateIntervalRef.current = intervalId; // This should now be compatible

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    }, [isAddMode, serverEndpoint, deviceId, fetchDataAndUpdateState]); // Added fetchDataAndUpdateState to dependencies

    // Створюємо анімацію масштабування
    const scale = useSharedValue(1);
    
    // Ефект анімації натискання
    const animatedScaleStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });
    
    // Функція для анімації натискання
    const animatePress = () => {
      scale.value = withSequence(
        withTiming(0.95, { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      );
    };

    // Оновлена функція обробки натискання
    const handlePress = () => {
      // Запускаємо анімацію масштабування
      animatePress();

      // Якщо режим додавання, викликаємо відповідний обробник
      if (isAddMode && onAddButtonPress) {
        onAddButtonPress();
        return;
      }

      // Якщо є зовнішній обробник натискання, викликаємо його
      if (onPress) {
        onPress();
        return;
      }
      
      // Після цього виконуємо стандартну логіку оновлення даних
      if (!isAddMode && serverEndpoint && deviceId) {
        fetchDataAndUpdateState();
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: pressScale.value }],
      };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
      const textColor = interpolateColor(
        currentScore,
        [0, 20, 40, 60, 80, 100],
        ['#FF0000', '#FF4500', '#FFD700', '#9ACD32', '#32CD32', '#006400'] // Example: Red to Dark Green
      );
      return {
        color: textColor,
      };
    });

    const animatedWqiTextStyle = useAnimatedStyle(() => {
      'worklet';
      if (isAddMode) {
        return {
          color: defaultStrokeColor, // Or some other default/neutral color for add mode
        };
      }
      return {
        color: currentColorSV.value,
      };
    }, [isAddMode]); // Dependency: isAddMode
    
    // Define animated props for the inner Circle's stroke property
    const innerCircleAnimatedProps = useAnimatedProps(() => {
      'worklet';
      if (isAddMode) {
        return {
          stroke: defaultStrokeColor,
        };
      }
      return {
        stroke: currentColorSV.value,
      };
    }, [isAddMode]); // Dependency: isAddMode

    return (
      <TouchableOpacity 
        ref={ref}
        onPress={handlePress} 
        activeOpacity={0.8}
        id={id} // Додаємо id до TouchableOpacity для ідентифікації
      >
        <Animated.View style={[styles.container, animatedStyle, animatedScaleStyle, { width: size, height: size }]}>          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <AnimatedCircle // Changed to AnimatedCircle to use animatedProps
              cx={size / 2}
              cy={size / 2}
              r={actualRadius}
              strokeWidth={strokeWidth - (Platform.OS === 'ios' ? 1 : 2)} 
              animatedProps={innerCircleAnimatedProps} // Use animated props for stroke color
              strokeOpacity={0.3} 
              fill="transparent"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={actualRadius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={isAddMode ? 0 : circumference * (1 - currentScore / 100)}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              fill="transparent"
              animatedProps={animatedCircleStrokeProps} // Use the new unified animated props
            />
          </Svg>
          <View style={styles.textContainer}>
            {isAddMode ? (
              <Ionicons name="add" size={size * 0.4} color={defaultStrokeColor} />
            ) : isLoading && currentScore === 0 && !error ? ( // Show loader only if score is 0 and no error
              <ActivityIndicator size="large" color={defaultStrokeColor} />
            ) : error ? (
              <>
                <Text style={[styles.errorTextSmall, { fontSize: size * 0.08 }]}>Помилка</Text>
                <Text style={[styles.errorTextDetails, { fontSize: size * 0.06 }]}>{error.length > 50 ? error.substring(0, 47) + "..." : error}</Text>
              </>
            ) : (
              <>
                <Animated.Text style={[styles.scoreText, { fontSize: size * 0.3 }, animatedTextStyle]}>
                  {currentScore.toFixed(0)}
                </Animated.Text>
                <Animated.Text style={[styles.wqiText, { fontSize: size * 0.1 }, animatedWqiTextStyle]}> {/* Changed to Animated.Text and use animatedWqiTextStyle */}
                  {wqiText}
                </Animated.Text>
              </>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

// Додаємо displayName для дебагу
ScoreCircle.displayName = 'ScoreCircle';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Shadow for Android
    elevation: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed-bold',
  },
  wqiText: {
    // fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'sans-serif-condensed-medium',
    marginTop: Platform.OS === 'ios' ? -5 : -10, // Adjust as needed for font
  },
  errorTextSmall: {
    color: Colors.light.text, // Changed to Colors.light.text as errorText is not defined
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorTextDetails: {
    color: Colors.light.text, // Changed to Colors.light.text as errorText is not defined
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ScoreCircle;