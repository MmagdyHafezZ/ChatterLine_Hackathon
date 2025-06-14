import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";

interface ExpoGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: "light" | "dark" | "default";
}

const ExpoGlassCard: React.FC<ExpoGlassCardProps> = ({
  children,
  style,
  intensity = 20,
  tint = "default",
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Animated.View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0.2)",
          "rgba(255, 255, 255, 0.05)",
          "rgba(255,255,255,0.2)",
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={styles.content}>{children}</Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.outline ?? "rgba(255,255,255,0.15)",
      ...theme.shadows.md,
    },
    content: {
      padding: theme.spacing.md,
    },
  });

export default ExpoGlassCard;
