import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { isDarkMode } = useTheme();
  const backgroundColor = isDarkMode 
    ? (darkColor || Colors.dark.background)
    : (lightColor || Colors.light.background);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
