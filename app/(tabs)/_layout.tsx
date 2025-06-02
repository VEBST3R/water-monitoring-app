import { Tabs } from 'expo-router';

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
          title: '', // Explicitly set title to empty or undefined
          // No icon needed if tab bar is hidden
        }}
      />
      {/* Removed explore tab as per previous setup */}
    </Tabs>
  );
}
