import React, { useEffect, useRef, useState } from 'react'; // Added useRef
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Added Alert
import Animated, { interpolateColor, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Svg, Circle as SvgCircle } from 'react-native-svg';
import { getWaterQualityColor } from '../utils/colorUtils';
import { WaterParameters } from './DetailedParametersView'; // Import WaterParameters type

interface ScoreCircleProps {
  initialScore: number;
  onScoreUpdate?: (newScore: number, parameters?: WaterParameters) => void; // Modified to include parameters
  // onSwipeLeft?: () => void; // Removed: Swipe will be handled by parent screen
}

const { width } = Dimensions.get('window');
const circleSize = width * 0.6;
const strokeWidth = 15;
const radius = (circleSize - strokeWidth) / 2;

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);
const PAN_ACTIVATION_THRESHOLD = 10; // Minimum pixels to move before pan activates

const ScoreCircle: React.FC<ScoreCircleProps> = ({ initialScore, onScoreUpdate }) => { // Removed onSwipeLeft from props
  const [currentScore, setCurrentScore] = useState(initialScore);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedParameters, setDetailedParameters] = useState<WaterParameters | null>(null); // Reinstated: This state is used in fetchDataAndUpdateState

  const previousColorSV = useSharedValue(getWaterQualityColor(initialScore));
  const currentColorSV = useSharedValue(getWaterQualityColor(initialScore));
  const colorAnimation = useSharedValue(0); 
  const pressScale = useSharedValue(1);
  // const offsetX = useSharedValue(0); // Removed: Swipe gesture handled by parent

  // --- Auto-update logic ---
  const intervalIdRef = useRef<number | null>(null); // Changed type to number for cross-platform compatibility with setInterval return type
  const AUTO_UPDATE_INTERVAL = 5000; // 10 seconds

  const fetchDataAndUpdateState = async (showLoading: boolean = true) => {
    if (showLoading) {
      runOnJS(setIsLoading)(true); // Ensure state update is on JS thread
    }
    console.log('Fetching Water Quality from Node-RED...');
    try {
      const response = await fetch('http://192.168.1.103:1880/getWQI');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && typeof data.wqi === 'number') {
        const newWQI = data.wqi;
        const receivedParameters: WaterParameters = data.parameters || {};

        runOnJS(setDetailedParameters)(receivedParameters);
        runOnJS(setCurrentScore)(newWQI);

        const newTargetColor = getWaterQualityColor(newWQI);
        previousColorSV.value = currentColorSV.value;
        currentColorSV.value = newTargetColor;
        colorAnimation.value = 0;
        colorAnimation.value = withTiming(1, { duration: 500 });

        if (onScoreUpdate) {
          runOnJS(onScoreUpdate)(newWQI, receivedParameters);
        }
      } else {
        console.error('Invalid data format from Node-RED. Expected { "wqi": number, "parameters": object }:', data);
        // runOnJS(Alert.alert)("Помилка", "Не вдалося оновити дані: невірний формат.");
      }
    } catch (error) {
      console.error("Failed to fetch Water Quality:", error);
      // runOnJS(Alert.alert)("Помилка", "Не вдалося підключитися до сервера для оновлення даних.");
    } finally {
      if (showLoading) {
        runOnJS(setIsLoading)(false); // Ensure state update is on JS thread
      }
    }
  };

  useEffect(() => {
    // Initial fetch can be done here if initialScore is just a placeholder
    // fetchDataAndUpdateState(true); 

    // Setup interval for auto-update
    // Explicitly cast to any to satisfy TypeScript if environment differences cause issues, 
    // or ensure correct NodeJS.Timeout vs number typing based on project setup.
    intervalIdRef.current = setInterval(() => {
      fetchDataAndUpdateState(false); // Auto-update in background
    }, AUTO_UPDATE_INTERVAL) as any; // Added 'as any' to handle potential type mismatch for setInterval return

    // Cleanup interval on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  useEffect(() => {
    previousColorSV.value = currentColorSV.value;
    currentColorSV.value = getWaterQualityColor(initialScore);
    setCurrentScore(initialScore);
    colorAnimation.value = 0;
    colorAnimation.value = withTiming(1, { duration: 1500 });
  }, [initialScore]);

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  const handleScoreUpdate = () => {
    fetchDataAndUpdateState(true); // Manual update shows loading indicator
  };

  const animatedPressStyle = useAnimatedStyle(() => { // Renamed from animatedSwipeStyle
    return {
      transform: [{ scale: pressScale.value }], // Only scale is needed now
    };
  });

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeColor = interpolateColor(
      colorAnimation.value, // Прогрес анімації
      [0, 1], // Діапазон вхідних значень
      [previousColorSV.value, currentColorSV.value] // Кольори для інтерполяції
    );
    return {
      stroke: strokeColor,
    };
  }, []); // Залежності не потрібні, оскільки worklet автоматично оновлюється при зміні shared values

  // Поточний колір для ActivityIndicator (змінюється миттєво)
  const activityIndicatorColor = getWaterQualityColor(currentScore);

  return (
    // <GestureDetector gesture={panGesture}> // GestureDetector removed
      <Animated.View style={[styles.outerContainer, animatedPressStyle]}> {/* Used animatedPressStyle */}
        {/* Візуальна частина кола */}
        <Animated.View style={[styles.visualCircle]}>
          <Svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
            <AnimatedCircle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              // stroke={color} // Replaced by animatedProps
              animatedProps={animatedCircleProps}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          </Svg>
        <TouchableOpacity
          style={styles.touchableOverlay}
          onPress={handleScoreUpdate}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7} // Можна залишити стандартну або трохи змінити
        />
          <View style={styles.textVisualContainer} pointerEvents="none">
            {isLoading ? (
              <ActivityIndicator size="large" color={activityIndicatorColor} />
            ) : (
              <>
                <Text style={styles.scoreText}>{currentScore}</Text>
                <Text style={styles.aqiText}>WQI</Text>
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    // </GestureDetector> // GestureDetector removed
  );
};

const styles = StyleSheet.create({
  outerContainer: { // Контейнер для обох шарів
    width: circleSize,
    height: circleSize,
    marginVertical: 30,
    position: 'relative', // Важливо для абсолютного позиціонування touchableOverlay
    // backgroundColor: 'rgba(0, 0, 255, 0.2)', // Для налагодження розмірів outerContainer
    zIndex: 100
  },
  visualCircle: { // Візуальна частина
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    // backgroundColor: 'rgba(0, 255, 0, 0.2)', // Для налагодження розмірів visualCircle
    // Тіні
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Для Android тіней
  },
  textVisualContainer: { // Контейнер для тексту, всередині візуальної частини
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5
  },
  touchableOverlay: { // Шар для дотиків
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%', // Заповнює outerContainer
    height: '100%', // Заповнює outerContainer
    borderRadius: circleSize / 2, // Якщо ви хочете, щоб він мав круглу форму (для візуалізації з фоном)
    zIndex: 1000
  },
  scoreText: {
    fontSize: circleSize * 0.3,
    fontWeight: 'bold',
    color: '#000',
    zIndex: 5
  },
  aqiText: {
    fontSize: circleSize * 0.1,
    color: '#555',
    marginTop: 5,
    zIndex: 5
  },
});

export default ScoreCircle;