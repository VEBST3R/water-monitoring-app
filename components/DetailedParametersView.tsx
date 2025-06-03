import { Colors } from '@/constants/Colors';
import { calculateWQI } from '@/utils/wqiUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Circle, ClipPath, Defs, G, Polyline, Rect, Svg } from 'react-native-svg';
import ExpandedParameterChart from './ExpandedParameterChart';
import { ThemedText } from './ThemedText';
// import ParameterCircle from './ParameterCircle'; // Will create a new card-based design

export interface WaterParameters {
  pH?: number;
  temperature?: number;
  tds?: number;
  turbidity?: number;
  [key: string]: number | string | undefined;
}

interface DetailedParametersViewProps {
  parameters: WaterParameters | null;
  onRefresh?: () => void;
  deviceId?: string; // Додаємо deviceId для API викликів
}

const { width: screenWidth } = Dimensions.get('window');

// Компонент міні-діаграми
const MiniChart: React.FC<{ 
  data: { timestamp: number; value: number }[]; 
  color: string; 
  width: number; 
  height: number 
}> = ({ data, color, width, height }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { width, height, justifyContent: 'center', alignItems: 'center' }]}> 
        <ThemedText style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>Дані недоступні</ThemedText>
      </View>
    );
  }
  if (data.length < 2) {
    return (
      <View style={[styles.chartContainer, { width, height, justifyContent: 'center', alignItems: 'center' }]}> 
        <ThemedText style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>Недостатньо даних для графіка</ThemedText>
      </View>
    );
  }
  const values = data.map(point => point.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  let range = maxValue - minValue;
  // Унікальний ID для клипування
  const clipId = `miniChartClip-${Math.random().toString(36).substr(2, 9)}`;
  // Якщо всі значення однакові або дуже близькі, створюємо штучний діапазон
  if (range < 0.01) {
    if (maxValue === minValue && data.length > 2) {
      return (
        <View style={[styles.chartContainer, { width, height, justifyContent: 'center', alignItems: 'center' }]}> 
          <ThemedText style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>Дані стабільні (без змін)</ThemedText>
        </View>
      );
    }
    const avgValue = (maxValue + minValue) / 2;
    const artificialRange = Math.max(avgValue * 0.1, 0.1); // 10% від середнього або мінімум 0.1
    range = artificialRange;
  }
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    let y;
    if (maxValue === minValue) {
      y = height / 2;
    } else {
      const normalizedY = ((value - minValue) / range);
      y = height - (normalizedY * (height * 0.8) + height * 0.1);
    }
    return `${x},${y}`;
  }).join(' ');
  return (
    <Svg width={width} height={height} style={styles.chartContainer} viewBox={`0 0 ${width} ${height}`}>
      {/* Визначаємо область обрізання */}
      <Defs>
        <ClipPath id={clipId}>
          <Rect x="0" y="0" width={width} height={height} />
        </ClipPath>
      </Defs>
      {/* Фонова сітка */}
      <Polyline
        points={`0,${height/4} ${width},${height/4}`}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      <Polyline
        points={`0,${height/2} ${width},${height/2}`}
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      <Polyline
        points={`0,${height*3/4} ${width},${height*3/4}`}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />      
      {/* Основна лінія графіка з клипуванням */}
      <G clipPath={`url(#${clipId})`}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Додаємо точки для кращої візуалізації */}
        {values.map((value, index) => {
          const x = (index / (values.length - 1)) * width;
          let y;
          if (maxValue === minValue) {
            y = height / 2;
          } else {
            const normalizedY = ((value - minValue) / range);
            y = height - (normalizedY * (height * 0.8) + height * 0.1);
          }
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              stroke="white"
              strokeWidth="0.5"
            />
          );
        })}
      </G>
    </Svg>
  );
};

