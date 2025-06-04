const express = require('express');
const RED = require('node-red');
const http = require('http');
const path = require('path');

// Імпорт fetch для роботи з API (для Node.js версій нижче 18)
let fetch;
try {
    fetch = global.fetch || require('node-fetch');
} catch (e) {
    console.log('Використовуємо глобальний fetch або створюємо заглушку');
    fetch = () => Promise.reject(new Error('Fetch не доступний'));
}

// Створення Express app
const app = express();

// Створення HTTP сервера
const server = http.createServer(app);

// Налаштування для Node-RED
const settings = {
    httpAdminRoot: '/admin',
    httpNodeRoot: '/api',
    userDir: __dirname,
    flowFile: path.join(__dirname, 'flows.json'),
    credentialSecret: 'water-monitoring-secret-key-2025',
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE",
        allowedHeaders: "Content-Type, Authorization"
    },
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },
    editorTheme: {
        projects: {
            enabled: false
        }
    }
};

// Ініціалізація Node-RED
RED.init(server, settings);

// Розширена система зберігання історії для всіх параметрів
const parameterHistory = new Map(); // Карта deviceId -> {parameterType -> array of {timestamp, value}}

// Підтримувані параметри
const SUPPORTED_PARAMETERS = ['wqi', 'ph', 'temperature', 'tds', 'turbidity'];

// Функція для додавання нової точки параметра в історію
function addParameterPoint(deviceId, parameterType, value) {
    if (!SUPPORTED_PARAMETERS.includes(parameterType)) {
        console.warn(`⚠️ Непідтримуваний параметр: ${parameterType}`);
        return;
    }

    if (!parameterHistory.has(deviceId)) {
        parameterHistory.set(deviceId, new Map());
    }
    
    const deviceHistory = parameterHistory.get(deviceId);
    if (!deviceHistory.has(parameterType)) {
        deviceHistory.set(parameterType, []);
    }
    
    const history = deviceHistory.get(parameterType);
    const newPoint = {
        timestamp: Date.now(),
        value: value
    };
    
    history.push(newPoint);
    
    // Зберігаємо тільки останні 48 точок (48 годин історії)
    if (history.length > 48) {
        history.shift();
    }
    
    deviceHistory.set(parameterType, history);
    console.log(`📊 ${parameterType.toUpperCase()} збережено: пристрій ${deviceId}, ${parameterType}=${value}, час=${new Date(newPoint.timestamp).toLocaleString()}`);
}

// Функція для отримання історії конкретного параметра
function getParameterHistory(deviceId, parameterType, hoursBack = 24) {
    if (!parameterHistory.has(deviceId)) {
        return [];
    }
    
    const deviceHistory = parameterHistory.get(deviceId);
    if (!deviceHistory.has(parameterType)) {
        return [];
    }
    
    const history = deviceHistory.get(parameterType);
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    return history.filter(point => point.timestamp >= cutoffTime);
}

// Зворотна сумісність: функції для WQI
function addWQIPoint(deviceId, wqi) {
    addParameterPoint(deviceId, 'wqi', wqi);
}

function getWQIHistory(deviceId, hoursBack = 24) {
    return getParameterHistory(deviceId, 'wqi', hoursBack).map(point => ({
        timestamp: point.timestamp,
        wqi: point.value
    }));
}

// Middleware для обробки JSON
app.use(express.json());

// Функція для розрахунку WQI (копія з flows.json)
function calculateWQI(params) {
    let totalWQI = 0;
    // pH Score
    if (params.pH >= 7.0 && params.pH <= 7.6) totalWQI += 25;
    else if (params.pH >= 6.5 && params.pH <= 8.5) totalWQI += 18;
    else if (params.pH >= 6.0 && params.pH <= 9.0) totalWQI += 10;
    else totalWQI += 5;
    // Temperature Score
    if (params.temperature >= 18 && params.temperature <= 22) totalWQI += 25;
    else if (params.temperature >= 15 && params.temperature <= 25) totalWQI += 18;
    else if (params.temperature >= 10 && params.temperature <= 30) totalWQI += 10;
    else totalWQI += 5;
    // TDS Score
    if (params.tds <= 300) totalWQI += 25;
    else if (params.tds <= 500) totalWQI += 18;
    else if (params.tds <= 800) totalWQI += 10;
    else totalWQI += 5;
    // Turbidity Score
    if (params.turbidity <= 1) totalWQI += 25;
    else if (params.turbidity <= 5) totalWQI += 18;
    else if (params.turbidity <= 10) totalWQI += 10;
    else totalWQI += 5;
    return Math.max(0, Math.min(100, totalWQI));
}

