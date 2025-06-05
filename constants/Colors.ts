/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4A90E2';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    success: '#28a745',
    error: '#dc3545',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1a1d29',
    tint: tintColorDark,
    icon: '#8E9AAF',
    tabIconDefault: '#8E9AAF',
    tabIconSelected: tintColorDark,
    success: '#4CAF50',
    error: '#F44336',
  },
};
