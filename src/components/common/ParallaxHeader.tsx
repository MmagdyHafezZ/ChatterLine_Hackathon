import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 100;

interface ParallaxHeaderProps {
  title: string;
  subtitle: string;
  scrollY: Animated.SharedValue<number>;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const ParallaxHeader: React.FC<ParallaxHeaderProps> = ({
  title,
  subtitle,
  scrollY,
  showBackButton = false,
  onBackPress,
}) => {
  const theme = useTheme();

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
      [1, 0.9, 0.7],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -20],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 3],
      [0.8, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle]}>
        <LinearGradient
          colors={[
            `${theme.colors.primary}20`,
            `${theme.colors.primaryContainer}10`,
            "transparent",
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, headerStyle]}>
        <View style={styles.textContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_HEIGHT,
      zIndex: 1000,
    },
    content: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: 24,
      paddingBottom: 16,
      paddingTop: 50, // Status bar space
    },
    textContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: "400",
    },
  });

export default ParallaxHeader;
