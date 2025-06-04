/**
 * Enhanced Water Quality Simulation Engine v3 - Ultra Smooth Edition
 * Модуль з максимально плавними змінами та довгостроковими трендами замість хаотичних коливань
 */

class EnhancedWaterSimulation {
    constructor(initialDeviceConfigs, calculateWQI, formatOperatingTime) {
        this.devices = JSON.parse(JSON.stringify(initialDeviceConfigs));
        this.calculateWQI = calculateWQI;
        this.formatOperatingTime = formatOperatingTime;
        this.simulationStartTime = Date.now();
        
        // УЛЬТРА-ПЛАВНІ амплітуди коливань (зменшено на 75-90% для максимальної стабільності)
        this.variationAmplitudes = {
            ph: { normal: 0.02, event: 0.05, crisis: 0.1 },       // pH: ±0.02 норма (драматично зменшено)
            temp: { normal: 0.3, event: 0.5, crisis: 1.0 },       // Температура: ±0.3°C норма (зменшено)  
            tds: { normal: 8, event: 15, crisis: 30 },             // TDS: ±8 норма (зменшено)
            turbidity: { normal: 0.05, event: 0.1, crisis: 0.2 }  // Мутність: ±0.05 норма (драматично зменшено)
        };
        
        // Система довгострокових трендів для кожного параметра (5-35 хвилин періоди)
        this.longTermTrends = {};
        
        // М'які системи подій замість різких стрибків
        this.eventTypes = {
            GRADUAL_POLLUTION: 'gradual_pollution',      // Повільне забруднення протягом 5-15 хвилин
            SLOW_CHEMICAL_CHANGE: 'slow_chemical_change', // Хімічні зміни протягом 10-20 хвилин
            SEASONAL_VARIATION: 'seasonal_variation',     // Сезонні зміни протягом 15-30 хвилин
            EQUIPMENT_AGING: 'equipment_aging',           // Старіння обладнання протягом 20-30 хвилин
            WATER_SOURCE_CHANGE: 'water_source_change',   // Зміна джерела води протягом 10-25 хвилин
            RECOVERY_PHASE: 'recovery_phase'              // Відновлення протягом 10-20 хвилин
        };
        
        // Система ультра-плавних циклів якості для кожного пристрою
        this.qualityCycles = {};
        this.activeEvents = {};
        
        this.initializeDeviceStates();
        
        console.log('🌊 Enhanced Water Simulation v3 Ultra Smooth Edition initialized - максимально стабільні зміни');
    }

    initializeDeviceStates() {
        for (const deviceId in this.devices) {
            this.activeEvents[deviceId] = [];
            this.devices[deviceId].activeEvents = [];
            
            // Ініціалізація УЛЬТРА-плавного циклу якості (максимально стабільний)
            this.qualityCycles[deviceId] = {
                phase: 'stable', // stable, slow_degrading, slow_recovering
                phaseStartTime: Date.now(),
                degradationLevel: 0, // 0-1 (0 = чиста вода, 1 = критичне забруднення)
                targetDegradation: 0,
                changeRate: 0.0005, // Ще повільніша швидкість змін (зменшено вдвічі)
                lastQualityChange: Date.now()
            };
            
            // Ініціалізація довгострокових ПЛАВНИХ трендів (5-35 хвилин періоди)
            this.longTermTrends[deviceId] = {
                ph: {
                    direction: (Math.random() - 0.5) * 0.0005,   // Напрямок тренду ±0.0005/секунду (зменшено)
                    period: 300000 + Math.random() * 1800000,    // Період 5-35 хвилин (збільшено)
                    amplitude: 0.05 + Math.random() * 0.1,       // Амплітуда 0.05-0.15 (зменшено)
                    startTime: Date.now(),
                    baseValue: this.devices[deviceId].baseline.ph
                },
                temp: {
                    direction: (Math.random() - 0.5) * 0.001,    // Зменшено швидкість
                    period: 600000 + Math.random() * 1800000,    // Період 10-40 хвилин  
                    amplitude: 0.5 + Math.random() * 1.0,        // Амплітуда 0.5-1.5°C (зменшено)
                    startTime: Date.now(),
                    baseValue: this.devices[deviceId].baseline.temp
                },
                tds: {
                    direction: (Math.random() - 0.5) * 0.05,     // Зменшено швидкість
                    period: 900000 + Math.random() * 1500000,    // Період 15-40 хвилин
                    amplitude: 10 + Math.random() * 20,          // Амплітуда 10-30 (зменшено)
                    startTime: Date.now(),
                    baseValue: this.devices[deviceId].baseline.tds
                },
                turbidity: {
                    direction: (Math.random() - 0.5) * 0.0002,   // Зменшено швидкість
                    period: 600000 + Math.random() * 1200000,    // Період 10-30 хвилин
                    amplitude: 0.03 + Math.random() * 0.07,      // Амплітуда 0.03-0.1 (зменшено)
                    startTime: Date.now(),
                    baseValue: this.devices[deviceId].baseline.turbidity
                }
            };
            
            console.log(`🎯 Пристрій ${deviceId}: ініціалізовано ультра-плавні тренди - pH період ${(this.longTermTrends[deviceId].ph.period/60000).toFixed(1)} хв, амплітуда ±${this.longTermTrends[deviceId].ph.amplitude.toFixed(3)}`);
        }
    }

