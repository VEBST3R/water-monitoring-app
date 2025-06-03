const express = require('express');
const RED = require('node-red');
const http = require('http');
const path = require('path');

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

// Зберігання історичних даних
const historicalData = new Map();

// Допоміжна функція для створення початкових історичних даних
function generateInitialHistory(deviceId, currentParams) {
    const history = [];
    const now = Date.now();
    const hoursBack = 24; // 24 години історії
    
    for (let i = hoursBack; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000); // Кожна година
          // Генеруємо реалістичні дані на основі поточних параметрів
        const variation = 0.15; // Збільшуємо варіацію до 15%
        const data = {
            timestamp,
            pH: Number((currentParams.pH + (Math.random() - 0.5) * currentParams.pH * variation).toFixed(2)),
            temperature: Number((currentParams.temperature + (Math.random() - 0.5) * currentParams.temperature * variation).toFixed(1)),
            tds: Math.floor(currentParams.tds + (Math.random() - 0.5) * currentParams.tds * variation),
            turbidity: Number((currentParams.turbidity + (Math.random() - 0.5) * Math.max(currentParams.turbidity * variation, 0.3)).toFixed(1))
        };
          // Переконуємося що значення в розумних межах
        data.pH = Math.max(0, Math.min(14, data.pH));
        data.temperature = Math.max(0, Math.min(40, data.temperature));
        data.tds = Math.max(0, Math.min(2000, data.tds));
        data.turbidity = Math.max(0.1, Math.min(50, data.turbidity)); // Мінімум 0.1 для каламутності
        
        history.push(data);
    }
    
    return history;
}

// Функція для додавання нової точки в історію
function addHistoryPoint(deviceId, params) {
    if (!historicalData.has(deviceId)) {
        historicalData.set(deviceId, generateInitialHistory(deviceId, params));
    }
    
    const history = historicalData.get(deviceId);
    const newPoint = {
        timestamp: Date.now(),
        pH: params.pH,
        temperature: params.temperature,
        tds: params.tds,
        turbidity: params.turbidity
    };
    
    history.push(newPoint);
    
    // Зберігаємо тільки останні 100 точок (приблизно 4 дні при оновленні кожну годину)
    if (history.length > 100) {
        history.shift();
    }
    
    historicalData.set(deviceId, history);
}

// Middleware для обробки JSON
app.use(express.json());

// Новий endpoint для отримання історичних даних
app.get(settings.httpNodeRoot + '/getParameterHistory', (req, res) => {
    const deviceId = req.query.device;
    const parameter = req.query.parameter; // pH, temperature, tds, turbidity
    const hoursBack = parseInt(req.query.hours) || 24; // За замовчуванням 24 години
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (!deviceId) {
        return res.status(400).json({
            error: 'Device ID is required',
            message: 'Вкажіть параметр device'
        });
    }
      // Якщо історії ще немає, створюємо базову
    if (!historicalData.has(deviceId)) {
        // Використовуємо дефолтні параметри для генерації історії
        let currentParams = { pH: 7.2, temperature: 20, tds: 300, turbidity: 1.5 };
        
        // Спробуємо отримати реальні дані з контексту Node-RED, якщо доступні
        try {
            // Перевіряємо, чи Node-RED готовий
            if (RED && RED.settings && RED.settings.get) {
                const globalContext = RED.settings.get('context');
                if (globalContext && globalContext.default) {
                    const context = globalContext.default;
                    const devices = context.get('sim_devices');
                    if (devices && devices[deviceId]) {
                        currentParams = devices[deviceId].current;
                    }
                }
            }
        } catch (e) {
            console.log('Використовуємо дефолтні параметри для генерації історії');
        }
        
        historicalData.set(deviceId, generateInitialHistory(deviceId, currentParams));
    }
    
    const history = historicalData.get(deviceId);
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    // Фільтруємо дані за часом
    let filteredHistory = history.filter(point => point.timestamp >= cutoffTime);
    
    // Якщо запитано конкретний параметр, повертаємо тільки його
    if (parameter && ['pH', 'temperature', 'tds', 'turbidity'].includes(parameter)) {
        filteredHistory = filteredHistory.map(point => ({
            timestamp: point.timestamp,
            value: point[parameter]
        }));
        
        return res.json({
            deviceId,
            parameter,
            hoursBack,
            data: filteredHistory,
            count: filteredHistory.length
        });
    }
    
    // Повертаємо всі параметри
    res.json({
        deviceId,
        hoursBack,
        data: filteredHistory,
        count: filteredHistory.length
    });
});

// Новий endpoint для оновлення історичних даних при отриманні нових параметрів
app.post(settings.httpNodeRoot + '/updateParameterHistory', (req, res) => {
    const { deviceId, parameters } = req.body;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (!deviceId || !parameters) {
        return res.status(400).json({
            error: 'Missing required data',
            message: 'Потрібні deviceId та parameters'
        });
    }
    
    try {
        addHistoryPoint(deviceId, parameters);
        res.json({
            success: true,
            message: 'Історичні дані оновлено',
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error updating history:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Помилка оновлення історичних даних'
        });
    }
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
    console.log(`   • GET  ${settings.httpNodeRoot}/getParameterHistory?device=111001&parameter=pH&hours=24`);
    console.log(`   • POST ${settings.httpNodeRoot}/updateParameterHistory`);
    console.log('');
    console.log('💡 Для зупинки сервера натисніть Ctrl+C');
    
    // Запуск Node-RED runtime
    RED.start().then(() => {
        console.log('✅ Node-RED flows завантажені та запущені');
    }).catch(err => {
        console.error('❌ Помилка запуску Node-RED:', err);
    });
});
