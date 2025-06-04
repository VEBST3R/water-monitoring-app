const fs = require('fs');

console.log('📝 Оновлюємо flows.json з інлайн Enhanced simulation...');

// Read the current flows.json
const flowsPath = './flows.json';
const flows = JSON.parse(fs.readFileSync(flowsPath, 'utf8'));

// Find the initialization function
const initNode = flows.find(node => node.id === 'func-initialize-devices');

if (!initNode) {
    console.error('❌ Не знайдено функцію ініціалізації');
    process.exit(1);
}

// Replace the Enhanced simulation loading section with an inline version
const newFunc = initNode.func.replace(
    /\/\/ Завантаження Enhanced simulation модуля[\s\S]*?} catch \(error\) \{\s*node\.error\('❌ Помилка завантаження Enhanced simulation: ' \+ error\.message\);\s*\}/,
    `// Інлайн Enhanced simulation
try {
    // Embedded Enhanced Water Simulation class
    class EnhancedWaterSimulation {
        constructor(initialDeviceConfigs, calculateWQI, formatOperatingTime) {
            this.devices = JSON.parse(JSON.stringify(initialDeviceConfigs));
            this.calculateWQI = calculateWQI;
            this.formatOperatingTime = formatOperatingTime;
            this.simulationStartTime = Date.now();
            
            this.variationAmplitudes = {
                ph: { normal: 0.3, event: 1.5 },
                temp: { normal: 1.2, event: 4.0 },
                tds: { normal: 50, event: 200 },
                turbidity: { normal: 0.8, event: 3.0 }
            };
            
            this.activeEvents = {};
            
            for (const deviceId in this.devices) {
                this.activeEvents[deviceId] = [];
                this.devices[deviceId].activeEvents = [];
            }
            
            node.log('🌊 Enhanced Water Simulation (inline) ініціалізовано');
        }
        
        generateDeviceData(device, timestamp) {
            const baseline = device.baseline;
            const current = device.current;
            const deviceId = device.id;
            
            // Simple but effective simulation
            const timeMs = timestamp - this.simulationStartTime;
            const timeMins = timeMs / (1000 * 60);
            
            // Create realistic fluctuations
            const phVariation = Math.sin(timeMins * 0.1) * this.variationAmplitudes.ph.normal;
            const tempVariation = Math.cos(timeMins * 0.08) * this.variationAmplitudes.temp.normal;
            const tdsVariation = Math.sin(timeMins * 0.12) * this.variationAmplitudes.tds.normal;
            const turbidityVariation = Math.cos(timeMins * 0.15) * this.variationAmplitudes.turbidity.normal;
            
            // Add random noise
            const noise = () => (Math.random() - 0.5) * 0.1;
            
            return {
                ph: Math.max(0, Math.min(14, baseline.ph + phVariation + noise())),
                temp: Math.max(0, Math.min(40, baseline.temp + tempVariation + noise() * 2)),
                tds: Math.max(0, Math.min(2000, baseline.tds + tdsVariation + noise() * 10)),
                turbidity: Math.max(0, Math.min(50, baseline.turbidity + turbidityVariation + noise()))
            };
        }
    }
    
    // Create Enhanced simulation instance
    const enhancedSim = new EnhancedWaterSimulation(
        initialDeviceConfigs,
        calculateParameterScores,
        formatOperatingTime
    );
    
    flow.set('enhancedSimulation', enhancedSim);
    node.log('✅ Enhanced simulation (inline) завантажена успішно');
    
} catch (error) {
    node.error('❌ Помилка створення Enhanced simulation: ' + error.message);
}`
);

// Update the function
initNode.func = newFunc;

// Write back to file
fs.writeFileSync(flowsPath, JSON.stringify(flows, null, 2));

console.log('✅ flows.json оновлено з інлайн Enhanced simulation');
console.log('🔄 Тепер можна перезапустити Node-RED сервер');
