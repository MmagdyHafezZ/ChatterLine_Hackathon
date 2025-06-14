import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const VISUALIZER_SIZE = width * 0.6;

interface ExpoVoiceVisualizerProps {
  isActive: boolean;
  sentiment: number; // -1 to 1
}

const ExpoVoiceVisualizer: React.FC<ExpoVoiceVisualizerProps> = ({
  isActive,
  sentiment,
}) => {
  const theme = useTheme();
  const waveAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Trigger haptic feedback when starting
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      waveAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );

      pulseAnimation.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );

      rotation.value = withRepeat(
        withTiming(360, { duration: 8000 }),
        -1,
        false
      );
    } else {
      waveAnimation.value = withTiming(0, { duration: 500 });
      pulseAnimation.value = withTiming(1, { duration: 500 });
      rotation.value = withTiming(0, { duration: 500 });
    }
  }, [isActive]);

  const getSentimentColor = () => {
    if (sentiment > 0.3) return theme.colors.success;
    if (sentiment < -0.3) return theme.colors.negative;
    return theme.colors.neutral;
  };

  // Generate wave circles with enhanced animations
  const waveCircles = Array.from({ length: 12 }, (_, i) => {
    const circleStyle = useAnimatedStyle(() => {
      const delay = i * 0.08;
      const scale = interpolate(
        waveAnimation.value,
        [0, 1],
        [0.3, 1.8 + i * 0.15],
        "clamp"
      );

      const opacity = interpolate(
        waveAnimation.value,
        [delay, delay + 0.2, delay + 0.6, 1],
        [0, 0.9, 0.4, 0],
        "clamp"
      );

      return {
        transform: [
          { scale: scale * pulseAnimation.value },
          { rotate: `${rotation.value / (i + 1)}deg` },
        ],
        opacity: isActive ? opacity : 0,
      };
    });

    return (
      <Animated.View
        key={i}
        style={[
          styles.waveCircle,
          {
            borderColor: getSentimentColor(),
            borderWidth: Math.max(1, 3 - i * 0.2),
            width: 60 + i * 8,
            height: 60 + i * 8,
            borderRadius: 30 + i * 4,
          },
          circleStyle,
        ]}
      />
    );
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 0.1}deg` }],
  }));

  const centerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.visualizer, containerStyle]}>
        {waveCircles}

        {/* Enhanced center pulse with gradient */}
        <Animated.View style={[styles.centerPulse, centerPulseStyle]}>
          <Svg width={80} height={80}>
            <Defs>
              <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                <Stop
                  offset="0%"
                  stopColor={getSentimentColor()}
                  stopOpacity="1"
                />
                <Stop
                  offset="70%"
                  stopColor={getSentimentColor()}
                  stopOpacity="0.6"
                />
                <Stop
                  offset="100%"
                  stopColor={getSentimentColor()}
                  stopOpacity="0.1"
                />
              </RadialGradient>
            </Defs>
            <Circle cx={40} cy={40} r={35} fill="url(#centerGrad)" />
            <Circle
              cx={40}
              cy={40}
              r={20}
              fill={getSentimentColor()}
              opacity={0.8}
            />
          </Svg>
        </Animated.View>

        {/* Sentiment indicator particles */}
        {isActive &&
          Array.from({ length: 6 }, (_, i) => {
            const particleStyle = useAnimatedStyle(() => {
              const angle = i * 60 + rotation.value;
              const radius =
                80 + Math.sin(waveAnimation.value * Math.PI * 2) * 20;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return {
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { scale: pulseAnimation.value * 0.5 },
                ],
                opacity: waveAnimation.value,
              };
            });

            return (
              <Animated.View
                key={`particle-${i}`}
                style={[
                  styles.sentimentParticle,
                  { backgroundColor: getSentimentColor() },
                  particleStyle,
                ]}
              />
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
      justifyContent: "center",
      height: VISUALIZER_SIZE + 100,
      marginVertical: theme.spacing.lg,
    },
    visualizer: {
      width: VISUALIZER_SIZE,
      height: VISUALIZER_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    waveCircle: {
      position: "absolute",
      borderWidth: 2,
    },
    centerPulse: {
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 40,
    },
    sentimentParticle: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });

export default ExpoVoiceVisualizer;
