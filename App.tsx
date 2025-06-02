import { LogBox } from 'react-native';

// Ігноруємо конкретне попередження про читання значень під час рендеру
LogBox.ignoreLogs([
  "[Reanimated] Reading from `value` during component render." // Виправлено на англійський текст попередження
]);

// ...existing App component code...
