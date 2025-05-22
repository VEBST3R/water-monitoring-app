import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { getWaveColor } from '../utils/colorUtils'; // Переконайтесь, що шлях правильний

interface WaveAnimationProps {
  score: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const waveVisualHeight = screenHeight * 0.7; // Візуальна висота області хвиль
// Довжина одного повного циклу синусоїди для кожної хвилі.
// Має бути принаймні screenWidth для покриття екрану.
// * 1.5 або * 2 робить криву плавнішою на вигляд в межах одного сегменту.
const individualWavePathLength = screenWidth * 1.5; // Довжина одного циклу синусоїди

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Функція для генерації шляху синусоїдальної хвилі
const createSineWavePath = (
  amplitude: number,      // Амплітуда хвилі в пікселях
  wavelength: number,     // Довжина однієї повної хвилі (циклу)
  totalVisualHeight: number // Загальна висота SVG контейнера для цієї хвилі
) => {
  const midY = totalVisualHeight / 2; // Середня лінія хвилі

  // Використання квадратичних кривих Безьє для плавнішої синусоїди
  // Один цикл: M -> Q -> Q
  const startX = 0;
  const startY = midY;

  // Перша половина синусоїди (наприклад, гребінь)
  const cp1X = wavelength / 4;
  const cp1Y = midY - amplitude; // Пік або западина, почнемо з гребеня
  const p1X = wavelength / 2;
  const p1Y = midY;

  // Друга половина синусоїди (наприклад, западина)
  const cp2X = (wavelength * 3) / 4;
  const cp2Y = midY + amplitude; // Западина або пік
  const endX = wavelength;
  const endY = midY;

  // M (початок) Q (контрольна точка, кінець) Q (контрольна точка, кінець) L (лінії для заповнення) Z (закрити)
  return `M ${startX},${startY} Q ${cp1X},${cp1Y} ${p1X},${p1Y} Q ${cp2X},${cp2Y} ${endX},${endY} L ${wavelength},${totalVisualHeight} L 0,${totalVisualHeight} Z`;
};


const WaveAnimation: React.FC<WaveAnimationProps> = ({ score }) => {
  const waveProgress1 = useSharedValue(0); // 0 to 1
  const waveProgress2 = useSharedValue(0); // 0 to 1
  const waveProgress3 = useSharedValue(0); // 0 to 1

  // Shared values для анімації кольору хвиль
  const previousWaveColorSV = useSharedValue(getWaveColor(score));
  const currentWaveColorSV = useSharedValue(getWaveColor(score));
  const waveColorAnimationProgress = useSharedValue(0); // 0 = початок, 1 = кінець

  // Оновлення та анімація кольору при зміні score
  useEffect(() => {
    previousWaveColorSV.value = currentWaveColorSV.value;
    currentWaveColorSV.value = getWaveColor(score);
    waveColorAnimationProgress.value = 0;
    waveColorAnimationProgress.value = withTiming(1, { duration: 500 }); // Тривалість анімації кольору
  }, [score]);

  // Параметри для кожної хвилі (стабільні після першого рендеру)
  const waveParams = useMemo(() => {
    return [
      // Шар 1 (найнижчий, найповільніший)
      { id: 'w1', duration: (9000 + Math.random() * 4000), amplitudeFactor: 0.06 + Math.random() * 0.03, opacity: 1, offsetYFactor: 0, initialDirection: Math.random() < 0.5 ? 1 : -1 }, // Змінено діапазон рандомізації
      // Шар 2 (середній)
      { id: 'w2', duration: (7500 + Math.random() * 4000), amplitudeFactor: 0.03 + Math.random() * 0.02, opacity: 0.50, offsetYFactor: 0.1, initialDirection: Math.random() < 0.5 ? 1 : -1 }, // Змінено діапазон рандомізації
      // Шар 3 (верхній, найшвидший)
      { id: 'w3', duration: (4500 + Math.random() * 4000), amplitudeFactor: 0.06 + Math.random() * 0.03, opacity: 0.25, offsetYFactor: 0.25, initialDirection: Math.random() < 0.5 ? 1 : -1 }, // Змінено діапазон рандомізації
    ];
   
  }, []); // Пустий масив залежностей: рандомізація один раз при монтуванні

  // SVG шляхи для кожної хвилі
  const wavePaths = useMemo(() => {
    return waveParams.map(params =>
      createSineWavePath(
        params.amplitudeFactor * waveVisualHeight, // Амплітуда як частка від висоти хвилі
        individualWavePathLength,
        waveVisualHeight
      )
    );
   
  }, [waveParams]);

  useEffect(() => {
    // ВАЖЛИВО: Якщо хвилі "тікають", це означає, що withRepeat, ймовірно, не працює
    // у вашому середовищі. ПЕРЕВІРТЕ BABEL.CONFIG.JS ТА ВСТАНОВЛЕННЯ REANIMATED!
    waveProgress1.value = withRepeat(withTiming(1, { duration: waveParams[0].duration, easing: Easing.inOut(Easing.quad) }), -1, true); // Змінено Easing
    waveProgress2.value = withRepeat(withTiming(1, { duration: waveParams[1].duration, easing: Easing.inOut(Easing.quad) }), -1, true); // Змінено Easing
    waveProgress3.value = withRepeat(withTiming(1, { duration: waveParams[2].duration, easing: Easing.inOut(Easing.quad) }), -1, true); // Змінено Easing
  
    return () => {
      cancelAnimation(waveProgress1);
      cancelAnimation(waveProgress2);
      cancelAnimation(waveProgress3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveParams]);

  const animatedPathProps = useAnimatedProps(() => {
    const fillColor = interpolateColor(
      waveColorAnimationProgress.value,
      [0, 1],
      [previousWaveColorSV.value, currentWaveColorSV.value]
    );
    return {
      fill: fillColor,
    };
  }, []); // Залежності не потрібні, worklet оновлюється при зміні shared values

  // Анімовані стилі для кожного шару
  // translateX рухає контейнер хвиль на довжину одного сегменту шляху
  const animatedStyles = [
    useAnimatedStyle(() => {
      // waveProgress1.value goes 0 -> 1 (forward) and then 1 -> 0 (reverse due to withRepeat's third arg being true)
      // initialDirection = 1: Start R->L (0 to -L), then L->R (-L to 0)
      // initialDirection = -1: Start L->R (-L to 0), then R->L (0 to -L)
      
      const progress = waveParams[0].initialDirection === 1 
        ? waveProgress1.value  // Moves 0 -> 1 -> 0
        : (1 - waveProgress1.value); // Effectively starts from the "end" of the 0->1 phase, moving 1 -> 0 -> 1

      const xTranslate = progress * -individualWavePathLength;
      return {
        transform: [
          { scaleX: 1 },
          { translateX: xTranslate }
        ],
      };
    }),
    useAnimatedStyle(() => {
      const progress = waveParams[1].initialDirection === 1
        ? waveProgress2.value
        : (1 - waveProgress2.value);
      const xTranslate = progress * -individualWavePathLength;
      return {
        transform: [
          { scaleX: 1 },
          { translateX: xTranslate }
        ],
      };
    }),
    useAnimatedStyle(() => {
      const progress = waveParams[2].initialDirection === 1
        ? waveProgress3.value
        : (1 - waveProgress3.value);
      const xTranslate = progress * -individualWavePathLength;
      return {
        transform: [
          { scaleX: 1 },
          { translateX: xTranslate }
        ],
      };
    }),
  ];

  const layerBaseOffsetY = waveVisualHeight * 0.25; // Базове вертикальне зміщення між шарами

  return (
    <View style={styles.mainContainer}>
      {waveParams.map((params, index) => {
        const style = animatedStyles[index];
        const dPath = wavePaths[index];

        return (
          <Animated.View
            key={params.id}
            style={[
              styles.waveContentHolder, // Цей View анімується (трансформується)
              style,
              {
                zIndex: index + 1, // Шари накладаються один на одного
                // Вертикальне зміщення для кожного шару для ефекту глибини
                bottom: layerBaseOffsetY * params.offsetYFactor,
              }
            ]}
          >
            {/* SVG контейнер має подвійну ширину одного шляху хвилі */}
            <Svg height={waveVisualHeight} width={individualWavePathLength * 2}>
              {/* Перший сегмент хвилі */}
              <AnimatedPath d={dPath} animatedProps={animatedPathProps} fillOpacity={params.opacity} />
              {/* Другий сегмент, ідентичний першому, розміщений праворуч від нього */}
              <AnimatedPath d={dPath} animatedProps={animatedPathProps} fillOpacity={params.opacity} transform={`translate(${individualWavePathLength}, 0)`} />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { // Це "вікно перегляду" для хвиль
    width: '100%', // Займає повну ширину екрану
    height: waveVisualHeight,
    overflow: 'hidden', // Обрізає частини waveContentHolder, що виходять за межі
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent', // Щоб було видно контент позаду
    zIndex: 1, // Додано zIndex
  },
  waveContentHolder: { // Цей View містить SVG подвійної ширини і саме він анімується
    position: 'absolute',
    left: 0, // ВАЖЛИВО: Починається з лівого краю mainContainer
    // 'bottom' встановлюється динамічно для кожного шару
    width: individualWavePathLength * 2, // Містить два сегменти шляху хвилі
    height: waveVisualHeight,
  },
});

export default WaveAnimation;