import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import WebAPIService, { ParameterHistoryPoint, WaterParameters } from './services/WebAPIService';

interface WebInteractiveChartsProps {
  deviceId: string;
  isDarkMode: boolean;
  currentParams?: WaterParameters;
  wqiValue?: number; // Added to receive WQI score
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

const { width: screenWidth } = Dimensions.get('window');
// Make chart responsive to container width - subtract left panel width and various paddings
// Assuming a 320px side panel.
// styles.container (main component container) has 20px L/R padding (total 40px).
// styles.chartContainer (chart's direct wrapper) has 20px L/R padding (total 40px).
const baseAvailableWidthForChart = screenWidth - 100;
const chartWidth = Math.max(300, Math.min(baseAvailableWidthForChart, 1500)); // Min 300px, Max 800px

const WebInteractiveCharts: React.FC<WebInteractiveChartsProps> = ({
  deviceId,
  isDarkMode,
  currentParams,
  wqiValue // Added
}) => {
  const [selectedParameter, setSelectedParameter] = useState<string>('wqi');
  const [historyData, setHistoryData] = useState<{ [key: string]: ParameterHistoryPoint[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const apiService = WebAPIService.getInstance();

  // Якщо немає deviceId (тобто немає пристроїв), показуємо повідомлення
  if (!deviceId || deviceId === 'undefined') {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.emptyState}>
          <Ionicons 
            name="analytics-outline" 
            size={64} 
            color={isDarkMode ? '#64748b' : '#94a3b8'} 
          />
          <Text style={[styles.emptyStateTitle, isDarkMode && styles.titleDark]}>
            Немає даних для відображення
          </Text>
          <Text style={[styles.emptyStateDescription, isDarkMode && styles.subtitleDark]}>
            Додайте пристрій, щоб переглядати графіки та аналітику
          </Text>
        </View>
      </View>
    );
  }

  const parameters = [
    { key: 'wqi', label: 'WQI', icon: 'water', unit: '', color: '#3b82f6' },
    { key: 'ph', label: 'pH', icon: 'beaker', unit: '', color: '#10b981' },
    { key: 'temperature', label: 'Температура', icon: 'thermometer', unit: '°C', color: '#f59e0b' },
    { key: 'tds', label: 'TDS', icon: 'layers', unit: 'ppm', color: '#8b5cf6' },
    { key: 'turbidity', label: 'Каламутність', icon: 'eye', unit: 'NTU', color: '#ef4444' },
  ];

  useEffect(() => {
    loadParameterHistory(selectedParameter);
  }, [selectedParameter, timeRange, deviceId]);

  const loadParameterHistory = async (parameter: string) => {
    setIsLoading(true);
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const response = await apiService.getParameterHistory(deviceId, parameter, hours);
      
      setHistoryData(prev => ({
        ...prev,
        [parameter]: response.data
      }));
    } catch (error) {
      console.error(`Failed to load ${parameter} history:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatChartData = (data: ParameterHistoryPoint[], parameter: string): ChartData => {
    if (!data || data.length === 0) {
      return {
        labels: [''],
        datasets: [{ data: [0] }]
      };
    }

    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
    
    // Показуємо тільки останні 12 точок для зручності перегляду
    const displayData = sortedData.slice(-12);
    
    const labels = displayData.map(point => {
      const date = new Date(point.timestamp);
      if (timeRange === '24h') {
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange === '7d') {
        return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
      }
    });

    const paramConfig = parameters.find(p => p.key === parameter);
    const color = paramConfig?.color || '#3b82f6';

    return {
      labels,
      datasets: [{
        data: displayData.map(point => Number(point.value.toFixed(2))),
        color: (opacity = 1) => `rgba(${hexToRgb(color)}, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246';
  };

  const getParameterCurrentValue = (paramKey: string): number => {
    if (paramKey === 'wqi') {
      return wqiValue !== undefined ? wqiValue : 0; // Use wqiValue for WQI
    }
    if (!currentParams) return 0;
    
    switch (paramKey) {
      case 'ph': return currentParams.pH || 0;
      case 'temperature': return currentParams.temperature || 0;
      case 'tds': return currentParams.tds || 0;
      case 'turbidity': return currentParams.turbidity || 0;
      case 'dissolvedOxygen': return currentParams.dissolvedOxygen || 0;
      case 'conductivity': return currentParams.conductivity || 0;
      default: return 0;
    }
  };

  const chartConfig = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    backgroundGradientFrom: isDarkMode ? '#1e293b' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1e293b' : '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => isDarkMode ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#ffffff"
    },    propsForBackgroundLines: {
      strokeDasharray: "",
      strokeOpacity: isDarkMode ? 0.3 : 0.1
    },
    fillShadowGradient: isDarkMode ? '#475569' : '#e2e8f0',
    fillShadowGradientOpacity: 0.3,
  };

  const renderParameterSelector = () => (
    <View style={styles.parameterSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {parameters.map((param) => (
          <TouchableOpacity
            key={param.key}
            style={[
              styles.parameterButton,
              selectedParameter === param.key && styles.parameterButtonActive,
              selectedParameter === param.key && { backgroundColor: param.color },
              isDarkMode && styles.parameterButtonDark
            ]}
            onPress={() => setSelectedParameter(param.key)}
          >
            <Ionicons 
              name={param.icon as any} 
              size={20} 
              color={selectedParameter === param.key ? '#ffffff' : (isDarkMode ? '#f1f5f9' : '#374151')} 
            />
            <Text style={[
              styles.parameterButtonText,
              selectedParameter === param.key && styles.parameterButtonTextActive,
              isDarkMode && selectedParameter !== param.key && styles.parameterButtonTextDark
            ]}>
              {param.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      {[
        { key: '24h', label: '24 год' },
        { key: '7d', label: '7 днів' },
        { key: '30d', label: '30 днів' }
      ].map((range) => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.timeRangeButton,
            timeRange === range.key && styles.timeRangeButtonActive,
            isDarkMode && styles.timeRangeButtonDark,
            isDarkMode && timeRange === range.key && styles.timeRangeButtonActiveDark
          ]}
          onPress={() => setTimeRange(range.key as any)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            timeRange === range.key && styles.timeRangeButtonTextActive,
            isDarkMode && styles.timeRangeButtonTextDark
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const currentParameter = parameters.find(p => p.key === selectedParameter);
  const currentValue = getParameterCurrentValue(selectedParameter);
  const chartData = formatChartData(historyData[selectedParameter] || [], selectedParameter);

  // Ensure WQI is selected by default if available and no other selection is made
  useEffect(() => {
    if (wqiValue !== undefined && !parameters.find(p => p.key === selectedParameter)) {
      setSelectedParameter('wqi');
    }
  }, [wqiValue, selectedParameter]);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          Інтерактивні графіки
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Пристрій: {deviceId}
        </Text>
      </View>

      {/* Parameter Selector */}
      {renderParameterSelector()}

      {/* Time Range Selector */}
      {renderTimeRangeSelector()}

      {/* Current Value Display */}
      {currentParameter && (
        <View style={[styles.currentValueCard, isDarkMode && styles.currentValueCardDark]}>
          <View style={styles.currentValueHeader}>
            <View style={[styles.currentValueIcon, { backgroundColor: `${currentParameter.color}15` }]}>
              <Ionicons name={currentParameter.icon as any} size={24} color={currentParameter.color} />
            </View>
            <View style={styles.currentValueInfo}>
              <Text style={[styles.currentValueLabel, isDarkMode && styles.currentValueLabelDark]}>
                Поточне значення {currentParameter.label}
              </Text>
              <Text style={[styles.currentValueText, { color: currentParameter.color }]}>
                {currentValue.toFixed(selectedParameter === 'ph' || selectedParameter === 'wqi' ? 1 : 0)}{currentParameter.unit}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Interactive Chart */}
      <View style={[styles.chartContainer, isDarkMode && styles.chartContainerDark]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, isDarkMode && styles.chartTitleDark]}>
            Динаміка {currentParameter?.label} за {timeRange === '24h' ? '24 години' : timeRange === '7d' ? '7 днів' : '30 днів'}
          </Text>
          {isLoading && (
            <View style={styles.loadingIndicator}>
              <Ionicons name="refresh" size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
                Завантаження...
              </Text>
            </View>
          )}
        </View>        {chartData.datasets[0].data.some(val => val > 0) ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <LineChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withInnerLines={true}
              withOuterLines={false}
              withShadow={false}
              withDots={true}
              fromZero={false}
            />
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={isDarkMode ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.noDataText, isDarkMode && styles.noDataTextDark]}>
              Немає даних для відображення
            </Text>
          </View>
        )}
      </View>

      {/* Statistics */}
      {historyData[selectedParameter] && historyData[selectedParameter].length > 0 && (
        <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
          <Text style={[styles.statsTitle, isDarkMode && styles.statsTitleDark]}>
            Статистика
          </Text>
          <View style={styles.statsGrid}>
            {(() => {
              const data = historyData[selectedParameter];
              const values = data.map(d => d.value);
              const max = Math.max(...values);
              const min = Math.min(...values);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              
              return [
                { label: 'Максимум', value: max.toFixed(selectedParameter === 'ph' ? 1 : 0), color: '#ef4444' },
                { label: 'Мінімум', value: min.toFixed(selectedParameter === 'ph' ? 1 : 0), color: '#10b981' },
                { label: 'Середнє', value: avg.toFixed(selectedParameter === 'ph' ? 1 : 0), color: '#3b82f6' },
                { label: 'Точок даних', value: values.length.toString(), color: '#8b5cf6' }
              ].map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}{currentParameter?.unit}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                    {stat.label}
                  </Text>
                </View>
              ));
            })()}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  titleDark: {
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  subtitleDark: {
    color: '#94a3b8',
  },
  parameterSelector: {
    marginBottom: 20,
  },
  parameterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  parameterButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  parameterButtonActive: {
    borderColor: 'transparent',
  },
  parameterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  parameterButtonTextDark: {
    color: '#f1f5f9',
  },
  parameterButtonTextActive: {
    color: '#ffffff',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2, // ADDED for spacing
  },
  timeRangeButtonDark: {
    backgroundColor: '#1e293b',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timeRangeButtonActiveDark: {
    backgroundColor: '#3b82f6',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  timeRangeButtonTextDark: {
    color: '#94a3b8',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  currentValueCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentValueCardDark: {
    backgroundColor: '#1e293b',
  },
  currentValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentValueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentValueInfo: {
    flex: 1,
  },
  currentValueLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  currentValueLabelDark: {
    color: '#94a3b8',
  },
  currentValueText: {
    fontSize: 28,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // alignItems: 'center', // REMOVED/Ensure not present - ScrollView handles centering
  },
  chartContainerDark: {
    backgroundColor: '#1e293b',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  chartTitleDark: {
    color: '#f1f5f9',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingTextDark: {
    color: '#94a3b8',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  noDataTextDark: {
    color: '#94a3b8',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainerDark: {
    backgroundColor: '#1e293b',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsTitleDark: {
    color: '#f1f5f9',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },  statLabelDark: {
    color: '#94a3b8',
  },
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default WebInteractiveCharts;
