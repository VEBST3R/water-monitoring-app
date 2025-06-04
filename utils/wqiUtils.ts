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
  const turbidity = params.turbidity ?? 1;    // Define weight coefficients for each parameter (based on contamination detection priority)
  const weights = {
    turbidity: 0.50,   // Highest impact - direct indicator of water contamination and filtration quality
    tds: 0.40,         // High impact - shows dissolved contaminants and salt levels
    pH: 0.08,          // Lower impact - affects chemical safety and taste
    temperature: 0.02  // Lowest impact - mainly affects taste and infrastructure, not safety
  };
  
  // Score each parameter from 0-100
  let pHScore = 0;
  let tempScore = 0;
  let tdsScore = 0;
  let turbidityScore = 0;
    // pH scoring (ideal range: 6.8-7.5, stricter evaluation)
  if (pH >= 6.8 && pH <= 7.5) {
    // Optimal range gets high score
    pHScore = 100 - Math.abs(7.15 - pH) * 8;
  } else if (pH >= 6.5 && pH < 6.8) {
    // Slightly acidic
    pHScore = 85 - (6.8 - pH) * 25;
  } else if (pH > 7.5 && pH <= 8.0) {
    // Slightly alkaline
    pHScore = 85 - (pH - 7.5) * 25;
  } else if (pH >= 6.0 && pH < 6.5) {
    // Acidic - concerning
    pHScore = 60 - (6.5 - pH) * 30;
  } else if (pH > 8.0 && pH <= 8.5) {
    // Alkaline - concerning
    pHScore = 60 - (pH - 8.0) * 30;
  } else if (pH >= 5.5 && pH < 6.0) {
    // Very acidic - poor quality
    pHScore = 30 - (6.0 - pH) * 30;
  } else if (pH > 8.5 && pH <= 9.0) {
    // Very alkaline - poor quality
    pHScore = 30 - (pH - 8.5) * 30;
  } else {
    // Extreme values - unacceptable
    pHScore = 0;
  }
    // Temperature scoring (ideal: 10-30°C for drinking water systems)
  // Temperature has lower impact on water safety - mainly affects taste and pipe systems
  if (temperature >= 10 && temperature <= 30) {
    // Wide optimal range - temperature less critical for drinking water
    tempScore = 100 - Math.abs(20 - temperature) * 1.5;
  } else if (temperature >= 0 && temperature < 10) {
    // Cold but still safe
    tempScore = 85 - (10 - temperature) * 2;
  } else if (temperature > 30 && temperature <= 40) {
    // Warm but still acceptable
    tempScore = 85 - (temperature - 30) * 2;
  } else if (temperature >= -5 && temperature < 0) {
    // Very cold
    tempScore = 70 - (Math.abs(temperature)) * 5;
  } else if (temperature > 40 && temperature <= 50) {
    // Hot but not dangerous
    tempScore = 65 - (temperature - 40) * 3;
  } else {
    // Extreme temperatures - affects infrastructure more than safety
    tempScore = Math.max(30, 50 - Math.abs(temperature - 25) * 2);
  }    // TDS scoring (ideal: <200 mg/L for drinking water, VERY STRICT evaluation)
  if (tds <= 150) {
    // Excellent - ultra pure water
    tdsScore = 100;
  } else if (tds > 150 && tds <= 250) {
    // Good - still pure
    tdsScore = 85 - ((tds - 150) / 100) * 20;
  } else if (tds > 250 && tds <= 400) {
    // Fair - acceptable but noticeable
    tdsScore = 65 - ((tds - 250) / 150) * 30;
  } else if (tds > 400 && tds <= 600) {
    // Poor - high mineral content, taste affected
    tdsScore = 35 - ((tds - 400) / 200) * 25;
  } else if (tds > 600 && tds <= 800) {
    // Very poor - unacceptable taste
    tdsScore = 10 - ((tds - 600) / 200) * 10;
  } else if (tds > 800 && tds <= 1000) {
    // Critical - barely drinkable
    tdsScore = 5 - ((tds - 800) / 200) * 5;
  } else {
    // Completely unacceptable - dangerous levels
    tdsScore = 0;
  }    // Turbidity scoring (ideal: <0.3 NTU for drinking water, EXTREMELY STRICT evaluation)
  if (turbidity <= 0.3) {
    // Excellent - crystal clear water
    turbidityScore = 100;
  } else if (turbidity > 0.3 && turbidity <= 0.6) {
    // Good - very clear but slightly above optimal
    turbidityScore = 85 - ((turbidity - 0.3) / 0.3) * 20;
  } else if (turbidity > 0.6 && turbidity <= 1.0) {
    // Fair - acceptable but visible cloudiness
    turbidityScore = 65 - ((turbidity - 0.6) / 0.4) * 25;
  } else if (turbidity > 1.0 && turbidity <= 2.0) {
    // Poor - noticeably cloudy
    turbidityScore = 40 - ((turbidity - 1.0) / 1.0) * 25;
  } else if (turbidity > 2.0 && turbidity <= 5.0) {
    // Very poor - heavily contaminated
    turbidityScore = Math.max(0, 15 - ((turbidity - 2.0) / 3.0) * 15);
  } else if (turbidity > 5.0 && turbidity <= 10.0) { 
    // Critical - extremely muddy, very low score
    turbidityScore = Math.max(0, 5 - ((turbidity - 5.0) / 5.0) * 5);
  } else {
    // Completely unacceptable - like mud
    turbidityScore = 0;
  }    // Calculate weighted average (prioritizing contamination indicators)
  const wqi = 
    weights.turbidity * turbidityScore +  // 50% - most critical for contamination detection
    weights.tds * tdsScore +              // 40% - high impact on water quality  
    weights.pH * pHScore +                // 8% - lower impact on safety
    weights.temperature * tempScore;      // 2% - lowest impact on drinking water safety
  
  let finalWQI = wqi;

  // Apply penalty for critical parameter values
  const isCriticalTDS = tds > 500;
  const isVeryCriticalTDS = tds > 1000; // New condition for very high TDS
  const isCriticalTurbidity = turbidity > 5; // Reinstated for strict penalty
  const isCriticalPH = pH < 6.0 || pH > 9.0;

  if (isVeryCriticalTDS) { // Stricter penalty for TDS > 1000
    finalWQI = Math.min(finalWQI, 29); // Cap WQI at 29
  } else if (isCriticalTDS || isCriticalTurbidity || isCriticalPH) { // isCriticalTurbidity added back
    finalWQI = Math.min(finalWQI, 39); // Cap WQI at 39 for other critical conditions
  }

  // Return rounded value, clamped between 0 and 100
  return Math.max(0, Math.min(100, Math.round(finalWQI)));
};
