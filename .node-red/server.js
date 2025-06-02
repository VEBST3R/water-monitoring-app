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

// Підключення маршрутів
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

// Запуск сервера
const PORT = 1880;
server.listen(PORT, function() {
    console.log('🌊 Water Monitoring Node-RED Server запущений!');
    console.log(`📊 Admin панель: http://localhost:${PORT}${settings.httpAdminRoot}`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}${settings.httpNodeRoot}`);
    console.log('📱 Доступні API:');
    console.log(`   • GET  ${settings.httpNodeRoot}/getWQI?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/getDeviceStatus?device=111001`);
    console.log(`   • POST ${settings.httpNodeRoot}/calibrateSensors?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/listAvailableSensors`);
    console.log('');
    console.log('💡 Для зупинки сервера натисніть Ctrl+C');
    
    // Запуск Node-RED runtime
    RED.start().then(() => {
        console.log('✅ Node-RED flows завантажені та запущені');
    }).catch(err => {
        console.error('❌ Помилка запуску Node-RED:', err);
    });
});
