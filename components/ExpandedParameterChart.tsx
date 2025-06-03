import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Circle, ClipPath, Defs, G, Line, Polyline, Rect, Svg, Text } from 'react-native-svg';
import { ThemedText } from './ThemedText';

interface ExpandedParameterChartProps {
  isVisible: boolean;
  onClose: () => void;
  data: { timestamp: number; value: number }[];
  parameterKey: string;
  parameterLabel: string;
  parameterDescription: string;
  color: string;
  unit: string;
  optimalRange: string;
  icon: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 40;
const CHART_HEIGHT = 200;

const ExpandedParameterChart: React.FC<ExpandedParameterChartProps> = ({
  isVisible,
  onClose,
  data,
  parameterKey,
  parameterLabel,
  parameterDescription,
  color,
  unit,
  optimalRange,
  icon
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map(point => point.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  let range = maxValue - minValue;

  // Якщо всі значення однакові, створюємо штучний діапазон
  if (range < 0.01) {
    const avgValue = (maxValue + minValue) / 2;
    range = Math.max(avgValue * 0.1, 0.1);
  }

  // Генеруємо точки для графіка
  const chartPoints = data.map((point, index) => {
    const x = (index / (data.length - 1)) * CHART_WIDTH;
    let y;
    if (maxValue === minValue) {
      y = CHART_HEIGHT / 2;
    } else {
      const normalizedY = ((point.value - minValue) / range);
      y = CHART_HEIGHT - (normalizedY * (CHART_HEIGHT * 0.8) + CHART_HEIGHT * 0.1);
    }
    return { x, y, value: point.value, timestamp: point.timestamp };
  });
  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  // Обробка натискання для вибору точки
  const handleChartPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const relativeX = Math.max(0, Math.min(locationX, CHART_WIDTH));
    
    // Знаходимо найближчу точку
    let closestIndex = 0;
    let minDistance = Math.abs(chartPoints[0].x - relativeX);
    
    for (let i = 1; i < chartPoints.length; i++) {
      const distance = Math.abs(chartPoints[i].x - relativeX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    // Якщо та ж точка вибрана, скидаємо вибір
    if (selectedIndex === closestIndex) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(closestIndex);
    }
  };

  const selectedPoint = selectedIndex !== null ? chartPoints[selectedIndex] : null;
  const selectedData = selectedIndex !== null ? data[selectedIndex] : null;

  // Додаткова інформація про параметр
  const getParameterInfo = () => {
    if (parameterKey === 'wqi') {
      return {
        info: 'WQI (Water Quality Index) — інтегральний індекс якості води, розрахований на основі основних параметрів. 80-100 — відмінна якість, 60-79 — хороша, 40-59 — прийнятна, 20-39 — погана, 0-19 — дуже погана.',
        risks: { low: '', high: '' }
      };
    }
    switch (parameterKey) {
      case 'pH':
        return {
          info: 'pH показує кислотність або лужність води. Оптимальний рівень для питної води складає 6.5-8.5.',
          risks: {
            low: 'Низький pH може спричинити корозію труб',
            high: 'Високий pH може викликати осадження мінералів'
          }
        };
      case 'temperature':
        return {
          info: 'Температура впливає на розчинність кисню та активність мікроорганізмів у воді.',
          risks: {
            low: 'Низька температура сповільнює біологічні процеси',
            high: 'Висока температура знижує розчинність кисню'
          }
        };
      case 'tds':
        return {
          info: 'TDS показує загальну концентрацію розчинених мінералів, солей та металів у воді.',
          risks: {
            low: 'Низький TDS може вказувати на дистильовану воду',
            high: 'Високий TDS може погіршити смак води'
          }
        };
      case 'turbidity':
        return {
          info: 'Каламутність показує прозорість води та наявність завислих частинок.',
          risks: {
            low: 'Низька каламутність означає чисту воду',
            high: 'Висока каламутність може вказувати на забруднення'
          }
        };
      default:
        return {
          info: 'Інформація про параметр недоступна',
          risks: { low: '', high: '' }
        };
    }
  };

  const paramInfo = getParameterInfo();

  // Форматування значення для WQI (без одиниць)
  const formatValue = (val: number) => {
    if (parameterKey === 'wqi') return Math.round(val).toString();
    if (parameterKey === 'pH') return val.toFixed(1);
    return val.toFixed(1);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Заголовок */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name={icon as any} size={28} color={color} />
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>{parameterLabel}</ThemedText>
              <ThemedText style={styles.subtitle}>{parameterDescription}</ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>        </View>
        
        {/* Інтерактивна діаграма */}
        <View style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>Динаміка за 24 години</ThemedText>
          
          <TouchableOpacity 
            style={styles.chartWrapper} 
            onPress={handleChartPress}
            activeOpacity={1}
          >
            <View style={styles.chartInnerContainer}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                {/* Визначаємо область обрізання */}
                <Defs>
                  <ClipPath id="chartClip">
                    <Rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} />
                  </ClipPath>
                </Defs>
                {/* Фонова сітка */}
                {[0.25, 0.5, 0.75].map((ratio, index) => (
                  <Line
                    key={index}
                    x1="0"
                    y1={CHART_HEIGHT * ratio}
                    x2={CHART_WIDTH}
                    y2={CHART_HEIGHT * ratio}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}
                
                {/* Вертикальні лінії сітки */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => (
                  <Line
                    key={`v-${index}`}
                    x1={CHART_WIDTH * ratio}
                    y1="0"
                    x2={CHART_WIDTH * ratio}
                    y2={CHART_HEIGHT}
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                ))}                {/* Основна лінія графіка */}
                <G clipPath="url(#chartClip)">
                  <Polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Точки на графіку */}
                  {chartPoints.map((point, index) => (
                    <Circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r={selectedIndex === index ? "6" : "3"}
                      fill={selectedIndex === index ? color : "white"}
                      stroke={color}
                      strokeWidth="2"
                    />
                  ))}
                </G>                {/* Вертикальна лінія вибраної точки */}
                {selectedPoint && (
                  <>
                    <Line
                      x1={selectedPoint.x}
                      y1="0"
                      x2={selectedPoint.x}
                      y2={CHART_HEIGHT}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.7"
                    />
                  </>
                )}

                {/* Підписи осей */}
                <Text x="5" y="15" fontSize="10" fill="#666">
                  {maxValue.toFixed(1)}{unit}
                </Text>                <Text x="5" y={CHART_HEIGHT - 5} fontSize="10" fill="#666">
                  {minValue.toFixed(1)}{unit}
                </Text>              </Svg>            </View>
          </TouchableOpacity>        </View>

        {/* Поточне значення - завжди показуємо */}
        <View style={styles.currentValueCard}>
          <ThemedText style={styles.currentValueLabel}>
            {selectedData ? 
              `Вибрана точка: ${new Date(selectedData.timestamp).toLocaleString('uk-UA')}` : 
              'Поточне значення'
            }
          </ThemedText>
          <ThemedText style={[styles.currentValue, { color }]}>
            {selectedData ? 
              formatValue(selectedData.value) :
              formatValue(data[data.length - 1]?.value)
            }{parameterKey !== 'wqi' ? unit : ''}
          </ThemedText>
        </View>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Максимум</ThemedText>
            <ThemedText style={[styles.statValue, { color }]}>
              {formatValue(maxValue)}{parameterKey !== 'wqi' ? unit : ''}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Мінімум</ThemedText>
            <ThemedText style={[styles.statValue, { color }]}>
              {formatValue(minValue)}{parameterKey !== 'wqi' ? unit : ''}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Середнє</ThemedText>
            <ThemedText style={[styles.statValue, { color }]}>
              {formatValue(values.reduce((a, b) => a + b, 0) / values.length)}{parameterKey !== 'wqi' ? unit : ''}
            </ThemedText>
          </View>
        </View>

        {/* Інформація про параметр */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
            <ThemedText style={styles.infoTitle}>Про параметр</ThemedText>
          </View>
          <ThemedText style={styles.infoText}>{paramInfo.info}</ThemedText>
          <View style={styles.optimalRange}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.light.tint} />
            <ThemedText style={styles.optimalText}>
              {parameterKey === 'wqi' ? '80-100 (відмінна якість)' : `Оптимальний діапазон: ${optimalRange}`}
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },  currentValueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  currentValueLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },  chartWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chartInnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },  chart: {
    backgroundColor: 'transparent',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  optimalRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimalText: {
    fontSize: 14,
    color: Colors.light.tint,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default ExpandedParameterChart;
