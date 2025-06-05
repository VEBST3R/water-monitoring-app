import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { UserDevice } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DeviceSelectionViewProps {
  devices: UserDevice[];
  currentDeviceIndex: number;
  onDeviceSelect: (index: number) => void;
  onDeleteDevice: (deviceId: string) => void;
  isDarkMode?: boolean;
}

const DeviceSelectionView: React.FC<DeviceSelectionViewProps> = ({
  devices,
  currentDeviceIndex,
  onDeviceSelect,
  onDeleteDevice,
  isDarkMode = false,
}) => {
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const renderDeviceItem = ({ item, index }: { item: UserDevice; index: number }) => {
    const isSelected = index === currentDeviceIndex;
    
    return (        <TouchableOpacity
        style={[
          styles.deviceItem, 
          isSelected && styles.selectedDeviceItem,
          { backgroundColor: isSelected ? colors.tint : colors.background }
        ]}
        onPress={() => onDeviceSelect(index)}
        activeOpacity={0.8}
        delayPressIn={0}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Ionicons 
              name="hardware-chip" 
              size={24} 
              color={isSelected ? colors.background : colors.tint} 
            />
            <ThemedText 
              type="subtitle" 
              style={[
                styles.deviceName,
                isSelected && styles.selectedDeviceName,
                { color: isSelected ? colors.background : colors.text }
              ]}
            >
              {item.customName || item.name || 'Невідомий пристрій'}
            </ThemedText>
          </View>
          
          <View style={styles.deviceDetails}>
            <View style={styles.deviceDetailRow}>
              <Ionicons 
                name="barcode-outline" 
                size={16} 
                color={isSelected ? colors.background : colors.icon} 
              />
              <ThemedText 
                style={[
                  styles.deviceDetailText,
                  isSelected && styles.selectedDeviceDetailText,
                  { color: isSelected ? colors.background : colors.tabIconDefault }
                ]}
              >
                ID: {item.serverConfig?.deviceId || 'Невідомо'}
              </ThemedText>
            </View>
            <View style={styles.deviceDetailRow}>
              <Ionicons 
                name="wifi" 
                size={16} 
                color={isSelected ? colors.background : (item.isOnline !== false ? '#4CAF50' : '#F44336')} 
              />
              <ThemedText 
                style={[
                  styles.deviceDetailText,
                  isSelected && styles.selectedDeviceDetailText,
                  { color: isSelected ? colors.background : colors.tabIconDefault }
                ]}
              >
                {item.isOnline !== false ? 'Онлайн' : 'Офлайн'}
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          {/* Кнопка видалення */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDeleteDevice(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >            <Ionicons 
              name="trash-outline" 
              size={22} 
              color={isSelected ? colors.background : colors.error} 
            />
          </TouchableOpacity>
          
          {/* Галочка відібраного пристрою */}
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={colors.background} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
    return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
          Вибір пристрою
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
          {devices.length} {devices.length === 1 ? 'пристрій' : 'пристроїв'} доступно
        </ThemedText>
      </View>

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item, index) => `${item.id || index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.light.background, // Removed - now dynamic
    paddingTop: 60, // Space for status bar
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    // borderBottomColor: Colors.light.tabIconDefault, // Removed - now dynamic
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 5,
    // color: Colors.light.text, // Removed - now dynamic
  },
  headerSubtitle: {
    textAlign: 'center',
    // color: Colors.light.icon, // Removed - now dynamic
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    paddingTop: 30, // Збільшена відстань зверху для кращого візуального розділення
  },  deviceItem: {
    // backgroundColor: Colors.light.background, // Removed - now dynamic
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    // borderColor: Colors.light.tabIconDefault, // Removed - now dynamic
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.5,
    elevation: 6,
  },
  selectedDeviceItem: {
    // backgroundColor: Colors.light.tint, // Removed - now dynamic
    // borderColor: Colors.light.tint, // Removed - now dynamic
    shadowOpacity: 0.35,
    shadowRadius: 5.5,
    elevation: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },  deviceName: {
    marginLeft: 10,
    // color: Colors.light.text, // Removed - now dynamic
    flex: 1,
  },
  selectedDeviceName: {
    // color: Colors.light.background, // Removed - now dynamic
  },
  deviceDetails: {
    marginLeft: 34, // Align with device name
  },
  deviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  deviceDetailText: {
    marginLeft: 8,
    fontSize: 14,
    // color: Colors.light.icon, // Removed - now dynamic
  },
  selectedDeviceDetailText: {
    // color: Colors.light.background, // Removed - now dynamic
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 5,
    marginRight: 10,
  },
  checkmarkContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DeviceSelectionView;
