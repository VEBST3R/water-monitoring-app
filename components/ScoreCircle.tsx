import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Dimensions, NativeEventSubscription, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { Easing, interpolateColor, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import { getWaterQualityColor } from '../utils/colorUtils';
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
const circleSize = width * 0.6;
const strokeWidth = 15;
const radius = (circleSize - strokeWidth) / 2;

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
    const [isAnimating, setIsAnimating] = useState(false); // Додаємо стан для відстеження анімації

    // Анімоване значення для плавної зміни заповнення кола
    const animatedScoreValue = useSharedValue(initialScore);
    const previousColorSV = useSharedValue(getWaterQualityColor(initialScore));
    const currentColorSV = useSharedValue(getWaterQualityColor(initialScore));
    const colorAnimation = useSharedValue(0); 
    const pressScale = useSharedValue(1);
    const appState = useRef(AppState.currentState);
    const updateIntervalRef = useRef<number | null>(null);
    const lastFetchTimeRef = useRef<number>(0);

    // Переносимо розрахунок circumference на початок функції
    const circumference = 2 * Math.PI * radius;

    const defaultStrokeColor = Colors.light.tint; // Defined here

    // Створюємо анімований проп для strokeDashoffset
    const animatedCircleProps = useAnimatedProps(() => {
      const strokeDashoffset = circumference * (1 - animatedScoreValue.value / 100);
      return {
        strokeDashoffset: strokeDashoffset,
      };
    });

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

    // Виправляємо анімовані пропси для кола прогресу
    const animatedProgressProps = useAnimatedProps(() => {
      'worklet';
      // Виправляємо розрахунок прогресу
      // Ми хочемо, щоб коло було заповнене точно на animatedScoreValue.value відсотків
      const progress = isAddMode ? 0 : animatedScoreValue.value / 100;
      
      return {
        stroke: isAddMode ? defaultStrokeColor : currentColorSV.value,
        // Правильна формула для strokeDashoffset: коли progress=0, dashoffset=circumference (порожнє коло)
        // Коли progress=1 (100%), dashoffset=0 (повне коло)
        strokeDashoffset: circumference * (1 - progress),
      };
    }, [isAddMode, circumference]); // Прибираємо залежності, які спричиняють проблему

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
        }
        const data = await response.json();
        // console.log("Data fetched:", data);

        if (data && typeof data.wqi === 'number' && data.parameters) {
          const newScore = Math.max(0, Math.min(100, Math.round(data.wqi)));
          
          // Оновлюємо стан React (currentScore) перед запуском анімації
          // Це допоможе useEffect мати актуальне значення currentScore, коли анімація завершиться
          setCurrentScore(newScore);
          
          // Запускаємо анімацію від поточного значення до нового
          if (!isInitialFetch) {
            // oldScore тут передається для контексту, але сама логіка анімації 
            // animateScoreChange вже не використовує його для визначення початкової точки анімації до 0.
            // Передаємо newScore як цільове значення для анімації.
            animateScoreChange(newScore); 
          } else {
            // Якщо це перше завантаження, просто встановлюємо значення без анімації
            animatedScoreValue.value = newScore;
            displayedScoreValue.value = newScore; 
          }
          
          setWqiText('WQI');
          colorAnimation.value = 0;
          colorAnimation.value = withTiming(1, { duration: 500 });
          previousColorSV.value = currentColorSV.value;
          currentColorSV.value = getWaterQualityColor(newScore);
          
          if (onScoreUpdate) {
            onScoreUpdate(newScore, data.parameters);
          }
        } else {
          // console.error("Invalid data structure received:", data);
          throw new Error('Некоректна структура даних від сервера.');
        }
      } catch (e: any) {
        // console.error("Failed to fetch WQI data:", e);
        setError(e.message || 'Не вдалося завантажити дані. Перевірте з\'єднання.');
        if (onFetchError) {
          // runOnJS(onFetchError)(e.message);
          runOnJS(onFetchError)(e.message || 'Unknown fetch error');
        }
      } finally {
        setIsLoading(false);
      }
    }, [serverEndpoint, deviceId, previousColorSV, currentColorSV, colorAnimation, onScoreUpdate, onFetchError, isAddMode, onAddButtonPress, currentScore]); // currentScore залишається в залежностях, оскільки використовується для порівняння oldScore

    const fetchDataRef = useRef(fetchDataAndUpdateState);

    useEffect(() => {
      fetchDataRef.current = fetchDataAndUpdateState;
    }, [fetchDataAndUpdateState]);

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

    // Додамо анімацію масштабування для кола при оновленні
    const circleScale = useSharedValue(1);
    
    // Анімований стиль для масштабування кола
    const animatedCircleScale = useAnimatedStyle(() => {
      return {
        transform: [{ scale: circleScale.value }],
      };
    });

    // Додаємо окреме анімоване значення для відображення числа
    const displayedScoreValue = useSharedValue(initialScore);

    // Оновлена функція для анімації скидання та наповнення. Параметр oldScore видалено, оскільки він не використовувався.
    const animateScoreChange = (newScore: number, skipDebounce: boolean = false) => {
      // Завжди дозволяємо анімацію при skipDebounce=true
      if (isAnimating && !skipDebounce) return;
      
      // Встановлюємо стан анімації
      setIsAnimating(true);

      // Додаємо анімацію масштабування - ефект пульсації
      circleScale.value = withSequence(
        withTiming(1.05, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0.95, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      
      // Анімуємо число до 0 разом із колом
      displayedScoreValue.value = withTiming(0, {
        duration: 600, // Тривалість падіння до 0
        easing: Easing.out(Easing.cubic),
      });
      
      // Анімуємо прогрес кола до 0
      animatedScoreValue.value = withTiming(0, {
        duration: 600, // Тривалість падіння до 0
        easing: Easing.out(Easing.cubic),
      });
      
      // Після паузи анімуємо до цільового значення (і число, і коло)
      displayedScoreValue.value = withDelay(650, withTiming(newScore, { // 600мс падіння + 50мс затримка
        duration: 800, // Тривалість підйому
        easing: Easing.out(Easing.cubic), // Змінено на більш плавний easing
      }));
      
      animatedScoreValue.value = withDelay(650, withTiming(newScore, { // 600мс падіння + 50мс затримка
        duration: 800, // Тривалість підйому
        easing: Easing.out(Easing.cubic), // Змінено на більш плавний easing
      }, (finished) => {
        if (finished) {
          runOnJS(setIsAnimating)(false);
        }
      }));
    };

    // Гарантуємо, що handlePress завжди запускає помітну анімацію
    const handlePress = () => {
      // Масштабування всієї кнопки
      animatePress();

      if (isAddMode && onAddButtonPress) {
        onAddButtonPress();
        return;
      }

      if (!isAddMode) {
        // Гарантуємо запуск анімації навіть для зовнішнього обробника
        if (onPress) {
          // Явно запускаємо анімацію відразу: скидання до 0 і наповнення до поточного значення
          // displayedScoreValue.value використовується як початкова точка для анімації до 0
          animateScoreChange(currentScore > 0 ? currentScore : 50, true);
          // І тільки потім викликаємо обробник
          setTimeout(() => onPress(), 50);
          return;
        }
        
        if (serverEndpoint && deviceId) {
          // Явно запускаємо анімацію відразу: скидання до 0 і наповнення до поточного значення (або 50, якщо поточне 0)
          // displayedScoreValue.value використовується як початкова точка для анімації до 0
          animateScoreChange(currentScore > 0 ? currentScore : 50, true);
          // Запит на сервер після невеликої затримки
          setTimeout(() => fetchDataAndUpdateState(), 50);
        }
      }
    };
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: pressScale.value }],
      };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
      const textColor = interpolateColor(
        animatedScoreValue.value, // Використовуємо анімоване значення для плавності кольору
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

    // Модифікуємо useEffect для синхронізації обох анімованих значень 
    useEffect(() => {
      // Важливо: якщо ми не в процесі анімації, треба оновити animatedScoreValue
      if (!isAnimating) {
        // Оновлюємо обидва анімовані значення
        // Використовуємо коротшу, лінійну анімацію для швидкої синхронізації,
        // якщо значення розійшлися, або миттєве оновлення, якщо вони вже рівні.
        animatedScoreValue.value = withTiming(currentScore, { duration: 150, easing: Easing.linear });
        displayedScoreValue.value = withTiming(currentScore, { duration: 150, easing: Easing.linear });
      }
    }, [currentScore, isAnimating]); // Залежності залишаємо ті ж самі
    
    return (
      <TouchableOpacity 
        ref={ref}
        onPress={handlePress} 
        activeOpacity={0.8}
        id={id}
      >
        <Animated.View style={[styles.container, animatedStyle, animatedScaleStyle, { width: size, height: size }]}>
          <Animated.View style={[{ width: size, height: size }, animatedCircleScale]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Фонове коло */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth - (Platform.OS === 'ios' ? 1 : 2)} 
                animatedProps={innerCircleAnimatedProps}
                strokeOpacity={0.2} // Збільшуємо прозорість для кращого контрасту
                fill="transparent"
              />
              
              {/* Прогрес-коло - використовуємо лише animatedProgressProps */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                fill="transparent"
                animatedProps={animatedProgressProps}
              />
            </Svg>
          </Animated.View>
          
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
                <Animated.Text 
                  style={[styles.scoreText, { fontSize: size * 0.3 }, animatedTextStyle]}
                  // Повертаємо відображення тексту як дочірнього елемента
                >
                  {Math.round(displayedScoreValue.value)}
                </Animated.Text>
                <Animated.Text style={[styles.wqiText, { fontSize: size * 0.1 }, animatedWqiTextStyle]}>
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