// Placeholder color logic for parameter circles
const getParameterDisplayConfig = (paramKey: string, value?: number): { 
  color: string; 
  displayValue: string | number; 
  unit: string;
  icon: string;
  optimalRange: string;
  reason?: string;
} => {
  let color = '#cccccc';
  let displayValue: string | number = value ?? 'N/A';
  let unit = '';
  let icon = 'analytics-outline';
  let optimalRange = 'Н/Д';
  let reason = '';
  if (value === undefined || value === null || isNaN(Number(value))) {
    reason = 'Дані недоступні';
    return { color, displayValue, unit, icon, optimalRange, reason };
  }
  switch (paramKey) {
    case 'pH':
      unit = '';
      icon = 'flask-outline';
      optimalRange = '6.5-8.5';
      if (value < 6.5) color = '#FF9800';
      else if (value <= 8.5) color = '#4CAF50';
      else color = '#9C27B0';
      break;
    case 'temperature':
      unit = '°C';
      icon = 'thermometer-outline';
      optimalRange = '15-25°C';
      if (value < 10) color = '#2196F3';
      else if (value <= 25) color = '#4CAF50';
      else color = '#FF5722';
      break;
    case 'tds':
      unit = 'ppm';
      icon = 'water-outline';
      optimalRange = '<300 ppm';
      if (value < 150) color = '#4CAF50';
      else if (value <= 300) color = '#FF9800';
      else color = '#F44336';
      break;
    case 'turbidity':
      unit = 'NTU';
      icon = 'eye-outline';
      optimalRange = '<1 NTU';
      if (value < 1) color = '#4CAF50';
      else if (value <= 5) color = '#FF9800';
      else color = '#795548';
      break;
    default:
      color = Colors.light.tint;
  }
  return { color, displayValue, unit, icon, optimalRange };
};

// Функція для оцінки загальної якості води
const getWaterQualityAssessment = (parameters: WaterParameters) => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Calculate the WQI using our consistent function
  const wqi = calculateWQI(parameters);
  
  // Determine overall status based on WQI
  let overallStatus: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  
  if (wqi >= 80) {
    overallStatus = 'excellent';
  } else if (wqi >= 60) {
    overallStatus = 'good';
  } else if (wqi >= 40) {
    overallStatus = 'acceptable';
  } else if (wqi >= 20) {
    overallStatus = 'poor';
  } else {
    overallStatus = 'critical';
  }
  
  // Still check individual parameters for specific warnings and issues
  // Перевіряємо pH
  if (parameters.pH !== undefined) {
    if (parameters.pH < 6.0) {
      issues.push('Дуже кисла вода (pH < 6.0)');
    } else if (parameters.pH < 6.5) {
      warnings.push('Кисла вода (pH < 6.5)');
    } else if (parameters.pH > 9.0) {
      issues.push('Дуже лужна вода (pH > 9.0)');
    } else if (parameters.pH > 8.5) {
      warnings.push('Лужна вода (pH > 8.5)');
    }
  }
  
  // Перевіряємо температуру
  if (parameters.temperature !== undefined) {
    if (parameters.temperature < 5) {
      warnings.push('Дуже холодна вода (< 5°C)');
    } else if (parameters.temperature > 30) {
      issues.push('Дуже гаряча вода (> 30°C)');
    } else if (parameters.temperature > 25) {
      warnings.push('Гаряча вода (> 25°C)');
    }
  }
  
  // Перевіряємо TDS
  if (parameters.tds !== undefined) {
    if (parameters.tds > 500) {
      issues.push('Високий рівень солей (TDS > 500 ppm)');
    } else if (parameters.tds > 300) {
      warnings.push('Підвищений рівень солей (TDS > 300 ppm)');
    }
  }
  
  // Перевіряємо каламутність
  if (parameters.turbidity !== undefined) {
    if (parameters.turbidity > 10) {
      issues.push('Дуже каламутна вода (> 10 NTU)');
    } else if (parameters.turbidity > 5) {
      issues.push('Каламутна вода (> 5 NTU)');
    } else if (parameters.turbidity > 1) {
      warnings.push('Злегка каламутна вода (> 1 NTU)');
    }
  }
  
  // Формуємо повідомлення та колір
  let message = '';
  let statusColor = '';
  let statusIcon = '';
  
  switch (overallStatus) {
    case 'excellent':
      message = 'Відмінна якість води! Всі параметри в оптимальних межах.';
      statusColor = '#4CAF50';
      statusIcon = 'checkmark-circle';
      break;
    case 'good':
      message = 'Хороша якість води. Незначні відхилення від оптимуму.';
      statusColor = '#8BC34A';
      statusIcon = 'checkmark-circle-outline';
      break;
    case 'acceptable':
      message = 'Прийнятна якість води. Рекомендується контроль параметрів.';
      statusColor = '#FF9800';
      statusIcon = 'warning-outline';
      break;
    case 'poor':
      message = 'Погана якість води. Необхідне втручання.';
      statusColor = '#FF5722';
      statusIcon = 'alert-circle-outline';
      break;
    case 'critical':
      message = 'Критична якість води! Негайно потрібні заходи.';
      statusColor = '#F44336';
      statusIcon = 'alert-circle';
      break;
  }
  
  return {
    status: overallStatus,
    message,
    issues,
    warnings,
    statusColor,
    statusIcon
  };
};

