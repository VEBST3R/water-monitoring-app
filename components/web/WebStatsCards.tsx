import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WebStatsCardsProps {
  score: number;
  detailedParams: any;
  isDarkMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'loading';
}

const WebStatsCards: React.FC<WebStatsCardsProps> = ({
  score,
  detailedParams,
  isDarkMode,
  connectionStatus,
}) => {
  const getWQIStatus = (score: number) => {
    if (score >= 80) return { text: 'Відмінна', color: '#10b981' };
    if (score >= 60) return { text: 'Хороша', color: '#3b82f6' };
    if (score >= 40) return { text: 'Прийнятна', color: '#f59e0b' };
    if (score >= 20) return { text: 'Погана', color: '#ef4444' };
    return { text: 'Дуже погана', color: '#dc2626' };
  };

  const status = getWQIStatus(score);

  // Stat cards data
  const stats = [
    {
      title: 'WQI Індекс',
      value: score.toString(),
      unit: '',
      icon: 'speedometer-outline',
      color: status.color,
      status: status.text,
      trend: '+2%',
      trendUp: true,
    },
    {
      title: 'pH Рівень',
      value: detailedParams?.pH?.toFixed(1) || '7.0',
      unit: 'pH',
      icon: 'flask-outline',
      color: '#6366f1',
      status: 'Нормальний',
      trend: '-0.1',
      trendUp: false,
    },
    {
      title: 'Температура',
      value: detailedParams?.temperature?.toFixed(1) || '20.0',
      unit: '°C',
      icon: 'thermometer-outline',
      color: '#f59e0b',
      status: 'Стабільна',
      trend: '+1.2°C',
      trendUp: true,
    },
    {
      title: 'TDS Рівень',
      value: detailedParams?.tds?.toFixed(0) || '300',
      unit: 'ppm',
      icon: 'water-outline',
      color: '#10b981',
      status: 'Низький',
      trend: '+5 ppm',
      trendUp: true,
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.card,
            isDarkMode && styles.cardDark,
          ]}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                {stat.title}
              </Text>
              <Text style={[styles.cardStatus, { color: stat.color }]}>
                {stat.status}
              </Text>
            </View>
          </View>

          {/* Value */}
          <View style={styles.cardValue}>
            <Text style={[styles.valueText, { color: stat.color }]}>
              {stat.value}
              <Text style={[styles.unitText, isDarkMode && styles.unitTextDark]}>
                {stat.unit}
              </Text>
            </Text>
          </View>

          {/* Progress Bar for WQI */}
          {stat.title === 'WQI Індекс' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${score}%`, backgroundColor: stat.color }
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, isDarkMode && styles.progressLabelDark]}>0</Text>
                <Text style={[styles.progressLabel, isDarkMode && styles.progressLabelDark]}>50</Text>
                <Text style={[styles.progressLabel, isDarkMode && styles.progressLabelDark]}>100</Text>
              </View>
            </View>
          )}

          {/* Trend */}
          <View style={styles.trendContainer}>
            <Ionicons
              name={stat.trendUp ? 'trending-up' : 'trending-down'}
              size={16}
              color={stat.trendUp ? '#10b981' : '#ef4444'}
            />
            <Text style={[
              styles.trendText,
              { color: stat.trendUp ? '#10b981' : '#ef4444' }
            ]}>
              {stat.trend}
            </Text>
            <Text style={[styles.trendPeriod, isDarkMode && styles.trendPeriodDark]}>
              за 24 години
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  cardTitleDark: {
    color: '#94a3b8',
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardValue: {
    marginBottom: 16,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  unitTextDark: {
    color: '#94a3b8',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  progressLabelDark: {
    color: '#94a3b8',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 8,
  },
  trendPeriod: {
    fontSize: 12,
    color: '#64748b',
  },
  trendPeriodDark: {
    color: '#94a3b8',
  },
});

export default WebStatsCards;
