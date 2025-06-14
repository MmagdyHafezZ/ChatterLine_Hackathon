import React, { useEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const { width, height } = Dimensions.get("window");
const PARTICLE_COUNT = 25;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const ParticleBackground: React.FC = () => {
  const theme = useTheme();
  const animationProgress = useSharedValue(0);
  const colorAnimation = useSharedValue(0);

  // Generate particles with enhanced properties
  const particles: Particle[] = Array.from(
    { length: PARTICLE_COUNT },
    (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.4 + 0.2,
      color:
        i % 3 === 0
          ? theme.colors.primary
          : i % 3 === 1
            ? theme.colors.secondary
            : theme.colors.tertiary || theme.colors.accent,
    })
  );

  useEffect(() => {
    // Main animation loop
    animationProgress.value = withRepeat(
      withTiming(1, { duration: 25000 }),
      -1,
      false
    );

    // Color cycling animation
    colorAnimation.value = withRepeat(
      withTiming(1, { duration: 10000 }),
      -1,
      true
    );
  }, []);

  const ParticleComponent = ({ particle }: { particle: Particle }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        animationProgress.value,
        [0, 1],
        [particle.y, particle.y - height - 150]
      );

      const opacity = interpolate(
        animationProgress.value,
        [0, 0.1, 0.9, 1],
        [0, particle.opacity, particle.opacity, 0]
      );

      // Add subtle horizontal drift
      const translateX = interpolate(
        animationProgress.value,
        [0, 1],
        [particle.x, particle.x + Math.sin(particle.id) * 50]
      );

      // Scale animation based on distance
      const scale = interpolate(
        animationProgress.value,
        [0, 0.5, 1],
        [0.5, 1.2, 0.3]
      );

      return {
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
      };
    });

    const colorStyle = useAnimatedStyle(() => {
      const colorIntensity = interpolate(
        colorAnimation.value,
        [0, 0.5, 1],
        [0.6, 1, 0.6]
      );

      return {
        opacity: colorIntensity,
      };
    });

    return (
      <Animated.View style={[styles.particle, animatedStyle]}>
        <Animated.View style={colorStyle}>
          <Svg width={particle.size * 2} height={particle.size * 2}>
            <Defs>
              <RadialGradient
                id={`grad${particle.id}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <Stop
                  offset="0%"
                  stopColor={particle.color}
                  stopOpacity="0.9"
                />
                <Stop
                  offset="50%"
                  stopColor={particle.color}
                  stopOpacity="0.5"
                />
                <Stop
                  offset="100%"
                  stopColor={particle.color}
                  stopOpacity="0"
                />
              </RadialGradient>
            </Defs>
            <Circle
              cx={particle.size}
              cy={particle.size}
              r={particle.size}
              fill={`url(#grad${particle.id})`}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
  },
});

export default ParticleBackground;
