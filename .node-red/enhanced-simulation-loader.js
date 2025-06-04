// Enhanced Simulation Loader for Node-RED
// This script properly loads the Enhanced simulation module

function loadEnhancedSimulation() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Use __dirname to get the current Node-RED directory
        const nodeRedDir = __dirname;
        const enhancedSimPath = path.join(nodeRedDir, 'enhanced-simulation.js');
        
        console.log('🔍 Пошук Enhanced simulation в:', enhancedSimPath);
        
        if (fs.existsSync(enhancedSimPath)) {
            console.log('📂 Файл Enhanced simulation знайдено');
            
            // Read the file content
            const enhancedSimCode = fs.readFileSync(enhancedSimPath, 'utf8');
            
            // Evaluate the code in global context
            eval(enhancedSimCode);
            
            // Check if the class is available
            if (typeof EnhancedWaterSimulation !== 'undefined') {
                console.log('✅ Клас EnhancedWaterSimulation завантажено успішно');
                return EnhancedWaterSimulation;
            } else {
                console.error('❌ Клас EnhancedWaterSimulation не знайдено після завантаження');
                return null;
            }
        } else {
            console.error('❌ Файл Enhanced simulation не знайдено:', enhancedSimPath);
            return null;
        }
    } catch (error) {
        console.error('❌ Помилка завантаження Enhanced simulation:', error.message);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

// Export the loader function
global.loadEnhancedSimulation = loadEnhancedSimulation;

console.log('📦 Enhanced Simulation Loader готовий');
