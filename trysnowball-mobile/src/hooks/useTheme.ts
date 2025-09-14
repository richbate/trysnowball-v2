import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { theme } from '../theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const themeColors = isDarkMode ? colors.dark : colors.light;
  
  return {
    isDarkMode,
    colors: themeColors,
    colorScheme,
    fonts,
    ...theme,
  };
};