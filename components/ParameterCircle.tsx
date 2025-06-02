import { Colors } from '@/constants/Colors'; // Import Colors
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Svg, Circle as SvgCircle } from 'react-native-svg';

interface ParameterCircleProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  circleColor?: string;
}

const { width } = Dimensions.get('window');
const circleDiameter = width * 0.38; 
// const parameterStrokeWidth = 10; // Will use strokeWidth from ScoreCircle style
const scoreCircleStrokeWidth = 15; // Matching ScoreCircle strokeWidth

// Radius for the center of the thick foreground stroke
const foregroundCircleRadius = (circleDiameter - scoreCircleStrokeWidth) / 2;
// Background circle with opacity, similar to ScoreCircle's inner circle
const backgroundCircleRadius = (circleDiameter - (scoreCircleStrokeWidth - (Platform.OS === 'ios' ? 1 : 2))) / 2;


const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle); // Create AnimatedComponent

const ParameterCircle: React.FC<ParameterCircleProps> = ({ label, value, unit, circleColor = Colors.light.tint }) => { // Use Colors.light.tint as default
  if (value === undefined || value === null) {
    return (
      <View style={styles.container}>
        <View style={styles.circleWrapper}>
          <Svg width={circleDiameter} height={circleDiameter} viewBox={`0 0 ${circleDiameter} ${circleDiameter}`}>
            {/* Background Circle with opacity (like ScoreCircle's inner one) */}
            <AnimatedSvgCircle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={backgroundCircleRadius}
              stroke={circleColor} 
              strokeWidth={scoreCircleStrokeWidth - (Platform.OS === 'ios' ? 1 : 2)}
              strokeOpacity={0.3} // Match ScoreCircle's inner circle opacity
              fill="transparent"
            />
            {/* Foreground Circle (Stroke Only) - This is the main colored stroke */}
            <AnimatedSvgCircle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={foregroundCircleRadius} // Use foregroundCircleRadius
              stroke={circleColor} 
              strokeWidth={scoreCircleStrokeWidth} // Match ScoreCircle's main stroke width
              fill="transparent" 
              strokeLinecap="round" // Match ScoreCircle style
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
          {/* Background Circle with opacity */}
          <AnimatedSvgCircle
            cx={circleDiameter / 2}
            cy={circleDiameter / 2}
            r={backgroundCircleRadius}
            stroke={circleColor}
            strokeWidth={scoreCircleStrokeWidth - (Platform.OS === 'ios' ? 1 : 2)}
            strokeOpacity={0.3}
            fill="transparent"
          />
          {/* Foreground Circle (Stroke Only) */}
          <AnimatedSvgCircle
            cx={circleDiameter / 2}
            cy={circleDiameter / 2}
            r={foregroundCircleRadius}
            stroke={circleColor} 
            strokeWidth={scoreCircleStrokeWidth}
            fill="transparent"
            strokeLinecap="round"
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
    width: '50%', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10, 
    backgroundColor: 'transparent', // Changed to transparent
  },
  circleWrapper: {
    width: circleDiameter,
    height: circleDiameter,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Matching ScoreCircle shadow styles
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // ScoreCircle uses height: 2 in some places, but 4 in others. Let's try 2 for a subtle effect or match the main one.
    shadowOpacity: 0.25, // ScoreCircle uses 0.25 or 0.3
    shadowRadius: 3.84, // ScoreCircle uses 3.84 or 4.0
    elevation: 5, // ScoreCircle uses 5 or 8.
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
    color: Colors.light.text, // Use themed color
    fontWeight: 'bold', 
    textAlign: 'center',
  },
  valueText: {
    fontSize: circleDiameter * 0.15, 
    color: Colors.light.text, // Use themed color
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ParameterCircle;