    // УЛЬТРА-плавне управління циклами якості води з довгостроковими змінами
    updateQualityCycle(deviceId) {
        const cycle = this.qualityCycles[deviceId];
        const currentTime = Date.now();
        const phaseTime = currentTime - cycle.phaseStartTime;
        
        switch (cycle.phase) {
            case 'stable':
                // ДУЖЕ рідкий шанс початку плавного погіршення (1% кожні 30 секунд)
                if (Math.random() < 0.01 && phaseTime > 30000) {
                    this.startSlowDegradation(deviceId);
                }
                // ДУЖЕ повільне повернення до ідеального стану
                cycle.degradationLevel = Math.max(0, cycle.degradationLevel - 0.001);
                break;
                
            case 'slow_degrading':
                // УЛЬТРА-повільне погіршення протягом 5-15 хвилин
                const degradationDuration = 300000 + Math.random() * 600000; // 5-15 хвилин
                const progress = Math.min(1, phaseTime / degradationDuration);
                
                // МАКСИМАЛЬНО плавне збільшення деградації (синусоїдальна крива)
                const smoothProgress = Math.sin(progress * Math.PI / 2); // S-подібна крива для плавності
                cycle.degradationLevel = smoothProgress * cycle.targetDegradation;
                
                if (progress >= 1) {
                    cycle.phase = 'slow_recovering';
                    cycle.phaseStartTime = currentTime;
                    console.log(`🔄 Пристрій ${deviceId}: Початок ультра-плавного відновлення (рівень: ${(cycle.degradationLevel * 100).toFixed(1)}%)`);
                }
                break;
                
            case 'slow_recovering':
                // УЛЬТРА-повільне відновлення протягом 10-20 хвилин
                const recoveryDuration = 600000 + Math.random() * 600000; // 10-20 хвилин
                const recoveryProgress = Math.min(1, phaseTime / recoveryDuration);
                
                // МАКСИМАЛЬНО плавне відновлення (зворотна синусоїдальна крива)
                const smoothRecovery = Math.cos(recoveryProgress * Math.PI / 2);
                cycle.degradationLevel = cycle.targetDegradation * smoothRecovery;
                
                if (recoveryProgress >= 1) {
                    cycle.phase = 'stable';
                    cycle.phaseStartTime = currentTime;
                    cycle.degradationLevel = 0;
                    console.log(`✅ Пристрій ${deviceId}: Якість води ультра-плавно відновлено`);
                }
                break;
        }
    }
    
