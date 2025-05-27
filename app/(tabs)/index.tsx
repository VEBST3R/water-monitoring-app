import { useEffect, useState } from 'react';
import { Dimensions, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'; // Added Dimensions
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'; // Added Gesture, GestureDetector, GestureHandlerRootView
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'; // Added for animation
import DetailedParametersView, { WaterParameters } from '../../components/DetailedParametersView'; // Import DetailedParametersView and WaterParameters
import ScoreCircle from '../../components/ScoreCircle';
import WaveAnimation from '../../components/WaveAnimation';

// Mock function to simulate fetching water quality score - CAN BE REMOVED if ScoreCircle handles all fetching
// const fetchWaterQualityScore = async (): Promise<number> => {
//   await new Promise(resolve => setTimeout(resolve, 500));
//   const scores = [10, 30, 50, 70, 90];
//   return scores[Math.floor(Math.random() * scores.length)];
// };

const { width: screenWidth } = Dimensions.get('window');

export default function MainScreen() {
  const [score, setScore] = useState<number>(0); // Represents WQI
  const [detailedParams, setDetailedParams] = useState<WaterParameters | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Changed initial to false, ScoreCircle handles its own loading
  const [showDetailedView, setShowDetailedView] = useState<boolean>(false);

  const offsetX = useSharedValue(0); // 0 for main screen, -screenWidth for detailed view
  const PAN_ACTIVATION_THRESHOLD = 20; // Increased threshold for screen-wide swipe

  useEffect(() => {
    // No initial data loading here, ScoreCircle will fetch and update.
    // setLoading(true);
    // setLoading(false);
  }, []);

  const handleScoreUpdate = (newScore: number, parameters?: WaterParameters) => {
    setScore(newScore);
    if (parameters) {
      setDetailedParams(parameters);
    }
  };

  // const handleSwipeLeft = () => { // Replaced by panGesture logic
  //   if (detailedParams) { 
  //     setShowDetailedView(true);
  //     offsetX.value = withTiming(-screenWidth, { duration: 300, easing: Easing.out(Easing.quad) });
  //   } else {
  //     console.log("Detailed parameters not yet available for swipe.");
  //   }
  // };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-PAN_ACTIVATION_THRESHOLD, PAN_ACTIVATION_THRESHOLD])
    .activeOffsetY([-PAN_ACTIVATION_THRESHOLD * 5, PAN_ACTIVATION_THRESHOLD * 5]) // Be more lenient with vertical movement during horizontal swipe
    .onUpdate((event) => {
      if (showDetailedView) { // Swiping on Detailed View (to go back to Main)
        if (event.translationX > 0) { // Only allow right swipe
          offsetX.value = -screenWidth + event.translationX;
        }
      } else { // Swiping on Main View (to go to Detailed)
        if (event.translationX < 0) { // Only allow left swipe
          offsetX.value = event.translationX;
        }
      }
    })
    .onEnd((event) => {
      if (showDetailedView) { // Currently on Detailed View
        if (event.translationX > screenWidth * 0.3 && event.velocityX > 50) { // Swipe right to show Main
          offsetX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
          runOnJS(setShowDetailedView)(false);
        } else {
          offsetX.value = withTiming(-screenWidth, { duration: 150, easing: Easing.out(Easing.quad) }); // Snap back to detailed
        }
      } else { // Currently on Main View
        if (detailedParams && event.translationX < -screenWidth * 0.3 && event.velocityX < -50) { // Swipe left to show Detailed
          runOnJS(setShowDetailedView)(true); // Set state before animation for conditional rendering
          offsetX.value = withTiming(-screenWidth, { duration: 300, easing: Easing.out(Easing.quad) });
        } else {
          offsetX.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }); // Snap back to main
        }
      }
    });


  const animatedMainViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offsetX.value }],
    };
  });

  // New animated style for detailed view to ensure it's correctly positioned
  const animatedDetailedViewStyle = useAnimatedStyle(() => {
    return {
      width: screenWidth,
      height: '100%', // Ensure it takes full height
      position: 'absolute',
      top: 0,
      // The view starts off-screen to the right (screenWidth) and slides in based on offsetX
      // When offsetX is 0 (main view shown), translateX is screenWidth (off-screen right)
      // When offsetX is -screenWidth (detailed view shown), translateX is 0 (on-screen)
      transform: [{ translateX: offsetX.value + screenWidth }], 
      zIndex: 10, // Ensure it's above the main view when active
      backgroundColor: '#E6F3FF', // Match background
    };
  });


  const backgroundColor = '#E6F3FF';

  // Adjusted loading condition
  if (loading) { 
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <Text style={styles.loadingText}>Завантаження екрану...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>{/* Added GestureHandlerRootView */}
      <GestureDetector gesture={panGesture}>{/* Added GestureDetector wrapping the content */}
        <View style={[styles.rootContainer, { backgroundColor }]}>
          <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} backgroundColor={backgroundColor} />
          <SafeAreaView style={styles.safeAreaContent}>
            {/* Container for the main view (ScoreCircle) */}
            <Animated.View style={[styles.flippableView, animatedMainViewStyle]}>
              <View style={styles.mainContentContainer}>
                <View style={styles.headerContainer}>
                  <Text style={styles.mainTitle}>Water Check</Text>
                  <Text style={styles.subtitle}>Щоденний моніторинг якості води</Text>
                </View>
                <ScoreCircle 
                  initialScore={score} 
                  onScoreUpdate={handleScoreUpdate} 
                  // onSwipeLeft prop is removed from ScoreCircle, swipe handled by this screen
                />
                <View style={styles.spacer} />
              </View>
            </Animated.View>

            {/* Detailed Parameters View - positioned absolutely and animated */}
            {/* Always render DetailedParametersView for smoother animation */}
            <Animated.View style={animatedDetailedViewStyle}>
              <DetailedParametersView parameters={detailedParams} />
            </Animated.View>
            {/* {showDetailedView && (
              <Animated.View style={animatedDetailedViewStyle}>
                <DetailedParametersView parameters={detailedParams} />
              </Animated.View>
            )} */}
          </SafeAreaView>
          <WaveAnimation score={score} />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    overflow: 'hidden', 
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
    zIndex: 100, // zIndex might not be needed here if detailed view handles its own
  },
  flippableView: { // Style for the main view that slides
    width: screenWidth,
    flex: 1, // Ensure it takes up space
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
