#!/usr/bin/env node

/**
 * Скрипт для запуску Node-RED сервера
 * Water Monitoring App
 */

const RED = require('node-red');
const http = require('http');
const express = require('express');
const settings = require('./settings.js');

// Створення HTTP сервера
const app = express();
const server = http.createServer(app);

// Ініціалізація Node-RED
RED.init(server, settings);

// Підключення Admin API до Express app
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Підключення HTTP API до Express app  
app.use(settings.httpNodeRoot, RED.httpNode);

// Запуск сервера
server.listen(settings.uiPort, function() {
    console.log('🌊 Water Monitoring Node-RED Server запущений!');
    console.log(`📊 Admin панель: http://localhost:${settings.uiPort}${settings.httpAdminRoot}`);
    console.log(`🔗 API endpoints: http://localhost:${settings.uiPort}${settings.httpNodeRoot}`);
    console.log('📱 Доступні API:');
    console.log(`   • GET  ${settings.httpNodeRoot}/getWQI?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/getDeviceStatus?device=111001`);
    console.log(`   • POST ${settings.httpNodeRoot}/calibrateSensors?device=111001`);
    console.log(`   • GET  ${settings.httpNodeRoot}/listAvailableSensors`);
    console.log('');
    console.log('💡 Для зупинки сервера натисніть Ctrl+C');
    
    // Запуск Node-RED runtime
    RED.start();
});
