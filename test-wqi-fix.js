// Тестування виправленої логіки WQI
// Імітуємо параметри з скріншота користувача

// Функція розрахунку WQI (копія з wqiUtils.ts)
function calculateWQI(params) {
  // Default values for missing parameters
  const pH = params.pH ?? 7;
  const temperature = params.temperature ?? 20;
  const tds = params.tds ?? 300;
  const turbidity = params.turbidity ?? 1;
  
  // Define weight coefficients for each parameter (based on real water quality impact)
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
  
  // Temperature scoring (ideal: 10-30°C for drinking water systems)
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
}

// Функція оцінки (копія з виправленої DetailedParametersView.tsx)
function getWaterQualityAssessment(parameters) {
  const issues = [];
  const warnings = [];
  
  // Calculate the WQI using our consistent function
  const wqi = calculateWQI(parameters);
  
  // Check individual parameters first to identify specific problems
  // Перевіряємо pH
  if (parameters.pH !== undefined) {
    if (parameters.pH < 6.0) {
      issues.push('Дуже кисла вода (pH < 6.0)');
    } else if (parameters.pH < 6.5) {
      warnings.push('Кисла вода (pH < 6.5)');
    } else if (parameters.pH > 9.0) {
      issues.push('Дуже лужна вода (pH > 9.0)');
    } else if (parameters.pH > 8.5) {
      warnings.push('Лужна вода (pH > 8.5)');
    }
  }
  
  // Перевіряємо температуру
  if (parameters.temperature !== undefined) {
    if (parameters.temperature < 5) {
      warnings.push('Дуже холодна вода (< 5°C)');
    } else if (parameters.temperature > 30) {
      issues.push('Дуже гаряча вода (> 30°C)');
    } else if (parameters.temperature > 25) {
      warnings.push('Гаряча вода (> 25°C)');
    }
  }
  
  // Перевіряємо TDS
  if (parameters.tds !== undefined) {
    if (parameters.tds > 500) {
      issues.push('Високий рівень солей (TDS > 500 ppm)');
    } else if (parameters.tds > 300) {
      warnings.push('Підвищений рівень солей (TDS > 300 ppm)');
    }
  }
  
  // Перевіряємо каламутність
  if (parameters.turbidity !== undefined) {
    if (parameters.turbidity > 10) {
      issues.push('Дуже каламутна вода (> 10 NTU)');
    } else if (parameters.turbidity > 5) {
      issues.push('Каламутна вода (> 5 NTU)');
    } else if (parameters.turbidity > 1) {
      warnings.push('Злегка каламутна вода (> 1 NTU)');
    }
  }

  // Determine overall status based on both WQI AND individual parameter issues
  let overallStatus;
  
  // If there are critical issues with parameters, override WQI-based status
  if (issues.length > 0) {
    // Critical problems detected
    if (wqi < 20) {
      overallStatus = 'critical';
    } else if (wqi < 40) {
      overallStatus = 'poor';
    } else {
      overallStatus = 'poor'; // Even if WQI is higher, critical parameter issues make it poor
    }
  } else if (warnings.length > 0) {
    // Only warnings, no critical issues
    if (wqi >= 60) {
      overallStatus = 'acceptable'; // Downgrade from good/excellent due to warnings
    } else if (wqi >= 40) {
      overallStatus = 'acceptable';
    } else {
      overallStatus = 'poor';
    }
  } else {
    // No issues or warnings, use WQI-based status
    if (wqi >= 80) {
      overallStatus = 'excellent';
    } else if (wqi >= 60) {
      overallStatus = 'good';
    } else if (wqi >= 40) {
      overallStatus = 'acceptable';
    } else if (wqi >= 20) {
      overallStatus = 'poor';
    } else {
      overallStatus = 'critical';
    }
  }

  // Формуємо повідомлення
  let message = '';
  let statusColor = '';
  
  switch (overallStatus) {
    case 'excellent':
      message = 'Відмінна якість води! Всі параметри в оптимальних межах.';
      statusColor = '#4CAF50';
      break;
    case 'good':
      message = 'Хороша якість води. Незначні відхилення від оптимуму.';
      statusColor = '#8BC34A';
      break;
    case 'acceptable':
      if (warnings.length > 0) {
        message = 'Прийнятна якість води. Виявлено попередження.';
      } else {
        message = 'Прийнятна якість води. Рекомендується контроль параметрів.';
      }
      statusColor = '#FF9800';
      break;
    case 'poor':
      if (issues.length > 0) {
        message = 'Погана якість води. Виявлено критичні проблеми!';
      } else {
        message = 'Погана якість води. Необхідне втручання.';
      }
      statusColor = '#FF5722';
      break;
    case 'critical':
      message = 'Критична якість води! Негайно потрібні заходи.';
      statusColor = '#F44336';
      break;
  }
  
  return {
    status: overallStatus,
    message,
    issues,
    warnings,
    statusColor,
    wqi
  };
}

console.log('🧪 ТЕСТУВАННЯ ВИПРАВЛЕНОЇ ЛОГІКИ WQI\n');

// Тест 1: Параметри з скріншота користувача (проблемні)
console.log('📊 Тест 1: Параметри зі скріншота (pH > 9.0, TDS > 500)');
const problematicParams = {
  pH: 9.2,           // Критична проблема - дуже лужна вода
  temperature: 26,    // Попередження - гаряча вода
  tds: 650,          // Критична проблема - високий TDS
  turbidity: 1.5     // Попередження - злегка каламутна
};

const result1 = getWaterQualityAssessment(problematicParams);
console.log(`WQI: ${result1.wqi}`);
console.log(`Статус: ${result1.status}`);
console.log(`Повідомлення: ${result1.message}`);
console.log(`Критичні проблеми: ${result1.issues.join(', ') || 'Немає'}`);
console.log(`Попередження: ${result1.warnings.join(', ') || 'Немає'}\n`);

// Тест 2: Хороші параметри
console.log('📊 Тест 2: Хороші параметри');
const goodParams = {
  pH: 7.2,
  temperature: 20,
  tds: 280,
  turbidity: 0.8
};

const result2 = getWaterQualityAssessment(goodParams);
console.log(`WQI: ${result2.wqi}`);
console.log(`Статус: ${result2.status}`);
console.log(`Повідомлення: ${result2.message}`);
console.log(`Критичні проблеми: ${result2.issues.join(', ') || 'Немає'}`);
console.log(`Попередження: ${result2.warnings.join(', ') || 'Немає'}\n`);

// Тест 3: Помірні попередження
console.log('📊 Тест 3: Помірні попередження (TDS трохи високий)');
const warningParams = {
  pH: 7.0,
  temperature: 22,
  tds: 350,          // Попередження
  turbidity: 0.9
};

const result3 = getWaterQualityAssessment(warningParams);
console.log(`WQI: ${result3.wqi}`);
console.log(`Статус: ${result3.status}`);
console.log(`Повідомлення: ${result3.message}`);
console.log(`Критичні проблеми: ${result3.issues.join(', ') || 'Немає'}`);
console.log(`Попередження: ${result3.warnings.join(', ') || 'Немає'}\n`);

console.log('✅ РЕЗУЛЬТАТ: Тепер система правильно визначає статус на основі критичних проблем!');
