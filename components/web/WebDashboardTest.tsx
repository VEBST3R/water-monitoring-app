import React from 'react';
import { Platform, Text, View } from 'react-native';

interface WebDashboardTestProps {
  score: number;
}

const WebDashboardTest: React.FC<WebDashboardTestProps> = ({ score }) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>🌊 Web Dashboard Test</Text>
      <Text style={{ fontSize: 18, marginTop: 10 }}>Score: {score}</Text>
    </View>
  );
};

export default WebDashboardTest;