const DetailedParametersView: React.FC<DetailedParametersViewProps> = ({ parameters, onRefresh, deviceId = '111001' }) => {
  const [refreshing, setRefreshing] = useState(false);
  // Update the type definition to correctly use arrays
  const [historicalData, setHistoricalData] = useState<Record<string, { timestamp: number; value: number }[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Стан для розширеної діаграми
  const [expandedChart, setExpandedChart] = useState<{
    isVisible: boolean;
    parameterKey: string;
    parameterLabel: string;
    parameterDescription: string;
    color: string;
    unit: string;
    optimalRange: string;
    icon: string;
    data: { timestamp: number; value: number }[];
  } | null>(null);
    // Функція для завантаження історичних даних з сервера
  const fetchParameterHistory = async (parameterType: string) => {
    try {
      const response = await fetch(
        `http://192.168.1.104:1880/api/getParameterHistory?device=${deviceId}&parameter=${parameterType}&hours=24`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.warn('Failed to fetch parameter history:', error);
    }
    return [];
  };
  
  // Завантажуємо історичні дані при першому завантаженні або зміні deviceId
  useEffect(() => {
    const loadAllHistory = async () => {
      if (!parameters) return;
      
      setLoadingHistory(true);
      const paramKeys = ['pH', 'temperature', 'tds', 'turbidity'];
      const historyPromises = paramKeys.map(async (paramKey) => {
        const history = await fetchParameterHistory(paramKey);
        return { paramKey, history };
      });
      
      try {
        const results = await Promise.all(historyPromises);
        const newHistoricalData: Record<string, { timestamp: number; value: number }[]> = {};
        
        results.forEach(({ paramKey, history }) => {
          newHistoricalData[paramKey] = history;
        });
        
        setHistoricalData(newHistoricalData);
      } catch (error) {
        console.warn('Failed to load historical data:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadAllHistory();
  }, [deviceId, parameters?.pH, parameters?.temperature, parameters?.tds, parameters?.turbidity]);  const handleRefresh = async () => {
    // Не дозволяємо оновлення коли розширена діаграма відкрита
    if (expandedChart?.isVisible) {
      return;
    }
    
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Функція для відкриття розширеної діаграми
  const openExpandedChart = (config: any, parameterConfig: any, chartData: any) => {
    // Якщо відкриваємо WQI, формуємо спеціальні метадані
    if (config.key === 'wqi') {
      setExpandedChart({
        isVisible: true,
        parameterKey: 'wqi',
        parameterLabel: 'WQI',
        parameterDescription: 'Індекс якості води (Water Quality Index)',
        color: Colors.light.tint,
        unit: '',
        optimalRange: '80-100',
        icon: 'analytics-outline',
        data: wqiHistory // історія WQI, яку треба отримати нижче
      });
    } else {
      setExpandedChart({
        isVisible: true,
        parameterKey: config.key,
        parameterLabel: config.label,
        parameterDescription: config.description,
        color: parameterConfig.color,
        unit: parameterConfig.unit,
        optimalRange: parameterConfig.optimalRange,
        icon: parameterConfig.icon,
        data: chartData
      });
    }
  };

  // Функція для закриття розширеної діаграми
  const closeExpandedChart = () => {
    setExpandedChart(null);
  };

  // Додаємо стан для історії WQI
  const [wqiHistory, setWqiHistory] = useState<{ timestamp: number; value: number }[]>([]);

  // Завантаження історії WQI (аналогічно параметрам)
  useEffect(() => {
    const fetchWQIHistory = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.104:1880/api/getParameterHistory?device=${deviceId}&parameter=wqi&hours=24`
        );
        if (response.ok) {
          const data = await response.json();
          // Очікуємо масив з {timestamp, value}
          setWqiHistory(Array.isArray(data.data) ? data.data : []);
        } else {
          setWqiHistory([]);
        }
      } catch (e) {
        setWqiHistory([]);
      }
    };
    fetchWQIHistory();
  }, [deviceId]);

  if (!parameters) {
    return (
      <View style={styles.outerContainer}>        <ScrollView 
          contentContainerStyle={[styles.scrollContentContainer, styles.centered]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.tint]}
              tintColor={Colors.light.tint}
              enabled={!expandedChart?.isVisible}
            />
          }
        >
          <Ionicons name="water-outline" size={64} color={Colors.light.tabIconDefault} />
          <ThemedText style={styles.noDataText}>Детальні параметри недоступні</ThemedText>
          <ThemedText style={styles.noDataSubtext}>
            Потягніть вниз для оновлення
          </ThemedText>
        </ScrollView>
      </View>
    );
  }

  // Додаємо WQI-картку до списку параметрів для відображення
  const paramConfigs = [
    // { key: 'wqi', label: 'WQI', description: 'Індекс якості води' }, // WQI прибрано з меню параметрів
    { key: 'pH', label: 'Рівень pH', description: 'Кислотність води' },
    { key: 'temperature', label: 'Температура', description: 'Температура води' },
    { key: 'tds', label: 'Загальні розчинені речовини', description: 'Концентрація TDS' },
    { key: 'turbidity', label: 'Каламутність', description: 'Прозорість води' },
  ];

  return (
    <View style={styles.outerContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
            enabled={!expandedChart?.isVisible}
          />
        }
      >
        <ThemedText type="title" style={styles.title}>Параметри якості води</ThemedText>
          {paramConfigs.map(config => {
            let value = config.key === 'wqi' ? (parameters.wqi ?? null) : parameters[config.key];
            let numericValue = typeof value === 'number' ? value : undefined;
            let chartDataRaw = config.key === 'wqi' ? wqiHistory : (historicalData[config.key] || []);
            // Для WQI: фільтруємо тільки валідні числові значення
            let chartData = Array.isArray(chartDataRaw)
              ? chartDataRaw.filter(d => typeof d.value === 'number' && !isNaN(d.value))
              : [];
            let color = config.key === 'wqi' ? Colors.light.tint : getParameterDisplayConfig(config.key, numericValue).color;
            let unit = config.key === 'wqi' ? '' : getParameterDisplayConfig(config.key, numericValue).unit;
            let icon = config.key === 'wqi' ? 'analytics-outline' : getParameterDisplayConfig(config.key, numericValue).icon;
            let optimalRange = config.key === 'wqi' ? '80-100' : getParameterDisplayConfig(config.key, numericValue).optimalRange;
            let reason = config.key === 'wqi' ? undefined : getParameterDisplayConfig(config.key, numericValue).reason;
            let displayValue = config.key === 'wqi' ? (typeof value === 'number' ? value.toFixed(0) : 'N/A') : getParameterDisplayConfig(config.key, numericValue).displayValue;
            return (
              <TouchableOpacity 
                key={config.key} 
                style={styles.parameterCard}
                onPress={() => Array.isArray(chartData) && chartData.length > 0 && openExpandedChart(config, { color, unit, optimalRange, icon }, chartData)}
                activeOpacity={Array.isArray(chartData) && chartData.length > 0 ? 0.7 : 1}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name={icon as any} size={24} color={color} />
                  <View style={styles.headerText}>
                    <ThemedText type="subtitle" style={styles.cardTitle}>{config.label}</ThemedText>
                    <ThemedText style={styles.cardDescription}>{config.description}</ThemedText>
                  </View>
                  {Array.isArray(chartData) && chartData.length > 0 && (
                    <Ionicons 
                      name="chevron-forward-outline" 
                      size={20} 
                      color={Colors.light.tabIconDefault} 
                      style={styles.expandIcon}
                    />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.valueSection}>
                    <View style={styles.mainValue}>
                      <ThemedText style={[styles.valueText, { color }]}> 
                        {displayValue}{(unit && typeof displayValue === 'number' && config.key !== 'wqi') ? ` ${unit}` : ''}
                      </ThemedText>
                      <View style={[styles.statusIndicator, { backgroundColor: color }]} />
                    </View>
                    {reason && (
                      <ThemedText style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{reason}</ThemedText>
                    )}
                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={Colors.light.tabIconDefault} />
                      <ThemedText style={styles.optimalText}>Оптимально: {optimalRange}</ThemedText>
                    </View>
                  </View>
                  {Array.isArray(chartData) && chartData.length > 0 && !loadingHistory && (
                    <View style={styles.chartSection}>
                      <ThemedText style={styles.chartLabel}>Динаміка (24 год)</ThemedText>
                      <MiniChart 
                        data={chartData}
                        color={color}
                        width={screenWidth * 0.35}
                        height={60}
                      />
                    </View>
                  )}
                  {loadingHistory && (
                    <View style={styles.chartSection}>
                      <ThemedText style={styles.chartLabel}>Завантаження історії...</ThemedText>
                      <View style={[styles.chartPlaceholder, { borderColor: color }]} />
                    </View>                )}
                </View>
              </TouchableOpacity>
            );
          })}        
        {/* Загальна оцінка */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={24} color={Colors.light.tint} />
            <View style={styles.headerText}>
              <ThemedText type="subtitle" style={styles.cardTitle}>Загальна оцінка</ThemedText>
              <ThemedText style={styles.cardDescription}>Стан якості води</ThemedText>
            </View>
          </View>
          
          <View style={styles.summaryContent}>
            {(() => {
              const assessment = getWaterQualityAssessment(parameters);
              return (
                <>
                  <View style={styles.assessmentHeader}>
                    <Ionicons 
                      name={assessment.statusIcon as any} 
                      size={20} 
                      color={assessment.statusColor} 
                    />
                    <ThemedText style={[styles.summaryText, { color: assessment.statusColor, fontWeight: '600' }]}>
                      {assessment.message}
                    </ThemedText>
                  </View>
                  
                  {assessment.issues.length > 0 && (
                    <View style={styles.issuesSection}>
                      <ThemedText style={styles.issuesTitle}>⚠️ Критичні проблеми:</ThemedText>
                      {assessment.issues.map((issue, index) => (
                        <ThemedText key={index} style={styles.issueText}>• {issue}</ThemedText>
                      ))}
                    </View>
                  )}
                  
                  {assessment.warnings.length > 0 && (
                    <View style={styles.warningsSection}>
                      <ThemedText style={styles.warningsTitle}>⚡ Попередження:</ThemedText>
                      {assessment.warnings.map((warning, index) => (
                        <ThemedText key={index} style={styles.warningText}>• {warning}</ThemedText>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}
            
            <View style={styles.lastUpdateInfo}>
              <Ionicons name="time-outline" size={16} color={Colors.light.tabIconDefault} />
              <ThemedText style={styles.lastUpdateText}>
                Останнє оновлення: {new Date().toLocaleTimeString('uk-UA')}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Розширена діаграма */}
      {expandedChart && (
        <ExpandedParameterChart
          isVisible={expandedChart.isVisible}
          onClose={closeExpandedChart}
          data={expandedChart.data}
          parameterKey={expandedChart.parameterKey}
          parameterLabel={expandedChart.parameterLabel}
          parameterDescription={expandedChart.parameterDescription}
          color={expandedChart.color}
          unit={expandedChart.unit}
          optimalRange={expandedChart.optimalRange}
          icon={expandedChart.icon}
        />
      )}
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
  parameterCard: {
    backgroundColor: Colors.light.background, 
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA', 
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  expandIcon: {
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueSection: {
    flex: 1,
  },
  mainValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimalText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 6,
  },
  chartSection: {
    alignItems: 'center',
    marginLeft: 15,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
    marginBottom: 5,
    textAlign: 'center',
  },  chartContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  chartPlaceholder: {
    width: screenWidth * 0.35,
    height: 60,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  summaryContent: {
    marginTop: 10,
  },  summaryText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 10,
    marginLeft: 8,
    flex: 1,
  },
  lastUpdateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 6,
  },
  noDataText: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },  noDataSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 8,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issuesSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 6,
  },
  issueText: {
    fontSize: 13,
    color: '#F44336',
    marginLeft: 8,
    marginBottom: 2,
    lineHeight: 18,
  },
  warningsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9800',
    marginLeft: 8,
    marginBottom: 2,
    lineHeight: 18,
  },
});

export default DetailedParametersView;