// Розширений endpoint для отримання історичних даних всіх параметрів
app.get(settings.httpNodeRoot + '/getParameterHistory', (req, res) => {
    const deviceId = req.query.device;
    const parameter = req.query.parameter; // pH, temperature, tds, turbidity, wqi
    const hoursBack = parseInt(req.query.hours) || 24;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (!deviceId) {
        return res.status(400).json({
            error: 'Device ID is required',
            message: 'Вкажіть параметр device'
        });
    }

    if (!parameter) {
        return res.status(400).json({
            error: 'Parameter is required',
            message: 'Вкажіть параметр parameter',
            supportedParameters: SUPPORTED_PARAMETERS
        });
    }

    const parameterLower = parameter.toLowerCase();
    
    if (!SUPPORTED_PARAMETERS.includes(parameterLower)) {
        return res.status(400).json({
            error: 'Parameter not supported',
            message: `Параметр '${parameter}' не підтримується`,
            supportedParameters: SUPPORTED_PARAMETERS
        });
    }

    // Отримуємо історію для будь-якого підтримуваного параметра
    const history = getParameterHistory(deviceId, parameterLower, hoursBack);
    
    // Форматуємо дані для сумісності з фронтендом
    const formattedHistory = history.map(point => ({
        timestamp: point.timestamp,
        value: point.value
    }));
    
    return res.json({
        deviceId,
        parameter: parameterLower,
        hoursBack,
        data: formattedHistory,
        count: formattedHistory.length,
        source: formattedHistory.length > 0 ? `${parameterLower}_history` : 'no_data'
    });
});

// Розширений endpoint для оновлення історичних даних всіх параметрів
app.post(settings.httpNodeRoot + '/updateParameterHistory', (req, res) => {
    const { deviceId, wqi, pH, temperature, tds, turbidity } = req.body;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (!deviceId) {
        return res.status(400).json({
            error: 'Missing required data',
            message: 'Потрібний deviceId'
        });
    }

    const updates = [];
    const errors = [];
    
    try {
        // Обробляємо кожен параметр окремо
        if (wqi !== undefined) {
            addParameterPoint(deviceId, 'wqi', wqi);
            updates.push(`WQI: ${wqi}`);
        }        if (pH !== undefined) {
            addParameterPoint(deviceId, 'ph', pH);
            updates.push(`pH: ${pH}`);
        }
        if (temperature !== undefined) {
            addParameterPoint(deviceId, 'temperature', temperature);
            updates.push(`Temperature: ${temperature}°C`);
        }
        if (tds !== undefined) {
            addParameterPoint(deviceId, 'tds', tds);
            updates.push(`TDS: ${tds} ppm`);
        }
        if (turbidity !== undefined) {
            addParameterPoint(deviceId, 'turbidity', turbidity);
            updates.push(`Turbidity: ${turbidity} NTU`);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No valid parameters provided',
                message: 'Не надано жодного валідного параметра',
                supportedParameters: SUPPORTED_PARAMETERS
            });
        }
        
        res.json({
            success: true,
            message: `Параметри збережено для пристрою ${deviceId}: ${updates.join(', ')}`,
            timestamp: Date.now(),
            updatedParameters: updates.length
        });
    } catch (error) {
        console.error('Error updating parameter history:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Помилка оновлення історії параметрів'
        });    }
});

// Новий endpoint для отримання списку підтримуваних параметрів
app.get(settings.httpNodeRoot + '/getSupportedParameters', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
        supportedParameters: SUPPORTED_PARAMETERS,        parameterInfo: {
            'wqi': { name: 'Water Quality Index', unit: '', description: 'Індекс якості води' },
            'ph': { name: 'pH Level', unit: '', description: 'Рівень кислотності' },
            'temperature': { name: 'Temperature', unit: '°C', description: 'Температура води' },
            'tds': { name: 'Total Dissolved Solids', unit: 'ppm', description: 'Загальні розчинені речовини' },
            'turbidity': { name: 'Turbidity', unit: 'NTU', description: 'Каламутність води' }
        },
        totalParameters: SUPPORTED_PARAMETERS.length
    });
});

// Підключення маршрутів
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

// Запуск сервера
const PORT = 1880;
server.listen(PORT, function() {
    console.log('🌊 Water Monitoring Node-RED Server запущений!');
    console.log(`📊 Admin панель: http://localhost:${PORT}${settings.httpAdminRoot}`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}${settings.httpNodeRoot}`);    console.log('📱 Доступні API:');
    console.log(`   • GET  ${settings.httpNodeRoot}/getWQI?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/getDeviceStatus?device=111001`);
    console.log(`   • POST ${settings.httpNodeRoot}/calibrateSensors?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/listAvailableSensors`);
    console.log(`   • GET  ${settings.httpNodeRoot}/getParameterHistory?device=111001&parameter={wqi|ph|temperature|tds|turbidity}&hours=24`);
    console.log(`   • POST ${settings.httpNodeRoot}/updateParameterHistory (body: {deviceId, wqi?, pH?, temperature?, tds?, turbidity?})`);
    console.log(`   • GET  ${settings.httpNodeRoot}/getSupportedParameters`);
    console.log('');
    console.log('💡 Для зупинки сервера натисніть Ctrl+C');
    console.log('📊 Історія параметрів контролюється через Node-RED flow');
    
    // Запуск Node-RED runtime
    RED.start().then(() => {
        console.log('✅ Node-RED flows завантажені та запущені');
        console.log('🔄 Автоматичне збереження історії відключено - використовуйте Node-RED inject для контролю');
    }).catch(err => {
        console.error('❌ Помилка запуску Node-RED:', err);
    });
});
