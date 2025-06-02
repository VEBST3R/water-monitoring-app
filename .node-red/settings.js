module.exports = {
    // Основні налаштування
    uiPort: process.env.PORT || 1880,
      // Налаштування для безпеки та credentials  
    credentialSecret: "water-monitoring-secret-key-2025",
    
    // Директорія для зберігання потоків та даних
    userDir: __dirname,
      // Назва файлу з потоками
    flowFile: require('path').join(__dirname, 'flows.json'),
    
    // Відключаємо автоматичне створення flows файлу
    flowFilePretty: true,
    
    // Параметри безпеки
    adminAuth: false, // Відключаємо аутентифікацію для локальної розробки
    
    // Налаштування HTTP
    httpAdminRoot: '/admin',
    httpNodeRoot: '/api',
    
    // CORS налаштування для React Native додатка
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE",
        allowedHeaders: "Content-Type, Authorization"
    },
    
    // Налаштування логування
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },
    
    // Налаштування контекста
    contextStorage: {
        default: {
            module: "memory"
        }
    },
    
    // Налаштування редактора
    editorTheme: {
        projects: {
            enabled: false
        }
    }
};
