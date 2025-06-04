const fs = require('fs');
const path = require('path');

// Read the flows.json file
const flowsPath = path.join(__dirname, 'flows.json');
const flowsContent = fs.readFileSync(flowsPath, 'utf8');

// Parse the JSON
const flows = JSON.parse(flowsContent);

// Find the initialization function and update it
const initFunction = flows.find(node => node.id === 'func-initialize-devices');

if (initFunction) {
    // Replace the Enhanced simulation loading section
    const newFuncCode = initFunction.func.replace(
        /\/\/ Завантаження Enhanced simulation модуля[\s\S]*?} catch \(error\) \{\s*node\.error\('❌ Помилка завантаження Enhanced simulation: ' \+ error\.message\);\s*\}/,
        `// Завантаження Enhanced simulation модуля
try {
    // Використовуємо новий loader
    const loaderFunction = global.get('loadEnhancedSimulation');
    
    if (loaderFunction) {
        const loader = loaderFunction();
        if (loader) {
            const EnhancedWaterSimulation = loader();
            
            if (EnhancedWaterSimulation) {
                const enhancedSim = new EnhancedWaterSimulation(
                    initialDeviceConfigs,
                    calculateParameterScores,
                    formatOperatingTime
                );
                
                flow.set('enhancedSimulation', enhancedSim);
                node.log('✅ Enhanced simulation завантажена успішно через loader');
            } else {
                node.warn('❌ Не вдалося завантажити Enhanced simulation клас');
            }
        } else {
            node.warn('❌ Enhanced simulation loader не ініціалізовано');
        }
    } else {
        node.warn('❌ Enhanced simulation loader функція недоступна');
    }
} catch (error) {
    node.error('❌ Помилка завантаження Enhanced simulation: ' + error.message);
    node.error('Stack trace: ' + error.stack);
}`
    );
    
    initFunction.func = newFuncCode;
    
    // Write the updated flows back to file
    fs.writeFileSync(flowsPath, JSON.stringify(flows, null, 2));
    
    console.log('✅ flows.json оновлено успішно');
} else {
    console.error('❌ Не знайдено функцію ініціалізації');
}
