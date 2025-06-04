import { UserDevice } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WebSidebarProps {
  collapsed: boolean;
  activeView: 'dashboard' | 'analytics' | 'devices' | 'settings';
  onViewChange: (view: 'dashboard' | 'analytics' | 'devices' | 'settings') => void;
  isDarkMode: boolean;
  devices: UserDevice[];
  currentDeviceIndex: number;
  onDeviceChange: (index: number) => void;
}

const WebSidebar: React.FC<WebSidebarProps> = ({
  collapsed,
  activeView,
  onViewChange,
  isDarkMode,
  devices,
  currentDeviceIndex,
  onDeviceChange,
}) => {
  const menuItems = [
    { key: 'dashboard', icon: 'speedometer-outline', label: 'Dashboard' },
    { key: 'analytics', icon: 'analytics-outline', label: 'Analytics' },
    { key: 'devices', icon: 'hardware-chip-outline', label: 'Devices' },
    { key: 'settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={[
      styles.sidebar, 
      collapsed && styles.sidebarCollapsed,
      isDarkMode && styles.sidebarDark
    ]}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Menu */}
        <View style={styles.menuSection}>
          {!collapsed && (
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Navigation
            </Text>
          )}
          
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                activeView === item.key && styles.menuItemActive,
                isDarkMode && styles.menuItemDark,
                activeView === item.key && isDarkMode && styles.menuItemActiveDark,
                collapsed && styles.menuItemCollapsed,
              ]}
              onPress={() => onViewChange(item.key as any)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={
                  activeView === item.key
                    ? '#3b82f6'
                    : isDarkMode
                    ? '#94a3b8'
                    : '#64748b'
                }
              />
              {!collapsed && (
                <Text style={[
                  styles.menuItemText,
                  activeView === item.key && styles.menuItemTextActive,
                  isDarkMode && styles.menuItemTextDark,
                ]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Devices Section */}
        {!collapsed && (
          <View style={styles.devicesSection}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Devices ({devices.length})
            </Text>
            
            {devices.map((device, index) => (
              <TouchableOpacity
                key={device.id || index}
                style={[
                  styles.deviceItem,
                  currentDeviceIndex === index && styles.deviceItemActive,
                  isDarkMode && styles.deviceItemDark,
                  currentDeviceIndex === index && isDarkMode && styles.deviceItemActiveDark,
                ]}
                onPress={() => onDeviceChange(index)}
              >
                <View style={styles.deviceInfo}>
                  <View style={[
                    styles.deviceStatus,
                    device.isOnline ? styles.deviceStatusOnline : styles.deviceStatusOffline
                  ]} />
                  <View style={styles.deviceDetails}>
                    <Text style={[
                      styles.deviceName,
                      currentDeviceIndex === index && styles.deviceNameActive,
                      isDarkMode && styles.deviceNameDark,
                    ]}>
                      {device.customName || device.name || `Device ${index + 1}`}
                    </Text>
                    <Text style={[
                      styles.deviceLocation,
                      isDarkMode && styles.deviceLocationDark,
                    ]}>
                      {device.location || 'Unknown location'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDarkMode ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[
              styles.addDeviceButton,
              isDarkMode && styles.addDeviceButtonDark
            ]}>
              <Ionicons
                name="add"
                size={16}
                color={isDarkMode ? '#94a3b8' : '#64748b'}
              />
              <Text style={[
                styles.addDeviceText,
                isDarkMode && styles.addDeviceTextDark
              ]}>
                Add Device
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingTop: 88, // Header height + padding
    ...Platform.select({
      web: {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      },
    }),
  },
  sidebarCollapsed: {
    width: 64,
  },
  sidebarDark: {
    backgroundColor: '#1e293b',
    borderRightColor: '#334155',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionTitleDark: {
    color: '#94a3b8',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
  },
  menuItemDark: {
    backgroundColor: 'transparent',
  },
  menuItemActiveDark: {
    backgroundColor: '#1e40af20',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  menuItemTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  menuItemTextDark: {
    color: '#e2e8f0',
  },
  devicesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 24,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  deviceItemActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  deviceItemDark: {
    backgroundColor: '#334155',
  },
  deviceItemActiveDark: {
    backgroundColor: '#1e40af20',
    borderColor: '#3b82f6',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  deviceStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceStatusOnline: {
    backgroundColor: '#10b981',
  },
  deviceStatusOffline: {
    backgroundColor: '#ef4444',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  deviceNameActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  deviceNameDark: {
    color: '#e2e8f0',
  },
  deviceLocation: {
    fontSize: 11,
    color: '#64748b',
  },
  deviceLocationDark: {
    color: '#94a3b8',
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 6,
  },
  addDeviceButtonDark: {
    borderColor: '#475569',
  },
  addDeviceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  addDeviceTextDark: {
    color: '#94a3b8',
  },
});

export default WebSidebar;
