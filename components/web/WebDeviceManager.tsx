import { UserDevice } from '@/types';
import { saveToStorage } from '@/utils/storageUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface WebDeviceManagerProps {
  userDevices: UserDevice[];
  currentDeviceIndex: number;
  isDarkMode: boolean;
  onDeviceChange: (index: number) => void;
  onDevicesUpdate: (devices: UserDevice[]) => void;
  onAddDevice: () => Promise<void>;
  onDeleteDevice: (deviceId: string) => void;
}

const ASYNC_STORAGE_DEVICES_KEY = '@devices';
const CENTRAL_SERVER_ENDPOINT = '192.168.1.101:1880';

const WebDeviceManager: React.FC<WebDeviceManagerProps> = ({
  userDevices,
  currentDeviceIndex,
  isDarkMode,
  onDeviceChange,
  onDevicesUpdate,
  onAddDevice,
  onDeleteDevice,
}) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDevice = async () => {
    const trimmedDeviceId = newDeviceId.trim();
    const trimmedDeviceName = newDeviceName.trim();

    // Валідація
    if (!/^\d{6}$/.test(trimmedDeviceId)) {
      Alert.alert("Помилка", "ID пристрою має містити рівно 6 цифр.");
      return;
    }

    if (!trimmedDeviceName) {
      Alert.alert("Помилка", "Будь ласка, введіть назву пристрою.");
      return;
    }

    // Перевіряємо, чи вже існує пристрій з таким ID
    const deviceExists = userDevices.some(device => 
      device.serverConfig?.deviceId === trimmedDeviceId
    );
    
    if (deviceExists) {
      Alert.alert("Помилка", `Пристрій з ID '${trimmedDeviceId}' вже додано до вашого списку.`);
      return;
    }

    setIsLoading(true);    try {
      // Валідація пристрою через сервер
      const validationUrl = `http://${CENTRAL_SERVER_ENDPOINT}/api/getWQI?device=${trimmedDeviceId}`;
      const response = await fetch(validationUrl);

      if (!response.ok) {
        if (response.status === 409) {
          Alert.alert(
            "Інформація", 
            `Пристрій з ID '${trimmedDeviceId}' вже зареєстровано на сервері. Перевірте правильність ID або спробуйте інший.`
          );
          return;
        } else if (response.status === 404) {
          Alert.alert(
            "Помилка", 
            `Пристрою з ID '${trimmedDeviceId}' не знайдено на сервері. Перевірте правильність ID.`
          );
          return;
        } else {
          Alert.alert(
            "Помилка", 
            `Не вдалося перевірити пристрій з ID '${trimmedDeviceId}'. Помилка сервера: ${response.status}`
          );
          return;
        }
      }

      // Створюємо новий пристрій
      const newDevice: UserDevice = {
        id: `user_device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        customName: trimmedDeviceName,
        serverConfig: {
          deviceId: trimmedDeviceId,
          serverName: `Датчик ${trimmedDeviceId}`,
        },
        location: 'Не вказано',
        isOnline: true,
        lastUpdate: new Date().toISOString(),
      };      const updatedDevices = [...userDevices, newDevice];
      
      // Зберігаємо, використовуючи крос-платформне рішення
      const saveResult = await saveToStorage(ASYNC_STORAGE_DEVICES_KEY, updatedDevices);
      
      if (!saveResult) {
        console.warn("Не вдалося зберегти дані про пристрої");
      }
      
      // Оновлюємо стан
      onDevicesUpdate(updatedDevices);
      onDeviceChange(updatedDevices.length - 1);

      // Закриваємо модальне вікно та очищуємо поля
      setIsAddModalVisible(false);
      setNewDeviceName('');
      setNewDeviceId('');

      Alert.alert("Успіх", `Пристрій "${trimmedDeviceName}" (ID: ${trimmedDeviceId}) успішно додано!`);

    } catch (error) {
      console.error('Error adding device:', error);
      Alert.alert("Помилка мережі", `Не вдалося перевірити ID датчика '${trimmedDeviceId}'. Перевірте з'єднання з мережею та доступність сервера Node-RED.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    Alert.alert(
      "Видалення пристрою",
      "Ви впевнені, що хочете видалити цей пристрій?",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Видалити", 
          style: "destructive",
          onPress: async () => {
            try {              const updatedDevices = userDevices.filter(device => device.id !== deviceId);
              
              // Зберігаємо, використовуючи крос-платформне рішення
              const saveResult = await saveToStorage(ASYNC_STORAGE_DEVICES_KEY, updatedDevices);
              
              if (!saveResult) {
                console.warn("Не вдалося зберегти дані про пристрої");
              }
              
              // Оновлюємо стан
              onDevicesUpdate(updatedDevices);
              
              // Коригуємо поточний індекс
              if (updatedDevices.length === 0) {
                onDeviceChange(0);
              } else if (currentDeviceIndex >= updatedDevices.length) {
                onDeviceChange(updatedDevices.length - 1);
              } else {
                const deletedIndex = userDevices.findIndex(d => d.id === deviceId);
                if (deletedIndex < currentDeviceIndex) {
                  onDeviceChange(currentDeviceIndex - 1);
                }
              }
            } catch (error) {
              console.error('Error deleting device:', error);
              Alert.alert("Помилка", "Не вдалося видалити пристрій.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
          Мої пристрої
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, isDarkMode && styles.darkAddButton]}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={20} color={isDarkMode ? '#ffffff' : '#007AFF'} />
          <Text style={[styles.addButtonText, isDarkMode && styles.darkText]}>
            Додати
          </Text>
        </TouchableOpacity>
      </View>

      {/* Список пристроїв */}
      <ScrollView style={styles.devicesList} showsVerticalScrollIndicator={false}>
        {userDevices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="hardware-chip-outline" 
              size={64} 
              color={isDarkMode ? '#64748b' : '#94a3b8'} 
            />
            <Text style={[styles.emptyStateTitle, isDarkMode && styles.darkText]}>
              Немає пристроїв
            </Text>
            <Text style={[styles.emptyStateDescription, isDarkMode && styles.darkText]}>
              Додайте свій перший пристрій моніторингу води
            </Text>
            <TouchableOpacity 
              style={[styles.emptyStateButton, isDarkMode && styles.darkEmptyStateButton]}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Text style={[styles.emptyStateButtonText, isDarkMode && styles.darkText]}>
                Додати пристрій
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          userDevices.map((device, index) => (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceItem,
                isDarkMode && styles.darkDeviceItem,
                index === currentDeviceIndex && styles.activeDeviceItem,
                index === currentDeviceIndex && isDarkMode && styles.darkActiveDeviceItem,
              ]}
              onPress={() => onDeviceChange(index)}
            >
              <View style={styles.deviceIcon}>
                <Ionicons 
                  name="hardware-chip" 
                  size={24} 
                  color={index === currentDeviceIndex ? '#ffffff' : (isDarkMode ? '#64748b' : '#6b7280')}
                />
              </View>
              
              <View style={styles.deviceInfo}>
                <Text style={[
                  styles.deviceName,
                  isDarkMode && styles.darkText,
                  index === currentDeviceIndex && styles.activeDeviceText,
                ]}>
                  {device.customName || device.name || 'Невідомий пристрій'}
                </Text>
                <Text style={[
                  styles.deviceId,
                  isDarkMode && styles.darkSubText,
                  index === currentDeviceIndex && styles.activeDeviceSubText,
                ]}>
                  ID: {device.serverConfig?.deviceId || 'N/A'}
                </Text>
                <View style={styles.deviceStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: device.isOnline ? '#10b981' : '#ef4444' }
                  ]} />
                  <Text style={[
                    styles.deviceStatusText,
                    isDarkMode && styles.darkSubText,
                    index === currentDeviceIndex && styles.activeDeviceSubText,
                  ]}>
                    {device.isOnline ? 'Онлайн' : 'Офлайн'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDevice(device.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={18} 
                  color={index === currentDeviceIndex ? '#ffffff' : '#ef4444'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Модальне вікно додавання пристрою */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Додати новий пристрій
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>
                  Назва пристрою
                </Text>
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput]}
                  value={newDeviceName}
                  onChangeText={setNewDeviceName}
                  placeholder="Наприклад: Кухонний фільтр"
                  placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>
                  ID пристрою (6 цифр)
                </Text>
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput]}
                  value={newDeviceId}
                  onChangeText={setNewDeviceId}
                  placeholder="111001"
                  placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, isDarkMode && styles.darkCancelButton]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, isDarkMode && styles.darkText]}>
                    Скасувати
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddDevice}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Додавання...' : 'Додати'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkContainer: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#9ca3af',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  darkAddButton: {
    borderColor: '#3b82f6',
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  devicesList: {
    maxHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  darkEmptyStateButton: {
    backgroundColor: '#3b82f6',
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkDeviceItem: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  activeDeviceItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  darkActiveDeviceItem: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activeDeviceText: {
    color: '#ffffff',
  },
  deviceId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  activeDeviceSubText: {
    color: '#e5e7eb',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deviceStatusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  darkModalContent: {
    backgroundColor: '#1f2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  darkTextInput: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  darkCancelButton: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default WebDeviceManager;
