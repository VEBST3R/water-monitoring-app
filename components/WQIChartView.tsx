import { Colors } from '@/constants/Colors';
import { getWaterQualityColor } from '@/utils/colorUtils';
import { calculateWQI } from '@/utils/wqiUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width: screenWidth } = Dimensions.get('window');

interface WQIDataPoint {
  timestamp: string;
  wqi: number;
  date: Date;
}

interface WaterParameters {
  pH: number;
  temperature: number;
  tds: number; // Total Dissolved Solids in mg/L
  turbidity: number; // in NTU (Nephelometric Turbidity Units)
}

interface WQIChartViewProps {
  deviceId: string;
}

const WQIChartView: React.FC<WQIChartViewProps> = ({ deviceId }) => {
  const [wqiData, setWqiData] = useState<WQIDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWQI, setCurrentWQI] = useState<number>(0);

  // Генеруємо тестові дані для демонстрації
  const generateTestData = (): WQIDataPoint[] => {
    const data: WQIDataPoint[] = [];
    const now = new Date();
    
    // Створюємо дані за останні 24 години
    for (let i = 24; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseWQI = 75;
      const variation = Math.sin(i * 0.3) * 15 + Math.random() * 10 - 5;
      const wqi = Math.max(20, Math.min(95, baseWQI + variation));
      
      data.push({
        timestamp: date.toISOString(),
        wqi: Math.round(wqi),
        date: date
      });
    }
    
    return data;
  };
  useEffect(() => {
    // Завантажуємо реальні дані з API
    const loadWQIData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Отримуємо історичні дані WQI з сервера
        const response = await fetch(
          `http://192.168.1.104:1880/api/getParameterHistory?device=${deviceId}&parameter=wqi&hours=8`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const historyData = await response.json();
          // Отримуємо поточний WQI та параметри
        const currentResponse = await fetch(`http://192.168.1.104:1880/api/getWQI?device=${deviceId}`);
        let currentWQI = 0;
        let currentParams = null;
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          // Використовуємо WQI від сервера
          currentWQI = currentData.wqi || 0;
          currentParams = currentData.parameters;
          
          // Якщо WQI від сервера відсутній, але є параметри, обчислюємо його локально
          if ((!currentWQI || currentWQI === 0) && currentParams) {
            currentWQI = calculateWQI({
              pH: currentParams.pH || 7,
              temperature: currentParams.temperature || 20,
              tds: currentParams.tds || 300,
              turbidity: currentParams.turbidity || 1
            });
          }
        }
        
        // Конвертуємо дані в формат для діаграми
        const wqiDataPoints: WQIDataPoint[] = [];
        
        if (historyData.data && Array.isArray(historyData.data)) {          historyData.data.forEach((point: any) => {
            if (point.timestamp) {
              // Check if we have a server-calculated WQI
              const serverWQI = typeof point.value === 'number' ? point.value : 0;
              
              // Calculate local WQI if we have any parameters
              let localWQI = 0;
              if (point.pH || point.temperature || point.tds || point.turbidity) {
                localWQI = calculateWQI({
                  pH: point.pH || 7,
                  temperature: point.temperature || 20,
                  tds: point.tds || 300,
                  turbidity: point.turbidity || 1
                });
              }
              
              // Use server WQI if available, otherwise use locally calculated WQI
              const finalWQI = serverWQI || localWQI;
              
              wqiDataPoints.push({
                timestamp: new Date(point.timestamp).toISOString(),
                wqi: Math.round(finalWQI),
                date: new Date(point.timestamp)
              });
            }
          });
        }
        
        // Якщо немає історичних даних, створюємо точку з поточним WQI
        if (wqiDataPoints.length === 0) {
          wqiDataPoints.push({
            timestamp: new Date().toISOString(),
            wqi: Math.round(currentWQI),
            date: new Date()
          });
        }
        
        setWqiData(wqiDataPoints);
        setCurrentWQI(Math.round(currentWQI));
        
      } catch (err) {
        console.error('Error loading WQI data:', err);
        setError('Помилка завантаження даних діаграми');
        
        // Fallback to test data in case of error
        const fallbackData = generateTestData();
        setWqiData(fallbackData);
        if (fallbackData.length > 0) {
          setCurrentWQI(fallbackData[fallbackData.length - 1].wqi);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWQIData();
  }, [deviceId]);

  const getWQIStatus = (wqi: number): { text: string; color: string; icon: string } => {
    if (wqi >= 80) return { text: 'Відмінна якість', color: '#4CAF50', icon: 'checkmark-circle' };
    if (wqi >= 60) return { text: 'Хороша якість', color: '#8BC34A', icon: 'checkmark-circle-outline' };
    if (wqi >= 40) return { text: 'Прийнятна якість', color: '#FF9800', icon: 'warning-outline' };
    if (wqi >= 20) return { text: 'Погана якість', color: '#FF5722', icon: 'alert-outline' };
    return { text: 'Дуже погана якість', color: '#F44336', icon: 'close-circle' };
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  const chartConfig = {
    backgroundColor: Colors.light.background,
    backgroundGradientFrom: Colors.light.background,
    backgroundGradientTo: Colors.light.background,
    decimalPlaces: 0,
    color: (opacity = 1) => getWaterQualityColor(currentWQI),
    labelColor: (opacity = 1) => Colors.light.text,
    style: {
      borderRadius: 0,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: getWaterQualityColor(currentWQI)
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: Colors.light.tabIconDefault,
      strokeOpacity: 0.3
    },
    paddingRight: 30,
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Завантаження діаграми...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const chartData = {
    labels: wqiData.slice(-8).map(point => formatTime(point.date)), // Показуємо останні 8 точок
    datasets: [
      {
        data: wqiData.slice(-8).map(point => point.wqi),
        color: (opacity = 1) => getWaterQualityColor(currentWQI),
        strokeWidth: 3
      }
    ]
  };

  const currentStatus = getWQIStatus(currentWQI);

  return (    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="analytics-outline" size={28} color={Colors.light.tint} />
            <ThemedText style={styles.title}>Діаграма WQI</ThemedText>
          </View>
          <ThemedText style={styles.deviceId}>Пристрій: {deviceId}</ThemedText>
        </View>

        {/* Поточний стан */}
        <View style={styles.currentStatusCard}>
          <View style={styles.currentWQIContainer}>
            <ThemedText style={[styles.currentWQI, { color: currentStatus.color }]}>
              {currentWQI}
            </ThemedText>
            <ThemedText style={styles.wqiLabel}>WQI</ThemedText>
          </View>
          
          <View style={styles.statusInfo}>
            <View style={styles.statusRow}>
              <Ionicons name={currentStatus.icon as any} size={20} color={currentStatus.color} />
              <ThemedText style={[styles.statusText, { color: currentStatus.color }]}>
                {currentStatus.text}
              </ThemedText>
            </View>
            <ThemedText style={styles.lastUpdate}>
              Останнє оновлення: {formatTime(new Date())}
            </ThemedText>
          </View>
        </View>        {/* Діаграма */}
        <View style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Зміни за останні 8 годин</ThemedText>
          
          {wqiData.length > 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 70}
                height={180}
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
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.light.tabIconDefault} />
              <ThemedText style={styles.noDataText}>Недостатньо даних для відображення</ThemedText>
            </View>
          )}
        </View>

        {/* Статистика */}
        <View style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>Статистика за 24 години</ThemedText>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {Math.max(...wqiData.map(d => d.wqi))}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Максимум</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {Math.min(...wqiData.map(d => d.wqi))}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Мінімум</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {Math.round(wqiData.reduce((sum, d) => sum + d.wqi, 0) / wqiData.length)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Середнє</ThemedText>
            </View>
          </View>
        </View>

        {/* Легенда якості води */}
        <View style={styles.legendCard}>
          <ThemedText style={styles.legendTitle}>Шкала якості води</ThemedText>
          
          <View style={styles.legendItems}>
            {[
              { range: '80-100', label: 'Відмінна', color: '#4CAF50' },
              { range: '60-79', label: 'Хороша', color: '#8BC34A' },
              { range: '40-59', label: 'Прийнятна', color: '#FF9800' },
              { range: '20-39', label: 'Погана', color: '#FF5722' },
              { range: '0-19', label: 'Дуже погана', color: '#F44336' }
            ].map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <ThemedText style={styles.legendRange}>{item.range}</ThemedText>
                <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
  },  header: {
    marginBottom: 20,
    marginHorizontal: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: Colors.light.text,
  },
  deviceId: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },  currentStatusCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentWQIContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  currentWQI: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  wqiLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 1,
  },
  statusInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },  chartCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
    color: Colors.light.text,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 0,
    marginVertical: 0,
    alignSelf: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
  },  statsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.light.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 5,
  },  legendCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.light.text,
  },
  legendItems: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendRange: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
    color: Colors.light.text,
  },
  legendLabel: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
});

export default WQIChartView;
