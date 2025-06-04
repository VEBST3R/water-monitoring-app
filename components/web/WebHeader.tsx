import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WebHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'loading';
  lastUpdate: number | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const WebHeader: React.FC<WebHeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  connectionStatus,
  lastUpdate,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'error': return '#f59e0b';
      case 'loading': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'disconnected': return 'Offline';
      case 'error': return 'Error';
      case 'loading': return 'Connecting...';
      default: return 'Unknown';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = Date.now();
    const diff = now - lastUpdate;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <View style={[styles.header, isDarkMode && styles.headerDark]}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[styles.menuButton, isDarkMode && styles.menuButtonDark]}
          onPress={onToggleSidebar}
        >
          <Ionicons
            name={sidebarCollapsed ? "menu" : "menu-outline"}
            size={20}
            color={isDarkMode ? '#f1f5f9' : '#334155'}
          />
        </TouchableOpacity>
        
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>💧</Text>
          </View>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Water Monitor
          </Text>
        </View>
      </View>

      {/* Center Section - Status */}
      <View style={styles.centerSection}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <Text style={[styles.lastUpdate, isDarkMode && styles.lastUpdateDark]}>
          Last update: {formatLastUpdate()}
        </Text>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
          onPress={onToggleTheme}
        >
          <Ionicons
            name={isDarkMode ? "sunny" : "moon"}
            size={18}
            color={isDarkMode ? '#fbbf24' : '#334155'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={isDarkMode ? '#f1f5f9' : '#334155'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={isDarkMode ? '#f1f5f9' : '#334155'}
          />
        </TouchableOpacity>

        <View style={[styles.userAvatar, isDarkMode && styles.userAvatarDark]}>
          <Text style={[styles.userInitial, isDarkMode && styles.userInitialDark]}>U</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      },
    }),
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuButtonDark: {
    backgroundColor: '#334155',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  titleDark: {
    color: '#f1f5f9',
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#64748b',
  },
  lastUpdateDark: {
    color: '#94a3b8',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDark: {
    backgroundColor: '#334155',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userAvatarDark: {
    backgroundColor: '#6366f1',
  },
  userInitial: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userInitialDark: {
    color: 'white',
  },
});

export default WebHeader;
