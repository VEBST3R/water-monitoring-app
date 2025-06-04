// Тестування поточної системи WQI з високим TDS
function calculateWQI(params) {
  const pH = params.pH ?? 7;
  const temperature = params.temperature ?? 20;
  const tds = params.tds ?? 300;
  const turbidity = params.turbidity ?? 1;

  const weights = {
    turbidity: 0.50, // Increased weight for turbidity
    tds: 0.40,       // Increased weight for TDS
    pH: 0.08,        // Decreased weight for pH
    temperature: 0.02 // Decreased weight for temperature
  };

  let pHScore = 0;
  let tempScore = 0;
  let tdsScore = 0;
  let turbidityScore = 0;

  // pH scoring
  if (pH >= 6.8 && pH <= 7.5) {
    pHScore = 100 - Math.abs(7.15 - pH) * 8;
  } else if (pH >= 6.5 && pH < 6.8) {
    pHScore = 85 - (6.8 - pH) * 25;
  } else if (pH > 7.5 && pH <= 8.0) {
    pHScore = 85 - (pH - 7.5) * 25;
  } else if (pH >= 6.0 && pH < 6.5) {
    pHScore = 60 - (6.5 - pH) * 30;
  } else if (pH > 8.0 && pH <= 8.5) {
    pHScore = 60 - (pH - 8.0) * 30;
  } else if (pH >= 5.5 && pH < 6.0) {
    pHScore = 30 - (6.0 - pH) * 30;
  } else if (pH > 8.5 && pH <= 9.0) {
    pHScore = 30 - (pH - 8.5) * 30;
  } else {
    pHScore = 0;
  }

  // Temperature scoring
  if (temperature >= 10 && temperature <= 30) {
    tempScore = 100 - Math.abs(20 - temperature) * 1.5;
  } else if (temperature >= 0 && temperature < 10) {
    tempScore = 85 - (10 - temperature) * 2;
  } else if (temperature > 30 && temperature <= 40) {
    tempScore = 85 - (temperature - 30) * 2;
  } else if (temperature >= -5 && temperature < 0) {
    tempScore = 70 - (Math.abs(temperature)) * 5;
  } else if (temperature > 40 && temperature <= 50) {
    tempScore = 65 - (temperature - 40) * 3;
  } else {
    tempScore = Math.max(30, 50 - Math.abs(temperature - 25) * 2);
  }

  // TDS scoring (ideal: <200 mg/L for drinking water, VERY STRICT evaluation)
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
  }

  // Turbidity scoring (ideal: <0.3 NTU for drinking water, EXTREMELY STRICT evaluation)
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
    // Critical - extremely muddy, very low score (reverted to strict)
    turbidityScore = Math.max(0, 5 - ((turbidity - 5.0) / 5.0) * 5);
  } else {
    // Completely unacceptable - like mud
    turbidityScore = 0;
  }

  const wqi = 
    weights.turbidity * turbidityScore +
    weights.tds * tdsScore +
    weights.pH * pHScore +
    weights.temperature * tempScore;

  console.log(`📊 Детальний розрахунок WQI:`);
  console.log(`pH: ${pH} → Оцінка: ${pHScore.toFixed(1)} (вага: ${weights.pH * 100}%)`);
  console.log(`Температура: ${temperature}°C → Оцінка: ${tempScore.toFixed(1)} (вага: ${weights.temperature * 100}%)`);
  console.log(`TDS: ${tds} ppm → Оцінка: ${tdsScore.toFixed(1)} (вага: ${weights.tds * 100}%)`);
  console.log(`Каламутність: ${turbidity} NTU → Оцінка: ${turbidityScore.toFixed(1)} (вага: ${weights.turbidity * 100}%)`);
  console.log(`\n🔢 Розрахунок:`);
  console.log(`WQI = ${weights.turbidity} × ${turbidityScore.toFixed(1)} + ${weights.tds} × ${tdsScore.toFixed(1)} + ${weights.pH} × ${pHScore.toFixed(1)} + ${weights.temperature} × ${tempScore.toFixed(1)}`);
  console.log(`WQI = ${(weights.turbidity * turbidityScore).toFixed(1)} + ${(weights.tds * tdsScore).toFixed(1)} + ${(weights.pH * pHScore).toFixed(1)} + ${(weights.temperature * tempScore).toFixed(1)}`);

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

  return Math.max(0, Math.min(100, Math.round(finalWQI)));
}

console.log('🧪 ТЕСТУВАННЯ СЦЕНАРІЮ З НОВОГО ЗОБРАЖЕННЯ\\n');

// Параметри з наданого нового зображення
const testParams = {
  pH: 7.08,
  temperature: 16.1,
  tds: 285,
  turbidity: 3.2
};

const result = calculateWQI(testParams);
console.log(`\\n🎯 РОЗРАХОВАНИЙ WQI для параметрів з нового зображення: ${result}`);

// Опціонально: можна видалити або закоментувати порівняння з expectedWQI, 
// оскільки зараз ми просто розраховуємо значення для нових параметрів.
// const expectedWQI = 70; 
// if (result !== expectedWQI) {
//   console.log(`\\n⚠️ УВАГА: Розрахований WQI (${result}) не співпадає з очікуваним значенням користувача (${expectedWQI}).`);
// } else {
//   console.log(`\\n✅ Розрахований WQI (${result}) співпадає з очікуваним значенням користувача.`);
// }
