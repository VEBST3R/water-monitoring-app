import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Svg, Circle as SvgCircle } from 'react-native-svg';

interface ParameterCircleProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  circleColor?: string;
}

const { width } = Dimensions.get('window');
const circleDiameter = width * 0.38; // Adjusted size for 2x2 grid
const strokeWidth = 8;
const radius = (circleDiameter - strokeWidth) / 2;

const ParameterCircle: React.FC<ParameterCircleProps> = ({ label, value, unit, circleColor = '#007bff' }) => {
  if (value === undefined || value === null) {
    return (
      <View style={styles.container}>
        <View style={styles.circleWrapper}>
          <Svg width={circleDiameter} height={circleDiameter} viewBox={`0 0 ${circleDiameter} ${circleDiameter}`}>
            <SvgCircle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={radius}
              stroke={circleColor}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          </Svg>
          <View style={styles.textContainer} pointerEvents="none">
            <Text style={styles.labelText}>{label}</Text>
            <Text style={styles.valueText}>N/A</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <Svg width={circleDiameter} height={circleDiameter} viewBox={`0 0 ${circleDiameter} ${circleDiameter}`}>
          <SvgCircle
            cx={circleDiameter / 2}
            cy={circleDiameter / 2}
            r={radius}
            stroke={circleColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>
        <View style={styles.textContainer} pointerEvents="none">
          <Text style={styles.labelText}>{label}</Text>
          <Text style={styles.valueText}>{String(value)}{unit ? ` ${unit}` : ''}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '50%', // Each circle takes up half the width of the parent
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10, // Padding around each circle container
    backgroundColor: 'Transparent', // Transparent background for the container
  },
  circleWrapper: {
    width: circleDiameter,
    height: circleDiameter,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Add shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 5, // Prevent text from touching circle edge
  },
  labelText: {
    fontSize: circleDiameter * 0.12,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  valueText: {
    fontSize: circleDiameter * 0.15,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ParameterCircle;
