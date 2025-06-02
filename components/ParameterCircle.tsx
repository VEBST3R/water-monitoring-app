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
const parameterStrokeWidth = 10; // New stroke width for the parameter circle
const backgroundCircleStrokeWidth = 1; // Stroke width for the background circle's border

// Radius for the center of the thick foreground stroke
const foregroundCircleRadius = (circleDiameter - parameterStrokeWidth) / 2;
// Radius for the center of the thin background border stroke
const backgroundCircleRadius = (circleDiameter - backgroundCircleStrokeWidth) / 2;

const ParameterCircle: React.FC<ParameterCircleProps> = ({ label, value, unit, circleColor = '#007bff' }) => {
  if (value === undefined || value === null) {
    return (
      <View style={styles.container}>
        <View style={styles.circleWrapper}>
          <Svg width={circleDiameter} height={circleDiameter} viewBox={`0 0 ${circleDiameter} ${circleDiameter}`}>
            {/* Background Circle */}
            <SvgCircle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={backgroundCircleRadius}
              fill="rgba(255, 255, 255, 0.2)"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={backgroundCircleStrokeWidth}
            />
            {/* Foreground Circle (Stroke Only) */}
            <SvgCircle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={foregroundCircleRadius}
              stroke={circleColor} // Use circleColor for stroke
              strokeWidth={parameterStrokeWidth} // Use new stroke width
              fill="transparent" // No fill
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
          {/* Background Circle */}
          <SvgCircle
            cx={circleDiameter / 2}
            cy={circleDiameter / 2}
            r={backgroundCircleRadius}
            fill="rgba(255, 255, 255, 0.2)"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={backgroundCircleStrokeWidth}
          />
          {/* Foreground Circle (Stroke Only) */}
          <SvgCircle
            cx={circleDiameter / 2}
            cy={circleDiameter / 2}
            r={foregroundCircleRadius}
            stroke={circleColor} // Use circleColor for stroke
            strokeWidth={parameterStrokeWidth} // Use new stroke width
            fill="transparent" // No fill
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
    // Updated shadows to match ScoreCircle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.0, // Adjusted shadow radius
    elevation: 8, // Adjusted elevation
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 5, // Prevent text from touching circle edge
  },
  labelText: {
    fontSize: circleDiameter * 0.12, // Reverted font size
    color: '#333', // Reverted to darker color
    fontWeight: 'bold', // Reverted font weight
    textAlign: 'center',
  },
  valueText: {
    fontSize: circleDiameter * 0.15, // Reverted font size
    color: '#000', // Reverted to darker color
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ParameterCircle;
