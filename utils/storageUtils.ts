import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Helper function for cross-platform storage
export const saveToStorage = async (key: string, value: any) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  } else {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to AsyncStorage:', e);
      return false;
    }
  }
};

// Helper function to get from storage
export const getFromStorage = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Error getting from localStorage:', e);
      return null;
    }
  } else {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Error getting from AsyncStorage:', e);
      return null;
    }
  }
};

// Helper function to remove from storage
export const removeFromStorage = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  } else {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from AsyncStorage:', e);
      return false;
    }
  }
};
