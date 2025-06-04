const fs = require('fs');

// Read flows.json
const flows = JSON.parse(fs.readFileSync('./flows.json', 'utf8'));

// Find the initialization function node
const initNode = flows.find(node => node.id === 'func-initialize-devices');

if (initNode) {
    // Create new function code with inline Enhanced simulation
    initNode.func = `// Розширена ініціалізація пристроїв з технічними параметрами
const simulationStartTime = Date.now();
flow.set('simulation_start_time', simulationStartTime);

// Функція розрахунку WQI
function calculateParameterScores(params) {
    let partial = {};
    let totalWQI = 0;
    
    // pH Score
    if (params.ph >= 7.0 && params.ph <= 7.6) partial.ph = 25;
    else if (params.ph >= 6.5 && params.ph <= 8.5) partial.ph = 18;
    else if (params.ph >= 6.0 && params.ph <= 9.0) partial.ph = 10;
    else partial.ph = 5;
    totalWQI += partial.ph;
    
    // Temperature Score
    if (params.temp >= 18 && params.temp <= 22) partial.temp = 25;
    else if (params.temp >= 15 && params.temp <= 25) partial.temp = 18;
    else if (params.temp >= 10 && params.temp <= 30) partial.temp = 10;
    else partial.temp = 5;
    totalWQI += partial.temp;
    
    // TDS Score
    if (params.tds <= 300) partial.tds = 25;
    else if (params.tds <= 500) partial.tds = 18;
    else if (params.tds <= 800) partial.tds = 10;
    else partial.tds = 5;
    totalWQI += partial.tds;
    
    // Turbidity Score
    if (params.turbidity <= 1) partial.turbidity = 25;
    else if (params.turbidity <= 5) partial.turbidity = 18;
    else if (params.turbidity <= 10) partial.turbidity = 10;
    else partial.turbidity = 5;
    totalWQI += partial.turbidity;
    
    return { totalWQI: Math.max(0, Math.min(100, totalWQI)), partial: partial };
}

// Функція форматування часу роботи
function formatOperatingTime(startTime) {
    const now = Date.now();
    const diffMs = now - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return \`\${hours} год \${minutes} хв\`;
}

// Початкова конфігурація пристроїв для розширеної симуляції
const initialDeviceConfigs = {
    "111001": {
        id: '111001',
        name: 'Головний датчик',
        customName: 'Головний датчик',
        serverConfig: {
            deviceId: '111001',
            serverName: 'Локальний сервер (Node-RED)'
        },
        isOnline: true,
        location: 'Лабораторія',
        baseline: { ph: 7.2, temp: 20, tds: 300, turbidity: 1.5 },
        current: { ph: 7.2, temp: 20, tds: 300, turbidity: 1.5, wqi: 0, lastUpdate: Date.now() },
        technical: {
            powerSource: "Від мережі",
            powerType: "mains",
            batteryLevel: 100,
            startTime: simulationStartTime,
            lastCalibration: new Date('2025-05-15T10:30:00Z').getTime(),
            calibrationInterval: 30 * 24 * 60 * 60 * 1000,
            sensorStatus: "Всі датчики онлайн",
            connectionStatus: "Стабільне",
            signalStrength: -35,
            firmwareVersion: "v2.1.3",
            hardwareVersion: "v1.4",
            sensorHealth: {
                ph: "online",
                temperature: "online",
                tds: "online",
                turbidity: "online"
            },
            alerts: []
        }
    },
    "222002": {
        id: '222002',
        name: 'Резервний модуль',
        customName: 'Резервний модуль',
        serverConfig: {
            deviceId: '222002',
            serverName: 'Локальний сервер (Node-RED)'
        },
        isOnline: true,
        location: 'Резерв',
        baseline: { ph: 6.8, temp: 23, tds: 450, turbidity: 3.0 },
        current: { ph: 6.8, temp: 23, tds: 450, turbidity: 3.0, wqi: 0, lastUpdate: Date.now() },
        technical: {
            powerSource: "Від батареї",
            powerType: "battery",
            batteryLevel: 78,
            startTime: simulationStartTime,
            lastCalibration: new Date('2025-04-20T14:15:00Z').getTime(),
            calibrationInterval: 30 * 24 * 60 * 60 * 1000,
            sensorStatus: "Всі датчики онлайн",
            connectionStatus: "Стабільне",
            signalStrength: -52,
            firmwareVersion: "v2.0.8",
            hardwareVersion: "v1.3",
            sensorHealth: {
                ph: "online",
                temperature: "online",
                tds: "online",
                turbidity: "online"
            },
            alerts: [
                {
                    id: "alert_battery_low",
                    type: "battery_warning",
                    severity: "warning",
                    message: "Рівень батареї нижче 80%",
                    timestamp: Date.now() - 3600000,
                    acknowledged: false
                }
            ]
        }
    },
    "333003": {
        id: '333003',
        name: 'Тестовий стенд',
        customName: 'Тестовий стенд',
        serverConfig: {
            deviceId: '333003',
            serverName: 'Локальний сервер (Node-RED)'
        },
        isOnline: false,
        location: 'Тестова зона',
        baseline: { ph: 5.5, temp: 28, tds: 600, turbidity: 7.0 },
        current: { ph: 5.5, temp: 28, tds: 600, turbidity: 7.0, wqi: 0, lastUpdate: Date.now() },
        technical: {
            powerSource: "Сонячна батарея",
            powerType: "solar",
            batteryLevel: 92,
            startTime: simulationStartTime,
            lastCalibration: new Date('2025-06-01T09:00:00Z').getTime(),
            calibrationInterval: 30 * 24 * 60 * 60 * 1000,
            sensorStatus: "Попередження: датчик pH потребує калібрування",
            connectionStatus: "Нестабільне",
            signalStrength: -67,
            firmwareVersion: "v1.9.2",
            hardwareVersion: "v1.2",
            sensorHealth: {
                ph: "drift_detected",
                temperature: "online",
                tds: "online",
                turbidity: "online"
            },
            alerts: [
                {
                    id: "alert_ph_drift",
                    type: "sensor_drift",
                    severity: "warning",
                    message: "Виявлено дрейф датчика pH",
                    parameter: "pH",
                    timestamp: Date.now() - 1800000,
                    acknowledged: false
                }
            ]
        }
    }
};

// Збереження функцій в контекст flow
flow.set('calculateWQI', calculateParameterScores);
flow.set('formatOperatingTime', formatOperatingTime);

// Inline Enhanced Simulation (спрощена версія)
class SimpleEnhancedSimulation {
    constructor(initialDeviceConfigs, calculateWQI, formatOperatingTime) {
        this.devices = JSON.parse(JSON.stringify(initialDeviceConfigs));
        this.calculateWQI = calculateWQI;
        this.formatOperatingTime = formatOperatingTime;
        this.simulationStartTime = Date.now();
        
        node.log('🌊 Simple Enhanced Simulation ініціалізовано');
    }
    
    generateDeviceData(device, timestamp) {
        const baseline = device.baseline;
        const timeMs = timestamp - this.simulationStartTime;
        const timeMins = timeMs / (1000 * 60);
        
        // Реалістичні флуктуації з синусоїдальними циклами
        const phVariation = Math.sin(timeMins * 0.1) * 0.3;
        const tempVariation = Math.cos(timeMins * 0.08) * 1.2;
        const tdsVariation = Math.sin(timeMins * 0.12) * 50;
        const turbidityVariation = Math.cos(timeMins * 0.15) * 0.8;
        
        // Додаємо шум
        const noise = () => (Math.random() - 0.5) * 0.1;
        
        return {
            ph: Math.max(0, Math.min(14, baseline.ph + phVariation + noise())),
            temp: Math.max(0, Math.min(40, baseline.temp + tempVariation + noise() * 2)),
            tds: Math.max(0, Math.min(2000, baseline.tds + tdsVariation + noise() * 10)),
            turbidity: Math.max(0, Math.min(50, baseline.turbidity + turbidityVariation + noise()))
        };
    }
}

// Створення Enhanced simulation
try {
    const enhancedSim = new SimpleEnhancedSimulation(
        initialDeviceConfigs,
        calculateParameterScores,
        formatOperatingTime
    );
    
    flow.set('enhancedSimulation', enhancedSim);
    node.log('✅ Enhanced simulation (inline) завантажена успішно');
} catch (error) {
    node.error('❌ Помилка створення Enhanced simulation: ' + error.message);
}
    
// Ініціалізація пристроїв з базовими значеннями
const devices = {};
for (const deviceId in initialDeviceConfigs) {
    if (initialDeviceConfigs.hasOwnProperty(deviceId)) {
        const config = initialDeviceConfigs[deviceId];
        devices[deviceId] = {
            ...config,
            lastUpdate: new Date(config.current.lastUpdate).toLocaleString('uk-UA')
        };
        
        // Розрахунок початкового WQI
        const scores = calculateParameterScores(config.current);
        devices[deviceId].current.wqi = scores.totalWQI;
        devices[deviceId].current.partial_scores = scores.partial;
        
        if (config.technical && config.technical.startTime) {
            devices[deviceId].technical.operatingTimeFormatted = formatOperatingTime(config.technical.startTime);
        }
    }
}
    
flow.set('sim_devices', devices);
    
node.status({ 
    fill: "green", 
    shape: "dot", 
    text: \`✅ Симуляція ініціалізована: \${Object.keys(devices).length} пристроїв\` 
});
    
node.log(\`✅ Симуляція успішно ініціалізована з \${Object.keys(devices).length} пристроями\`);

return msg;`;

    // Write the updated flows back
    fs.writeFileSync('./flows.json', JSON.stringify(flows, null, 2));
    console.log('✅ flows.json оновлено з inline Enhanced simulation');
} else {
    console.error('❌ Не знайдено функцію ініціалізації');
}
