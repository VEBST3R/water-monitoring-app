export const getWaterQualityColor = (score: number): string => {
  if (score <= 20) return '#A52A2A'; // Brown (Very Poor / Dirty)
  if (score <= 40) return '#A0522D'; // Sienna (Poor)
  if (score <= 55) return '#F4A460'; // SandyBrown (Fair)
  if (score <= 70) return '#F0E68C'; // Khaki (Moderate)
  if (score <= 85) return '#48D1CC'; // MediumTurquoise (Good)
  return '#1E90FF'; // DodgerBlue (Excellent / Clean Water for scores > 85)
};

// Updated to return a single base color for waves
// Opacity will be handled in the WaveAnimation component
export const getWaveColor = (score: number): string => {
  return getWaterQualityColor(score);
};
