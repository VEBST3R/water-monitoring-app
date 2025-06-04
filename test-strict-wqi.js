// Тестування новної строгої системи WQI
console.log('🧪 ТЕСТУВАННЯ НОВОЇ СТРОГОЇ СИСТЕМИ WQI\n');

// Функція розрахунку WQI (нова версія)
function calculateWQI(params) {
  const pH = params.pH ?? 7;
  const temperature = params.temperature ?? 20;
  const tds = params.tds ?? 300;
  const turbidity = params.turbidity ?? 1;
  
  // Нові ваги - каламутність та TDS найважливіші
  const weights = {
    turbidity: 0.40,   // 40% - найвища важливість для виявлення забруднення
    tds: 0.30,         // 30% - висока важливість для якості води
    pH: 0.20,          // 20% - помірна важливість для безпеки
    temperature: 0.10  // 10% - найменша важливість для питної води
  };
  
  let pHScore = 0;
  let tempScore = 0;
  let tdsScore = 0;
  let turbidityScore = 0;
  
  // Строге оцінювання pH (ідеал: 6.8-7.5)
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
  
  // Температура (менш строго, оскільки вага мала)
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
  
  // Строге оцінювання TDS (ідеал: <200 мг/л)
  if (tds <= 200) {
    tdsScore = 100;
  } else if (tds > 200 && tds <= 300) {
    tdsScore = 90 - ((tds - 200) / 100) * 15;
  } else if (tds > 300 && tds <= 500) {
    tdsScore = 75 - ((tds - 300) / 200) * 25;
  } else if (tds > 500 && tds <= 800) {
    tdsScore = 50 - ((tds - 500) / 300) * 30;
  } else if (tds > 800 && tds <= 1200) {
    tdsScore = 20 - ((tds - 800) / 400) * 20;
  } else {
    tdsScore = 0;
  }
  
  // Дуже строге оцінювання каламутності (ідеал: <0.5 NTU)
  if (turbidity <= 0.5) {
    turbidityScore = 100;
  } else if (turbidity > 0.5 && turbidity <= 1) {
    turbidityScore = 90 - ((turbidity - 0.5) / 0.5) * 15;
  } else if (turbidity > 1 && turbidity <= 2) {
    turbidityScore = 75 - ((turbidity - 1) / 1) * 25;
  } else if (turbidity > 2 && turbidity <= 5) {
    turbidityScore = 50 - ((turbidity - 2) / 3) * 30;
  } else if (turbidity > 5 && turbidity <= 10) {
    turbidityScore = 20 - ((turbidity - 5) / 5) * 20;
  } else {
    turbidityScore = 0;
  }
  
  // Зважене обчислення з новими пріоритетами
  const wqi = 
    weights.turbidity * turbidityScore +  // 40%
    weights.tds * tdsScore +              // 30%
    weights.pH * pHScore +                // 20%
    weights.temperature * tempScore;      // 10%
  
  return Math.max(0, Math.min(100, Math.round(wqi)));
}

// Детальна функція виведення результатів
function testWQI(name, params) {
  console.log(`📊 ${name}`);
  console.log(`Параметри: pH=${params.pH}, T=${params.temperature}°C, TDS=${params.tds} мг/л, Каламутність=${params.turbidity} NTU`);
  
  const wqi = calculateWQI(params);
  
  let status = '';
  let color = '';
  if (wqi >= 80) { status = 'ВІДМІННА'; color = '🟢'; }
  else if (wqi >= 60) { status = 'ХОРОША'; color = '🟡'; }
  else if (wqi >= 40) { status = 'ПРИЙНЯТНА'; color = '🟠'; }
  else if (wqi >= 20) { status = 'ПОГАНА'; color = '🔴'; }
  else { status = 'КРИТИЧНА'; color = '⚫'; }
  
  console.log(`WQI: ${wqi} - ${color} ${status}\n`);
  return wqi;
}

// Тест 1: Ідеальні параметри
testWQI('Тест 1: Ідеальні параметри', {
  pH: 7.0,
  temperature: 20,
  tds: 150,
  turbidity: 0.3
});

// Тест 2: Проблемні параметри зі скріншота
testWQI('Тест 2: Проблемні параметри зі скріншота', {
  pH: 9.2,           // Дуже лужна
  temperature: 26,    // Тепла
  tds: 650,          // Високий TDS
  turbidity: 1.5     // Каламутна
});

// Тест 3: Проблеми з каламутністю (найвища вага)
testWQI('Тест 3: Високa каламутність (40% ваги)', {
  pH: 7.0,
  temperature: 20,
  tds: 200,
  turbidity: 5.0     // Дуже каламутна
});

// Тест 4: Проблеми з TDS (30% ваги)
testWQI('Тест 4: Високий TDS (30% ваги)', {
  pH: 7.0,
  temperature: 20,
  tds: 900,          // Дуже високий
  turbidity: 0.5
});

// Тест 5: Тільки pH проблема (20% ваги)
testWQI('Тест 5: Тільки pH проблема (20% ваги)', {
  pH: 9.5,           // Дуже лужна
  temperature: 20,
  tds: 200,
  turbidity: 0.5
});

// Тест 6: Тільки температура проблема (10% ваги)
testWQI('Тест 6: Тільки температура проблема (10% ваги)', {
  pH: 7.0,
  temperature: 45,   // Дуже гаряча
  tds: 200,
  turbidity: 0.5
});

console.log('✅ РЕЗУЛЬТАТ: Нова система більш чутлива до каламутності та TDS!');
console.log('📈 Пріоритети: Каламутність (40%) > TDS (30%) > pH (20%) > Температура (10%)');
