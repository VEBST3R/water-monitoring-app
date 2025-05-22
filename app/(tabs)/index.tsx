import { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ScoreCircle from '../../components/ScoreCircle';
import WaveAnimation from '../../components/WaveAnimation';

// Mock function to simulate fetching water quality score
const fetchWaterQualityScore = async (): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const scores = [10, 30, 50, 70, 90];
  return scores[Math.floor(Math.random() * scores.length)];
};

export default function MainScreen() {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadScore = async () => {
      setLoading(true);
      const fetchedScore = await fetchWaterQualityScore();
      setScore(fetchedScore);
      setLoading(false);
    };
    loadScore();
  }, []);

  const backgroundColor = '#E6F3FF'; 

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <Text style={styles.loadingText}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor }]}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} backgroundColor={backgroundColor} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.mainContentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.mainTitle}>Water Check</Text>
            <Text style={styles.subtitle}>Щоденний моніторинг якості води</Text>
          </View>
          <ScoreCircle initialScore={score} onScoreUpdate={setScore} />
          <View style={styles.spacer} /> 
        </View>
      </SafeAreaView>
      <WaveAnimation score={score} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  safeAreaContent: {
    flex: 1,
    zIndex: 2, // Додано zIndex
  },
  mainContentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003366',
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    marginTop: 8,
    textAlign: 'center',
  },
  spacer: {
    flexGrow: 1,
  },
});
