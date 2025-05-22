export const getWaterQualityColor = (score: number): string => {
  if (score <= 0) return '#A52A2A'; // Brown for 0 or less
  if (score <= 20) return '#A52A2A'; // Brown
  if (score <= 40) return '#FF0000'; // Red
  if (score <= 60) return '#E9CE46'; // Darker Yellow
  if (score <= 80) return '#008000'; // Green
  if (score <= 100) return '#0000FF'; // Blue
  return '#0000FF'; // Blue for 100 or more
};

// Updated to return a single base color for waves
// Opacity will be handled in the WaveAnimation component
export const getWaveColor = (score: number): string => {
  return getWaterQualityColor(score);
};