    startSlowDegradation(deviceId) {
        const cycle = this.qualityCycles[deviceId];
        cycle.phase = 'slow_degrading';
        cycle.phaseStartTime = Date.now();
        cycle.targetDegradation = 0.05 + Math.random() * 0.15; // 5-20% плавне погіршення (ЗМЕНШЕНО)
        
        // Вибір типу УЛЬТРА-плавного забруднення
        const pollutionTypes = [
            this.eventTypes.GRADUAL_POLLUTION,
            this.eventTypes.SLOW_CHEMICAL_CHANGE,
            this.eventTypes.SEASONAL_VARIATION,
            this.eventTypes.EQUIPMENT_AGING,
            this.eventTypes.WATER_SOURCE_CHANGE
        ];
        
        const selectedType = pollutionTypes[Math.floor(Math.random() * pollutionTypes.length)];
        
        const event = {
            type: selectedType,
            startTime: Date.now(),
            duration: 900000 + Math.random() * 1200000, // 15-35 хвилин (ЗБІЛЬШЕНО для плавності)
            intensity: cycle.targetDegradation,
            id: `ultra_smooth_degradation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.activeEvents[deviceId].push(event);
        this.devices[deviceId].activeEvents = this.activeEvents[deviceId];
        
        console.log(`🐌 Пристрій ${deviceId}: Початок ультра-плавного погіршення - ${selectedType} (цільовий рівень: ${(cycle.targetDegradation * 100).toFixed(1)}%, тривалість: ${(event.duration/60000).toFixed(1)} хв)`);
    }
    
    // Застосування УЛЬТРА-м'яких змін на основі циклу
    applyQualityDegradation(deviceId, baseParams) {
        const cycle = this.qualityCycles[deviceId];
        const degradation = cycle.degradationLevel;
        
        if (degradation === 0) return baseParams;
        
        let modifiedParams = { ...baseParams };
        
        // Розрахунок РЕАЛІСТИЧНОГО впливу на основі рівня деградації (МАКСИМАЛЬНО зменшено)
        const phShift = degradation * (0.05 + Math.random() * 0.1); // pH може змінитися на 0.05-0.15 (ЗМЕНШЕНО)
        const tempIncrease = degradation * (0.2 + Math.random() * 0.3); // Температура +0.2-0.5°C (ЗМЕНШЕНО)
        const tdsIncrease = degradation * (15 + Math.random() * 25); // TDS +15-40 (ЗМЕНШЕНО)
        const turbidityIncrease = degradation * (0.1 + Math.random() * 0.2); // Мутність +0.1-0.3 (ДРАМАТИЧНО зменшено)
        
        // Випадковий вибір напрямку змін pH (кислотність або лужність)
        if (Math.random() > 0.5) {
            modifiedParams.ph -= phShift; // Кислотність
        } else {
            modifiedParams.ph += phShift; // Лужність
        }
        
        modifiedParams.temp += tempIncrease;
        modifiedParams.tds += tdsIncrease;
        modifiedParams.turbidity += turbidityIncrease;
        
        return modifiedParams;
    }

    // Застосування ДОВГОСТРОКОВИХ трендів (новий метод)
    applyLongTermTrends(deviceId, currentParams, timestamp) {
        const trends = this.longTermTrends[deviceId];
        const timeSinceStart = timestamp - this.simulationStartTime;
        
        let trendParams = { ...currentParams };
        
        // Застосування довгострокових синусоїдальних трендів для кожного параметра
        for (const param in trends) {
            const trend = trends[param];
            const cyclePosition = (timeSinceStart / trend.period) * 2 * Math.PI;
            const trendValue = Math.sin(cyclePosition) * trend.amplitude;
            
            // Плавне застосування тренду
            trendParams[param] = trend.baseValue + trendValue + (trend.direction * timeSinceStart / 1000);
        }
        
        return trendParams;
    }
    
    // УЛЬТРА-плавні природні коливання (зменшені амплітуди)
    applyNaturalVariation(current, baseline, amplitude) {
        const returnForce = (baseline - current) * 0.02; // Ще слабша сила повернення
        const randomVariation = (Math.random() - 0.5) * amplitude;
        
        return current + returnForce + randomVariation;
    }
    
    // Основна функція генерації даних для пристрою з довгостроковими трендами
    generateDeviceData(device, timestamp) {
        const deviceId = device.id;
        
        // Оновлення циклу якості
        this.updateQualityCycle(deviceId);
        
        // Очищення завершених подій
        this.cleanupExpiredEvents(deviceId);
        
        // Застосування довгострокових трендів як основи
        let trendParams = this.applyLongTermTrends(deviceId, device.baseline, timestamp);
        
        // Застосування УЛЬТРА-легких природних коливань
        trendParams.ph = this.applyNaturalVariation(
            device.current.ph, 
            trendParams.ph, 
            this.variationAmplitudes.ph.normal
        );
        
        trendParams.temp = this.applyNaturalVariation(
            device.current.temp, 
            trendParams.temp, 
            this.variationAmplitudes.temp.normal
        );
        
        trendParams.tds = this.applyNaturalVariation(
            device.current.tds, 
            trendParams.tds, 
            this.variationAmplitudes.tds.normal
        );
        
        trendParams.turbidity = this.applyNaturalVariation(
            device.current.turbidity, 
            trendParams.turbidity, 
            this.variationAmplitudes.turbidity.normal
        );
        
        // Застосування м'яких змін якості
        let modifiedParams = this.applyQualityDegradation(deviceId, trendParams);
        
        // Обмеження значень у реалістичних межах
        modifiedParams.ph = Math.max(0, Math.min(14, modifiedParams.ph));
        modifiedParams.temp = Math.max(0, Math.min(50, modifiedParams.temp));
        modifiedParams.tds = Math.max(0, Math.min(3000, modifiedParams.tds));
        modifiedParams.turbidity = Math.max(0, Math.min(100, modifiedParams.turbidity));
        
        // Округлення до розумних значень
        modifiedParams.ph = parseFloat(modifiedParams.ph.toFixed(2));
        modifiedParams.temp = parseFloat(modifiedParams.temp.toFixed(1));
        modifiedParams.tds = Math.floor(modifiedParams.tds);
        modifiedParams.turbidity = parseFloat(modifiedParams.turbidity.toFixed(1));
        
        // Збереження поточних значень
        device.current = modifiedParams;
        device.current.lastUpdate = timestamp;
        
        // Додавання інформації про фазу якості
        device.current.qualityPhase = this.qualityCycles[deviceId].phase;
        device.current.degradationLevel = this.qualityCycles[deviceId].degradationLevel;
        
        // Оновлення технічних параметрів
        this.updateTechnicalParameters(device, timestamp);
        
        return modifiedParams;
    }
    
    cleanupExpiredEvents(deviceId) {
        const currentTime = Date.now();
        this.activeEvents[deviceId] = this.activeEvents[deviceId].filter(event => {
            return (currentTime - event.startTime) < event.duration;
        });
        this.devices[deviceId].activeEvents = this.activeEvents[deviceId];
    }
    
    // Оновлення технічних параметрів пристрою
    updateTechnicalParameters(device, timestamp) {
        const technical = device.technical;
        
        // Симуляція батареї
        if (technical.powerType === 'battery') {
            technical.batteryLevel = Math.max(0, technical.batteryLevel - 0.1);
            
            if (technical.batteryLevel < 20 && technical.batteryLevel > 15) {
                this.addAlert(device, {
                    type: "battery_critical",
                    severity: "critical", 
                    message: "Критично низький рівень батареї",
                    timestamp: timestamp
                });
            }
        } else if (technical.powerType === 'solar') {
            const hour = new Date(timestamp).getHours();
            if (hour >= 6 && hour <= 18) {
                technical.batteryLevel = Math.min(100, technical.batteryLevel + 0.2);
            } else {
                technical.batteryLevel = Math.max(0, technical.batteryLevel - 0.05);
            }
        }
        
        // Симуляція сигналу
        technical.signalStrength += (Math.random() - 0.5) * 5;
        technical.signalStrength = Math.max(-90, Math.min(-20, technical.signalStrength));
        
        if (technical.signalStrength > -50) {
            technical.connectionStatus = "Стабільне";
        } else if (technical.signalStrength > -70) {
            technical.connectionStatus = "Помірне";
        } else {
            technical.connectionStatus = "Слабке";
        }
        
        // Симуляція відключення пристрою 333003
        if (device.id === '333003') {
            const offlineChance = Math.random();
            if (offlineChance < 0.02) {
                device.isOnline = false;
                technical.connectionStatus = "Відключено";
                this.addAlert(device, {
                    type: "connection_lost",
                    severity: "error",
                    message: "З'єднання з пристроєм втрачено",
                    timestamp: timestamp
                });
            } else if (!device.isOnline && offlineChance > 0.95) {
                device.isOnline = true;
                technical.connectionStatus = "Відновлено";
            }
        }
        
        // Сповіщення про якість води
        const degradationLevel = this.qualityCycles[device.id].degradationLevel;
        if (degradationLevel > 0.7) {
            this.addAlert(device, {
                type: "water_quality_critical",
                severity: "critical",
                message: `Критичне погіршення якості води (${(degradationLevel * 100).toFixed(1)}%)`,
                timestamp: timestamp
            });
        } else if (degradationLevel > 0.4) {
            this.addAlert(device, {
                type: "water_quality_warning",
                severity: "warning", 
                message: `Помірне погіршення якості води (${(degradationLevel * 100).toFixed(1)}%)`,
                timestamp: timestamp
            });
        }
    }
    
    // Додавання сповіщень
    addAlert(device, alertData) {
        const existingAlert = device.technical.alerts.find(alert => alert.type === alertData.type);
        if (!existingAlert) {
            device.technical.alerts.push({
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                acknowledged: false,
                ...alertData
            });
            
            if (device.technical.alerts.length > 8) {
                device.technical.alerts = device.technical.alerts.slice(-8);
            }
        }
    }
    
    // Отримання статусу якості для пристрою
    getQualityStatus(deviceId) {
        const cycle = this.qualityCycles[deviceId];
        if (!cycle) return null;
        
        return {
            phase: cycle.phase,
            degradationLevel: cycle.degradationLevel,
            phaseDescription: this.getPhaseDescription(cycle.phase),
            timeInCurrentPhase: Date.now() - cycle.phaseStartTime
        };
    }
    
    getPhaseDescription(phase) {
        const descriptions = {
            'stable': 'Стабільна якість води',
            'slow_degrading': 'Повільне погіршення якості',
            'slow_recovering': 'Повільне відновлення якості'
        };
        return descriptions[phase] || 'Невідомий стан';
    }
    
    // Отримання даних всіх пристроїв
    getAllDeviceData() {
        return this.devices;
    }
    
    // Отримання даних конкретного пристрою
    getDeviceData(deviceId) {
        return this.devices[deviceId] || null;
    }
    
    // Калібрування датчиків з скиданням циклу
    calibrateDevice(deviceId) {
        const device = this.devices[deviceId];
        if (!device) return false;
        
        device.technical.lastCalibration = Date.now();
        device.technical.sensorStatus = "Всі датчики онлайн";
        
        device.technical.alerts = device.technical.alerts.filter(alert => 
            !alert.type.includes('calibration') && !alert.type.includes('water_quality')
        );
        
        // Скидання до стабільного стану
        device.current = { ...device.baseline, lastUpdate: Date.now(), wqi: 0 };
        this.qualityCycles[deviceId] = {
            phase: 'stable',
            phaseStartTime: Date.now(),
            degradationLevel: 0,
            targetDegradation: 0,
            changeRate: 0.0005,
            lastQualityChange: Date.now()
        };
        
        // Очищення активних подій
        this.activeEvents[deviceId] = [];
        
        console.log(`🔧 Пристрій ${deviceId} відкалібровано та скинуто до стабільного стану`);
        return true;
    }
}

// Експорт класу
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedWaterSimulation;
} else {
    this.EnhancedWaterSimulation = EnhancedWaterSimulation;
}