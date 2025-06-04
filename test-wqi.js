// Тестирование новых WQI расчетов с обновленными весами
// pH: 35%, Turbidity: 35%, TDS: 20%, Temperature: 10%

function calculateWQI(params) {
  const pH = params.pH ?? 7;
  const temperature = params.temperature ?? 20;
  const tds = params.tds ?? 300;
  const turbidity = params.turbidity ?? 1;
  
  const weights = {
    pH: 0.35,          // Highest impact - affects chemical safety and taste
    turbidity: 0.35,   // Highest impact - indicates contamination and filtration needs  
    tds: 0.20,         // Moderate impact - affects taste and equipment
    temperature: 0.10  // Lowest impact - mainly affects aquatic life, not human consumption safety
  };
  
  // Score each parameter from 0-100
  let pHScore = 0;
  let tempScore = 0;
  let tdsScore = 0;
  let turbidityScore = 0;
  
  // pH scoring (ideal range: 6.5-8.5)
  if (pH >= 6.5 && pH <= 8.5) {
    pHScore = 100 - Math.abs(7.5 - pH) * 10;
  } else if (pH >= 5 && pH < 6.5) {
    pHScore = 80 - (6.5 - pH) * 20;
  } else if (pH > 8.5 && pH <= 10) {
    pHScore = 80 - (pH - 8.5) * 20;
  } else if (pH >= 3 && pH < 5) {
    pHScore = 40 - (5 - pH) * 10;
  } else if (pH > 10 && pH <= 12) {
    pHScore = 40 - (pH - 10) * 10;
  } else {
    pHScore = 0;
  }
  
  // Temperature scoring (ideal: 10-30°C for drinking water systems)
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
  
  // TDS scoring (ideal: <500 mg/L for drinking water)
  if (tds <= 300) {
    tdsScore = 100;
  } else if (tds > 300 && tds <= 500) {
    tdsScore = 90 - ((tds - 300) / 200) * 10;
  } else if (tds > 500 && tds <= 900) {
    tdsScore = 80 - ((tds - 500) / 400) * 20;
  } else if (tds > 900 && tds <= 1200) {
    tdsScore = 60 - ((tds - 900) / 300) * 20;
  } else if (tds > 1200 && tds <= 2000) {
    tdsScore = 40 - ((tds - 1200) / 800) * 40;
  } else {
    tdsScore = Math.max(0, 30 - ((tds - 2000) / 1000) * 30);
  }
  
  // Turbidity scoring (ideal: <1 NTU for drinking water)
  if (turbidity <= 1) {
    turbidityScore = 100;
  } else if (turbidity > 1 && turbidity <= 5) {
    turbidityScore = 90 - ((turbidity - 1) / 4) * 20;
  } else if (turbidity > 5 && turbidity <= 10) {
    turbidityScore = 70 - ((turbidity - 5) / 5) * 20;
  } else if (turbidity > 10 && turbidity <= 20) {
    turbidityScore = 50 - ((turbidity - 10) / 10) * 30;
  } else {
    turbidityScore = Math.max(0, 20 - ((turbidity - 20) / 10) * 20);
  }
  
  // Calculate weighted average
  const wqi = 
    weights.pH * pHScore +
    weights.temperature * tempScore +
    weights.tds * tdsScore +
    weights.turbidity * turbidityScore;
  
  return {
    wqi: Math.max(0, Math.min(100, Math.round(wqi))),
    scores: { pHScore, tempScore, tdsScore, turbidityScore },
    weights
  };
}

// Тестовые сценарии
console.log('=== ТЕСТИРОВАНИЕ НОВЫХ WQI РАСЧЕТОВ ===\n');

// 1. Идеальная вода
console.log('1. Идеальная вода:');
const perfect = calculateWQI({ pH: 7.0, temperature: 20, tds: 250, turbidity: 0.5 });
console.log(`pH: 7.0, Temp: 20°C, TDS: 250, Turbidity: 0.5`);
console.log(`WQI: ${perfect.wqi}/100`);
console.log(`Scores: pH=${perfect.scores.pHScore}, Temp=${perfect.scores.tempScore}, TDS=${perfect.scores.tdsScore}, Turbidity=${perfect.scores.turbidityScore}\n`);

// 2. Проблемы с pH (критически важно - 35% вес)
console.log('2. Проблемы с pH (критично):');
const badPH = calculateWQI({ pH: 4.5, temperature: 20, tds: 250, turbidity: 0.5 });
console.log(`pH: 4.5, Temp: 20°C, TDS: 250, Turbidity: 0.5`);
console.log(`WQI: ${badPH.wqi}/100 (должен быть низким из-за кислого pH)\n`);

// 3. Высокая мутность (критически важно - 35% вес)
console.log('3. Высокая мутность (критично):');
const highTurbidity = calculateWQI({ pH: 7.0, temperature: 20, tds: 250, turbidity: 15 });
console.log(`pH: 7.0, Temp: 20°C, TDS: 250, Turbidity: 15`);
console.log(`WQI: ${highTurbidity.wqi}/100 (должен быть низким из-за мутности)\n`);

// 4. Высокая температура (менее критично - только 10% вес)
console.log('4. Высокая температура (менее критично):');
const highTemp = calculateWQI({ pH: 7.0, temperature: 45, tds: 250, turbidity: 0.5 });
console.log(`pH: 7.0, Temp: 45°C, TDS: 250, Turbidity: 0.5`);
console.log(`WQI: ${highTemp.wqi}/100 (должен оставаться относительно высоким)\n`);

// 5. Высокий TDS (умеренное влияние - 20% вес)
console.log('5. Высокий TDS (умеренное влияние):');
const highTDS = calculateWQI({ pH: 7.0, temperature: 20, tds: 1500, turbidity: 0.5 });
console.log(`pH: 7.0, Temp: 20°C, TDS: 1500, Turbidity: 0.5`);
console.log(`WQI: ${highTDS.wqi}/100 (умеренное снижение)\n`);

// 6. Сравнение: температура vs pH влияние
console.log('6. Сравнение критичности параметров:');
console.log('Старая система (равные веса): pH и температура имели одинаковое влияние');
console.log('Новая система: pH влияет в 3.5 раза сильнее температуры');

const tempIssue = calculateWQI({ pH: 7.0, temperature: 50, tds: 300, turbidity: 1 });
const pHIssue = calculateWQI({ pH: 4.0, temperature: 20, tds: 300, turbidity: 1 });

console.log(`Проблема с температурой (50°C): WQI = ${tempIssue.wqi}`);
console.log(`Проблема с pH (4.0): WQI = ${pHIssue.wqi}`);
console.log(`Разница: ${Math.abs(tempIssue.wqi - pHIssue.wqi)} баллов\n`);

console.log('=== ВЕСА ПАРАМЕТРОВ ===');
console.log('pH: 35% (химическая безопасность и вкус)');
console.log('Мутность: 35% (загрязнение и фильтрация)');
console.log('TDS: 20% (вкус и оборудование)');
console.log('Температура: 10% (в основном влияет на водные организмы, а не на безопасность потребления)');
