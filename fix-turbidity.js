// Обновление базовых значений устройств для более реалистичной мутности
// Этот скрипт исправляет проблему с высокими начальными значениями мутности
// Запускается автоматически при старте сервера

const fs = require('fs');
const path = require('path');

const flowsPath = path.join(__dirname, '.node-red', 'flows.json');

console.log('🔧 Проверка конфигурации мутности...');

try {
    // Проверяем существование файла
    if (!fs.existsSync(flowsPath)) {
        console.log('ℹ️  flows.json не найден, пропускаем обновление');
        process.exit(0);
    }
    
    // Читаем существующий flows.json
    const flowsContent = fs.readFileSync(flowsPath, 'utf8');
    const flows = JSON.parse(flowsContent);
    
    // Находим нужный flow с конфигурацией устройств
    const targetFlow = flows.find(node => 
        node.type === 'function' && 
        node.name === 'Setup Enhanced Device States & Configs'
    );
    
    if (!targetFlow) {
        console.log('ℹ️  Узел конфигурации устройств не найден, пропускаем обновление');
        process.exit(0);
    }
    
    // Проверяем, нужно ли обновление
    let funcCode = targetFlow.func;
    let needsUpdate = false;
    
    // Заменяем значения turbidity на более реалистичные
    if (funcCode.includes('turbidity: 1.5') || funcCode.includes('turbidity: 3.0') || funcCode.includes('turbidity: 7.0')) {
        needsUpdate = true;
        
        funcCode = funcCode.replace(
            /baseline: { ph: 7\.2, temp: 20, tds: 300, turbidity: 1\.5 }/g,
            'baseline: { ph: 7.2, temp: 20, tds: 300, turbidity: 0.8 }'
        );
        
        funcCode = funcCode.replace(
            /current: { ph: 7\.2, temp: 20, tds: 300, turbidity: 1\.5, wqi: 0/g,
            'current: { ph: 7.2, temp: 20, tds: 300, turbidity: 0.8, wqi: 0'
        );
        
        funcCode = funcCode.replace(
            /baseline: { ph: 6\.8, temp: 23, tds: 450, turbidity: 3\.0 }/g,
            'baseline: { ph: 6.8, temp: 23, tds: 450, turbidity: 1.2 }'
        );
        
        funcCode = funcCode.replace(
            /current: { ph: 6\.8, temp: 23, tds: 450, turbidity: 3\.0, wqi: 0/g,
            'current: { ph: 6.8, temp: 23, tds: 450, turbidity: 1.2, wqi: 0'
        );
        
        funcCode = funcCode.replace(
            /baseline: { ph: 5\.5, temp: 28, tds: 600, turbidity: 7\.0 }/g,
            'baseline: { ph: 5.5, temp: 28, tds: 600, turbidity: 2.5 }'
        );
        
        funcCode = funcCode.replace(
            /current: { ph: 5\.5, temp: 28, tds: 600, turbidity: 7\.0, wqi: 0/g,
            'current: { ph: 5.5, temp: 28, tds: 600, turbidity: 2.5, wqi: 0'
        );
        
        // Также обновляем диапазон в SmartEnhancedSimulation для более низких значений мутности
        funcCode = funcCode.replace(
            /turbidity: this\.randomInRange\(0\.1, 25\)/g,
            'turbidity: this.randomInRange(0.1, 5.0)'
        );
    }
    
    if (needsUpdate) {
        // Обновляем функцию
        targetFlow.func = funcCode;
        
        // Сохраняем обновленный flows.json
        fs.writeFileSync(flowsPath, JSON.stringify(flows, null, 2));
        
        console.log('✅ Базовые значения мутности обновлены:');
        console.log('  - Устройство 111001: turbidity 1.5 → 0.8');
        console.log('  - Устройство 222002: turbidity 3.0 → 1.2');
        console.log('  - Устройство 333003: turbidity 7.0 → 2.5');
        console.log('  - Диапазон генерации: 0.1-25 → 0.1-5.0');
    } else {
        console.log('✅ Конфигурация мутности уже актуальна');
    }
    
} catch (error) {
    console.warn('⚠️  Предупреждение при обновлении flows.json:', error.message);
    console.log('ℹ️  Продолжаем запуск...');
}
