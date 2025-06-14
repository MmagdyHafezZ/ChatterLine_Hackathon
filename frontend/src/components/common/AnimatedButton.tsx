import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Button, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  mode?: "text" | "outlined" | "contained" | "elevated" | "contained-tonal";
  disabled?: boolean;
  icon?: string;
  style?: any;
  loading?: boolean;
  gradient?: boolean;
  haptic?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  mode = "contained",
  disabled = false,
  icon,
  style,
  loading = false,
  gradient = false,
  haptic = true,
  ...props
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15 });
      rotation.value = withTiming(2, { duration: 100 });

      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15 });
      rotation.value = withSpring(0);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      // Enhanced press animation
      scale.value = withTiming(1.05, { duration: 100 }, () => {
        scale.value = withSpring(1);
      });

      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      runOnJS(onPress)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: disabled ? 0.6 : opacity.value,
  }));

  const styles = createStyles(theme);

  if (gradient && mode === "contained") {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.gradientButton}
          disabled={disabled || loading}
        >
          <LinearGradient
            colors={
              theme.colors.primaryGradient || [
                theme.colors.primary,
                theme.colors.primary,
              ]
            }
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Button
              mode="text"
              icon={icon}
              textColor={theme.colors.onPrimary}
              style={styles.transparentButton}
              loading={loading}
              disabled={disabled}
              {...props}
            >
              {children}
            </Button>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Button
        mode={mode}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        icon={icon}
        style={styles.button}
        loading={loading}
        {...props}
      >
        {children}
      </Button>
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    button: {
      borderRadius: 12,
    },
    gradientButton: {
      borderRadius: 12,
      overflow: "hidden",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    gradientBackground: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    transparentButton: {
      backgroundColor: "transparent",
      margin: 0,
    },
  });

export default AnimatedButton;
