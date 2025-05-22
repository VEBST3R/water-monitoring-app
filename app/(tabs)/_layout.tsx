import { Tabs } from 'expo-router';
import React from 'react';

// Assuming Colors and useColorScheme are still relevant for potential future use or theming
// import { Colors } from '@/constants/Colors'; 
// import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, // Theming can be re-added if needed
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Keep tab bar hidden as per previous setup
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ 
          // No title or icon needed if tab bar is hidden
        }}
      />
      {/* Removed explore tab as per previous setup */}
    </Tabs>
  );
}
