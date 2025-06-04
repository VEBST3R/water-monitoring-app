const fs = require('fs');

// Читаємо flows.json
let flowsContent = fs.readFileSync('./flows.json', 'utf8');

console.log('🔍 Шукаємо функцію generateDeviceData...');

// Знаходимо і замінюємо return block в generateDeviceData
const originalReturn = `return {
            ph: Math.max(0, Math.min(14, baseline.ph + phVariation + noise())),
            temp: Math.max(0, Math.min(40, baseline.temp + tempVariation + noise() * 2)),
            tds: Math.max(0, Math.min(2000, baseline.tds + tdsVariation + noise() * 10)),
            turbidity: Math.max(0, Math.min(50, baseline.turbidity + turbidityVariation + noise()))
        };`;

const newReturn = `// Розраховуємо значення з правильним округленням
        const ph = Math.max(0, Math.min(14, baseline.ph + phVariation + noise()));
        const temp = Math.max(0, Math.min(40, baseline.temp + tempVariation + noise() * 2));
        const tds = Math.max(0, Math.min(2000, baseline.tds + tdsVariation + noise() * 10));
        const turbidity = Math.max(0, Math.min(50, baseline.turbidity + turbidityVariation + noise()));
        
        return {
            ph: Math.round(ph * 100) / 100,              // 2 знаки після коми
            temp: Math.round(temp * 10) / 10,            // 1 знак після коми  
            tds: Math.round(tds),                        // цілі числа
            turbidity: Math.round(turbidity * 10) / 10   // 1 знак після коми
        };`;

if (flowsContent.includes('baseline.ph + phVariation + noise()')) {
    flowsContent = flowsContent.replace(originalReturn, newReturn);
    
    // Записуємо назад
    fs.writeFileSync('./flows.json', flowsContent);
    console.log('✅ flows.json оновлено з правильним округленням значень');
} else {
    console.log('❌ Не знайдено функцію для оновлення');
    console.log('🔍 Спробуємо знайти існуючу функцію...');
    
    // Спробуємо знайти будь-яку частину функції
    if (flowsContent.includes('generateDeviceData')) {
        console.log('✅ Знайдено generateDeviceData функцію');
    } else {
        console.log('❌ generateDeviceData функцію не знайдено');
    }
}
