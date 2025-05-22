import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Svg, Circle as SvgCircle } from 'react-native-svg';
import { getWaterQualityColor } from '../utils/colorUtils';

interface ScoreCircleProps {
  initialScore: number;
  onScoreUpdate?: (newScore: number) => void;
}

const { width } = Dimensions.get('window');
const circleSize = width * 0.6;
const strokeWidth = 15;
const radius = (circleSize - strokeWidth) / 2;

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

const ScoreCircle: React.FC<ScoreCircleProps> = ({ initialScore, onScoreUpdate }) => {
  const [currentScore, setCurrentScore] = useState(initialScore);
  const [isLoading, setIsLoading] = useState(false);
  
  // Замінюємо useRef на useSharedValue для кольорів
  const previousColorSV = useSharedValue(getWaterQualityColor(initialScore));
  const currentColorSV = useSharedValue(getWaterQualityColor(initialScore));
  const colorAnimation = useSharedValue(0); // 0 = початок анімації, 1 = кінець

  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Оновлюємо колір при зміні initialScore ззовні
    previousColorSV.value = currentColorSV.value; // Попередній колір - це поточний цільовий колір перед зміною
    currentColorSV.value = getWaterQualityColor(initialScore);
    
    setCurrentScore(initialScore); // Оновлюємо текст рахунку

    colorAnimation.value = 0; // Скидаємо анімацію
    colorAnimation.value = withTiming(1, { duration: 1500 }); // Запускаємо анімацію до нового кольору
  }, [initialScore]); // Залежність тільки від initialScore


  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  const handleScoreUpdate = async () => {
    console.log('Fetching Water Quality from Node-RED...');
    setIsLoading(true);
    try {
      // Замініть localhost на IP вашого комп'ютера, якщо тестуєте на фізичному пристрої
      const response = await fetch('http://192.168.1.103:1880/getWQI');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
  
      if (data && typeof data.wqi === 'number') {
        const newWQI = data.wqi;
        const waterParameters = data.parameters; // Об'єкт з pH, temp, etc.
  
        console.log('Received WQI:', newWQI);
        console.log('Water Parameters:', waterParameters);
  
        // Оновлення кольору та тексту для WQI
        const newTargetColor = getWaterQualityColor(newWQI); // Ваша функція getWaterQualityColor може потребувати адаптації під діапазон WQI (0-100)
  
        previousColorSV.value = currentColorSV.value;
        currentColorSV.value = newTargetColor;
  
        setCurrentScore(newWQI); // Тут currentScore тепер представляє WQI
        if (onScoreUpdate) {
          onScoreUpdate(newWQI); // Передаємо WQI батьківському компоненту
        }
  
        // Тут ви можете оновити стан для інших параметрів води, якщо хочете їх десь відобразити
        // setDetailedParameters(waterParameters);
  
        colorAnimation.value = 0;
        colorAnimation.value = withTiming(1, { duration: 500 });
  
      } else {
        console.error('Invalid data format from Node-RED. Expected { "wqi": number, ... }:', data);
        throw new Error('Invalid data format from Node-RED.');
      }
    } catch (error) {
      console.error("Failed to fetch Water Quality:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const animatedVisualCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
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
    <View style={styles.outerContainer}>
      {/* Візуальна частина кола */}
      <Animated.View style={[styles.visualCircle, animatedVisualCircleStyle]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { // Контейнер для обох шарів
    width: circleSize,
    height: circleSize,
    marginVertical: 30,
    position: 'relative', // Важливо для абсолютного позиціонування touchableOverlay
    // backgroundColor: 'rgba(0, 0, 255, 0.2)', // Для налагодження розмірів outerContainer
    zIndex: 5
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
    zIndex: 20
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