import { WaterParameters } from '@/components/DetailedParametersView';

/**
 * Calculates Water Quality Index (WQI) based on water parameters
 * @param params Water parameters: pH, temperature, TDS, and turbidity
 * @returns WQI value from 0-100 where higher is better
 */
export const calculateWQI = (params: WaterParameters): number => {
  // Default values for missing parameters
  const pH = params.pH ?? 7;
  const temperature = params.temperature ?? 20;
  const tds = params.tds ?? 300;
  const turbidity = params.turbidity ?? 1;
  
  // Define weight coefficients for each parameter
  const weights = {
    pH: 0.25,
    temperature: 0.20,
    tds: 0.25,
    turbidity: 0.30
  };
  
  // Score each parameter from 0-100
  let pHScore = 0;
  let tempScore = 0;
  let tdsScore = 0;
  let turbidityScore = 0;
  
  // pH scoring (ideal range: 6.5-8.5)
  if (pH >= 6.5 && pH <= 8.5) {
    // Optimal range gets high score
    pHScore = 100 - Math.abs(7.5 - pH) * 10;
  } else if (pH >= 5 && pH < 6.5) {
    // Slightly acidic
    pHScore = 80 - (6.5 - pH) * 20;
  } else if (pH > 8.5 && pH <= 10) {
    // Slightly alkaline
    pHScore = 80 - (pH - 8.5) * 20;
  } else if (pH >= 3 && pH < 5) {
    // Very acidic
    pHScore = 40 - (5 - pH) * 10;
  } else if (pH > 10 && pH <= 12) {
    // Very alkaline
    pHScore = 40 - (pH - 10) * 10;
  } else {
    // Extreme values
    pHScore = 0;
  }
  
  // Temperature scoring (ideal: 15-25°C for most aquatic life)
  if (temperature >= 15 && temperature <= 25) {
    // Optimal range
    tempScore = 100 - Math.abs(20 - temperature) * 3;
  } else if (temperature >= 5 && temperature < 15) {
    // Cold but acceptable
    tempScore = 70 - (15 - temperature) * 3;
  } else if (temperature > 25 && temperature <= 35) {
    // Warm but acceptable
    tempScore = 70 - (temperature - 25) * 3;
  } else if (temperature >= 0 && temperature < 5) {
    // Very cold
    tempScore = 40 - (5 - temperature) * 8;
  } else if (temperature > 35 && temperature <= 40) {
    // Very hot
    tempScore = 40 - (temperature - 35) * 8;
  } else {
    // Extreme temperatures
    tempScore = 0;
  }
  
  // TDS scoring (ideal: <500 mg/L for drinking water)
  if (tds <= 300) {
    // Excellent
    tdsScore = 100;
  } else if (tds > 300 && tds <= 500) {
    // Good
    tdsScore = 90 - ((tds - 300) / 200) * 10;
  } else if (tds > 500 && tds <= 900) {
    // Fair
    tdsScore = 80 - ((tds - 500) / 400) * 20;
  } else if (tds > 900 && tds <= 1200) {
    // Poor
    tdsScore = 60 - ((tds - 900) / 300) * 20;
  } else if (tds > 1200 && tds <= 2000) {
    // Very poor
    tdsScore = 40 - ((tds - 1200) / 800) * 40;
  } else {
    // Unacceptable
    tdsScore = Math.max(0, 30 - ((tds - 2000) / 1000) * 30);
  }
  
  // Turbidity scoring (ideal: <1 NTU for drinking water)
  if (turbidity <= 1) {
    // Excellent
    turbidityScore = 100;
  } else if (turbidity > 1 && turbidity <= 5) {
    // Good
    turbidityScore = 90 - ((turbidity - 1) / 4) * 20;
  } else if (turbidity > 5 && turbidity <= 10) {
    // Fair
    turbidityScore = 70 - ((turbidity - 5) / 5) * 20;
  } else if (turbidity > 10 && turbidity <= 20) {
    // Poor
    turbidityScore = 50 - ((turbidity - 10) / 10) * 30;
  } else {
    // Very poor to unacceptable
    turbidityScore = Math.max(0, 20 - ((turbidity - 20) / 10) * 20);
  }
  
  // Calculate weighted average
  const wqi = 
    weights.pH * pHScore +
    weights.temperature * tempScore +
    weights.tds * tdsScore +
    weights.turbidity * turbidityScore;
  
  // Return rounded value
  return Math.max(0, Math.min(100, Math.round(wqi)));
};
