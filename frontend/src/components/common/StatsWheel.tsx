import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { CircularProgress } from "react-native-circular-progress";
import { CallMetrics } from "../../types";

const { width } = Dimensions.get("window");
const WHEEL_SIZE = width * 0.8;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = CENTER - 40;

interface StatsWheelProps {
  metrics: CallMetrics;
}

const StatsWheel: React.FC<StatsWheelProps> = ({ metrics }) => {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(300, withTiming(1, { duration: 800 }));
    rotation.value = withTiming(360, { duration: 2000 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const styles = createStyles(theme);

  const statsData = [
    {
      label: "Streak",
      value: metrics.streak,
      max: 30,
      color: theme.colors.primary,
      icon: "🔥",
    },
    {
      label: "Calls",
      value: metrics.totalCalls,
      max: 100,
      color: theme.colors.secondary,
      icon: "📞",
    },
    {
      label: "Minutes",
      value: metrics.totalMinutes,
      max: 1000,
      color: theme.colors.tertiary,
      icon: "⏱️",
    },
    {
      label: "Rate",
      value: Math.round(metrics.completionRate * 100),
      max: 100,
      color: theme.colors.accent,
      icon: "✅",
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wheel, containerStyle]}>
        {statsData.map((stat, index) => {
          const angle = index * 90 - 45; // Position around the circle
          const x = CENTER + RADIUS * 0.7 * Math.cos((angle * Math.PI) / 180);
          const y = CENTER + RADIUS * 0.7 * Math.sin((angle * Math.PI) / 180);

          return (
            <Animated.View
              key={stat.label}
              style={[
                styles.statItem,
                {
                  left: x - 40,
                  top: y - 40,
                },
              ]}
            >
              <CircularProgress
                size={80}
                width={6}
                fill={(stat.value / stat.max) * 100}
                tintColor={stat.color}
                backgroundColor={theme.colors.surfaceVariant}
                rotation={0}
              >
                {() => (
                  <View style={styles.statContent}>
                    <Text style={styles.statIcon}>{stat.icon}</Text>
                    <Text
                      variant="bodyLarge"
                      style={[styles.statValue, { color: stat.color }]}
                    >
                      {stat.value}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      {stat.label}
                    </Text>
                  </View>
                )}
              </CircularProgress>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginVertical: theme.spacing.xl,
    },
    wheel: {
      width: WHEEL_SIZE,
      height: WHEEL_SIZE,
      position: "relative",
    },
    statItem: {
      position: "absolute",
      width: 80,
      height: 80,
    },
    statContent: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    statIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    statValue: {
      fontWeight: "700",
      fontSize: 16,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      textAlign: "center",
    },
  });

export default StatsWheel;
