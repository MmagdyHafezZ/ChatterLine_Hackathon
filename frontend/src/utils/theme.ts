import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const createEnhancedTheme = (baseTheme: any, isDark: boolean) => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    // Enhanced primary palette with gradients
    primary: isDark ? "#BB86FC" : "#6200EA",
    primaryGradient: isDark ? ["#BB86FC", "#3700B3"] : ["#6200EA", "#3700B3"],
    secondary: isDark ? "#03DAC6" : "#018786",
    secondaryGradient: isDark ? ["#03DAC6", "#018786"] : ["#018786", "#00695C"],

    // Glass morphism colors
    glass: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    glassBorder: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",

    // Enhanced surface colors
    surfaceElevated: isDark ? "#2D2D30" : "#FAFAFA",
    surfaceFloating: isDark
      ? "rgba(45, 45, 48, 0.9)"
      : "rgba(250, 250, 250, 0.9)",

    // Emotional colors for sentiment
    positive: "#4CAF50",
    negative: "#F44336",
    neutral: "#FF9800",

    // Accent colors for notifications and status
    accent: isDark ? "#FFB74D" : "#FF8F00",
    warning: "#FF9800",
    info: "#2196F3",
    success: "#4CAF50",

    // Gradient backgrounds
    backgroundGradient: isDark
      ? ["#121212", "#1E1E1E", "#2D2D30"]
      : ["#FAFAFA", "#F5F5F5", "#EEEEEE"],
  },

  // Enhanced typography with custom fonts
  fonts: {
    ...baseTheme.fonts,
    regular: {
      fontFamily: "Inter-Regular",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "Inter-Bold",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "Inter-Bold",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "Inter-Black",
      fontWeight: "900",
    },
  },

  // Enhanced spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Enhanced border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Animation durations
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },

  // Shadows for depth
  shadows: {
    sm: {
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
});

export const enhancedLightTheme = createEnhancedTheme(MD3LightTheme, false);
export const enhancedDarkTheme = createEnhancedTheme(MD3DarkTheme, true);
