import { UserDevice } from '@/types';
import { getWaterQualityColor } from '@/utils/colorUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface WebMainContentProps {
  score: number;
  detailedParams: any;
  currentDevice: UserDevice;
  isDarkMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'loading';
}

const { width: screenWidth } = Dimensions.get('window');

const WebMainContent: React.FC<WebMainContentProps> = ({
  score,
  detailedParams,
  currentDevice,
  isDarkMode,
  connectionStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'alerts'>('overview');

  // Generate sample chart data
  const generateChartData = (param: string) => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date().getHours() - 23 + i) % 24;
      return hour.toString().padStart(2, '0');
    });

    let baseValue = 50;
    let variance = 10;
    
    switch (param) {
      case 'wqi':
        baseValue = score;
        variance = 5;
        break;
      case 'pH':
        baseValue = detailedParams?.pH || 7.0;
        variance = 0.5;
        break;
      case 'temperature':
        baseValue = detailedParams?.temperature || 20;
        variance = 2;
        break;
      case 'tds':
        baseValue = detailedParams?.tds || 300;
        variance = 20;
        break;
    }

    const data = hours.map(() => 
      Math.max(0, baseValue + (Math.random() - 0.5) * variance * 2)
    );

    return {
      labels: hours.filter((_, i) => i % 4 === 0), // Show every 4th hour
      datasets: [{
        data: data.filter((_, i) => i % 4 === 0),
        color: (opacity = 1) => getWaterQualityColor(score),
        strokeWidth: 3,
      }]
    };
  };
  const chartConfig = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    backgroundGradientFrom: isDarkMode ? '#1e293b' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1e293b' : '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => isDarkMode ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: getWaterQualityColor(score)
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: isDarkMode ? '#475569' : '#e2e8f0',
      strokeOpacity: isDarkMode ? 0.4 : 0.2
    },
  };

  const getParameterIcon = (param: string) => {
    switch (param) {
      case 'wqi': return 'speedometer-outline';
      case 'pH': return 'flask-outline';
      case 'temperature': return 'thermometer-outline';
      case 'tds': return 'water-outline';
      case 'turbidity': return 'eye-outline';
      default: return 'analytics-outline';
    }
  };

  const getParameterUnit = (param: string) => {
    switch (param) {
      case 'wqi': return '';
      case 'pH': return 'pH';
      case 'temperature': return '°C';
      case 'tds': return 'ppm';
      case 'turbidity': return 'NTU';
      default: return '';
    }
  };

  const detailedParameters = [
    { key: 'pH', label: 'pH Рівень', value: detailedParams?.pH || 7.0, optimal: '6.5-8.5' },
    { key: 'temperature', label: 'Температура', value: detailedParams?.temperature || 20, optimal: '15-25°C' },
    { key: 'tds', label: 'TDS Рівень', value: detailedParams?.tds || 300, optimal: '< 500 ppm' },
    { key: 'turbidity', label: 'Мутність', value: detailedParams?.turbidity || 1, optimal: '< 4 NTU' },
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'pH рівень близький до верхньої межі',
      time: '10 хв тому',
      icon: 'warning-outline',
      color: '#f59e0b',
    },
    {
      id: 2,
      type: 'info',
      message: 'Калібрування датчиків заплановано на завтра',
      time: '2 год тому',
      icon: 'information-circle-outline',
      color: '#3b82f6',
    },
    {
      id: 3,
      type: 'success',
      message: 'Всі параметри в нормі',
      time: '6 год тому',
      icon: 'checkmark-circle-outline',
      color: '#10b981',
    },
  ];

  const renderOverview = () => (
    <View style={styles.section}>
      {/* WQI Chart */}
      <View style={[styles.chartCard, isDarkMode && styles.chartCardDark]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <Ionicons name="trending-up" size={24} color={getWaterQualityColor(score)} />
            <Text style={[styles.chartTitle, isDarkMode && styles.chartTitleDark]}>
              WQI Динаміка (24 години)
            </Text>
          </View>
          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <Ionicons name="expand-outline" size={16} color={isDarkMode ? '#f1f5f9' : '#334155'} />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={generateChartData('wqi')}
            width={Math.max(screenWidth - 456, 350)} // Adjusted from screenWidth - 100
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>

      {/* Parameters Grid */}
      <View style={styles.parametersGrid}>
        {detailedParameters.map((param) => (
          <View key={param.key} style={[styles.parameterCard, isDarkMode && styles.parameterCardDark]}>
            <View style={styles.parameterHeader}>
              <View style={[styles.parameterIcon, { backgroundColor: `${getWaterQualityColor(score)}15` }]}>
                <Ionicons 
                  name={getParameterIcon(param.key) as any} 
                  size={20} 
                  color={getWaterQualityColor(score)} 
                />
              </View>
              <View style={styles.parameterInfo}>
                <Text style={[styles.parameterLabel, isDarkMode && styles.parameterLabelDark]}>
                  {param.label}
                </Text>
                <Text style={[styles.parameterOptimal, isDarkMode && styles.parameterOptimalDark]}>
                  Норма: {param.optimal}
                </Text>
              </View>
            </View>
            <Text style={[styles.parameterValue, { color: getWaterQualityColor(score) }]}>
              {typeof param.value === 'number' ? param.value.toFixed(1) : param.value}
              <Text style={[styles.parameterUnit, isDarkMode && styles.parameterUnitDark]}>
                {' '}{getParameterUnit(param.key)}
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTrends = () => (
    <View style={styles.section}>
      <View style={[styles.trendsContainer, isDarkMode && styles.trendsContainerDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          Аналіз трендів
        </Text>
        
        {detailedParameters.map((param) => (
          <View key={param.key} style={[styles.trendCard, isDarkMode && styles.trendCardDark]}>
            <View style={styles.trendHeader}>
              <Text style={[styles.trendTitle, isDarkMode && styles.trendTitleDark]}>
                {param.label}
              </Text>
              <View style={styles.trendValue}>
                <Ionicons name="trending-up" size={16} color="#10b981" />
                <Text style={styles.trendPercentage}>+2.5%</Text>
              </View>
            </View>
            
            <LineChart
              data={generateChartData(param.key)}
              width={screenWidth - 140}
              height={120}
              chartConfig={{
                ...chartConfig,
                color: () => getWaterQualityColor(score),
              }}
              withDots={false}
              style={styles.smallChart}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.section}>
      <View style={[styles.alertsContainer, isDarkMode && styles.alertsContainerDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          Сповіщення та попередження
        </Text>
        
        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.alertCard, isDarkMode && styles.alertCardDark]}>
            <View style={[styles.alertIcon, { backgroundColor: `${alert.color}15` }]}>
              <Ionicons name={alert.icon as any} size={20} color={alert.color} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertMessage, isDarkMode && styles.alertMessageDark]}>
                {alert.message}
              </Text>
              <Text style={[styles.alertTime, isDarkMode && styles.alertTimeDark]}>
                {alert.time}
              </Text>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, isDarkMode && styles.tabContainerDark]}>
        {[
          { key: 'overview', label: 'Огляд', icon: 'grid-outline' },
          { key: 'trends', label: 'Тренди', icon: 'trending-up' },
          { key: 'alerts', label: 'Сповіщення', icon: 'notifications-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              isDarkMode && styles.tabDark,
              activeTab === tab.key && isDarkMode && styles.tabActiveDark,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={
                activeTab === tab.key 
                  ? '#3b82f6' 
                  : isDarkMode ? '#94a3b8' : '#64748b'
              } 
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
                isDarkMode && styles.tabTextDark,
                activeTab === tab.key && isDarkMode && styles.tabTextActiveDark,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'alerts' && renderAlerts()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContainerDark: {
    backgroundColor: '#1e293b',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabDark: {
    // No background change for inactive tabs in dark mode
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabActiveDark: {
    backgroundColor: '#1e40af',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextDark: {
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabTextActiveDark: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingBottom: 24,
  },
  chartCard: {
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
  chartCardDark: {
    backgroundColor: '#1e293b',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartTitleDark: {
    color: '#f1f5f9',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDark: {
    backgroundColor: '#334155',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  parameterCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  parameterCardDark: {
    backgroundColor: '#1e293b',
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parameterIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parameterInfo: {
    flex: 1,
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  parameterLabelDark: {
    color: '#f9fafb',
  },
  parameterOptimal: {
    fontSize: 12,
    color: '#6b7280',
  },
  parameterOptimalDark: {
    color: '#9ca3af',
  },
  parameterValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  parameterUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  parameterUnitDark: {
    color: '#9ca3af',
  },
  trendsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendsContainerDark: {
    backgroundColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionTitleDark: {
    color: '#f1f5f9',
  },
  trendCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trendCardDark: {
    backgroundColor: '#334155',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  trendTitleDark: {
    color: '#f9fafb',
  },
  trendValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  smallChart: {
    borderRadius: 8,
  },
  alertsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertsContainerDark: {
    backgroundColor: '#1e293b',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  alertCardDark: {
    backgroundColor: '#334155',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  alertMessageDark: {
    color: '#f9fafb',
  },
  alertTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertTimeDark: {
    color: '#9ca3af',
  },
  alertAction: {
    padding: 8,
  },
});

export default WebMainContent;
