import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native'; // Removed ScrollView, TouchableOpacity. Added Platform, StatusBar
import ParameterCircle from './ParameterCircle'; // Import the new ParameterCircle component
// import { getWaterQualityColor } from '../utils/colorUtils'; // We'll define a local color logic for now

export interface WaterParameters {
  pH?: number;
  temperature?: number;
  tds?: number;
  turbidity?: number;
  [key: string]: number | string | undefined;
}

interface DetailedParametersViewProps {
  parameters: WaterParameters | null;
  // onClose prop is removed
}

// Placeholder color logic for parameter circles
// TODO: Refine this logic or integrate with a modified getWaterQualityColor from colorUtils.ts
const getParameterDisplayConfig = (paramKey: string, value?: number): { color: string; displayValue: string | number } => {
  let color = '#cccccc'; // Default grey for unknown or undefined
  let displayValue: string | number = value ?? 'N/A';

  if (value === undefined || value === null) {
    return { color, displayValue };
  }

  switch (paramKey) {
    case 'pH':
      if (value < 6.5) color = '#FFD700'; // Yellow (Acidic)
      else if (value <= 7.5) color = '#32CD32'; // Green (Neutral)
      else color = '#8A2BE2'; // Purple (Alkaline)
      break;
    case 'temperature':
      if (value < 10) color = '#ADD8E6'; // Light Blue (Cold)
      else if (value <= 25) color = '#007bff'; // Blue (Moderate)
      else color = '#FFA500'; // Orange (Warm)
      break;
    case 'tds':
      if (value < 150) color = '#32CD32'; // Green (Low)
      else if (value <= 300) color = '#FFD700'; // Yellow (Medium)
      else color = '#FF6347'; // Red (High)
      break;
    case 'turbidity':
      if (value < 1) color = '#32CD32'; // Green (Clear)
      else if (value <= 5) color = '#FFD700'; // Yellow (Slightly Turbid)
      else color = '#A0522D'; // Brown (Turbid)
      break;
    default:
      color = '#007bff'; // Default blue for other params
  }
  return { color, displayValue };
};

const DetailedParametersView: React.FC<DetailedParametersViewProps> = ({ parameters }) => {
  if (!parameters) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.noDataText}>Детальні параметри недоступні.</Text>
      </View>
    );
  }

  const paramConfigs = [
    { key: 'pH', label: 'pH', unit: '' },
    { key: 'temperature', label: 'Темп.', unit: '°C' },
    { key: 'tds', label: 'TDS', unit: 'ppm' },
    { key: 'turbidity', label: 'Калам.', unit: 'NTU' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Детальні Параметри</Text>
      <View style={styles.gridContainer}>
        {paramConfigs.map(config => {
          const value = parameters[config.key];
          const numericValue = typeof value === 'number' ? value : undefined;
          const { color: circleColor, displayValue } = getParameterDisplayConfig(config.key, numericValue);

          return (
            <ParameterCircle
              key={config.key}
              label={config.label}
              value={displayValue} // Use processed displayValue (can be 'N/A')
              unit={config.unit}
              circleColor={circleColor}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Match main screen background
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60, // Adjusted top padding
    paddingHorizontal: 10,
    alignItems: 'center', 
    zIndex: 1, // Ensure it's above the main view
  },
  centered: {
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'flex-start', // Or 'center' if preferred for vertical alignment of rows
    width: '100%',
    flex: 1, // Added to help the grid take available vertical space
    zIndex: 1, // Ensure it's above the main view
  },
  noDataText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default DetailedParametersView;
