import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const SplashScreen: React.FC = () => {
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(50);
  const backgroundScale = useSharedValue(1);

  useEffect(() => {
    // Logo animation
    logoScale.value = withDelay(
      500,
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    logoRotation.value = withDelay(500, withTiming(360, { duration: 1000 }));

    // Text animation
    textOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(1000, withSpring(0));

    // Background pulse
    backgroundScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      )
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle]}>
        <LinearGradient
          colors={["#6200EA", "#3700B3", "#000051"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          {/* <LottieView
            source={require("../../assets/animations/ai-logo.json")}
            autoPlay
            loop={false}
            style={styles.logo}
          /> */}
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text variant="displayMedium" style={styles.title}>
            AI Call Assistant
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your intelligent conversation partner
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter-Black",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
});

export default SplashScreen;
