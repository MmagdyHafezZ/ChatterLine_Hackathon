import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface ExpoFloatingControlsProps {
  onEndCall: () => void;
  onMute: () => void;
  onSpeaker: () => void;
  isProcessing: boolean;
  audioLoading: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
}

const ExpoFloatingControls: React.FC<ExpoFloatingControlsProps> = ({
  onEndCall,
  onMute,
  onSpeaker,
  isProcessing,
  audioLoading,
  isMuted,
  isSpeakerOn,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const endCallScale = useSharedValue(1);
  const muteScale = useSharedValue(1);
  const speakerScale = useSharedValue(1);

  const handleEndCall = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    endCallScale.value = withTiming(0.8, { duration: 100 }, () => {
      endCallScale.value = withSpring(1);
    });
    onEndCall();
  };

  const handleMute = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    muteScale.value = withTiming(0.9, { duration: 100 }, () => {
      muteScale.value = withSpring(1);
    });
    onMute();
  };

  const handleSpeaker = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    speakerScale.value = withTiming(0.9, { duration: 100 }, () => {
      speakerScale.value = withSpring(1);
    });
    onSpeaker();
  };

  const muteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: muteScale.value }],
  }));

  const endCallStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endCallScale.value }],
  }));

  const speakerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakerScale.value }],
  }));

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <BlurView
        intensity={80}
        tint={theme.dark ? "dark" : "light"}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[`${theme.colors.surface}F0`, `${theme.colors.surface}CC`]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.controls}>
        {/* Mute Button */}
        <Animated.View style={muteStyle}>
          <Pressable
            onPress={handleMute}
            style={[
              styles.controlButton,
              {
                backgroundColor: isMuted
                  ? theme.colors.error
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton
              icon={isMuted ? "microphone-off" : "microphone"}
              size={24}
              iconColor={
                isMuted ? theme.colors.onError : theme.colors.onSurfaceVariant
              }
              style={styles.iconButton}
            />
          </Pressable>
        </Animated.View>

        {/* End Call Button */}
        <Animated.View style={endCallStyle}>
          <Pressable
            onPress={handleEndCall}
            disabled={isProcessing}
            style={[styles.endCallButton, { opacity: isProcessing ? 0.6 : 1 }]}
          >
            <LinearGradient
              colors={[theme.colors.error, "#D32F2F"]}
              style={styles.endCallGradient}
            >
              <IconButton
                icon="phone-hangup"
                size={28}
                iconColor={theme.colors.onError}
                style={styles.iconButton}
              />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Speaker Button */}
        <Animated.View style={speakerStyle}>
          <Pressable
            onPress={handleSpeaker}
            style={[
              styles.controlButton,
              {
                backgroundColor: isSpeakerOn
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton
              icon={isSpeakerOn ? "volume-high" : "volume-medium"}
              size={24}
              iconColor={
                isSpeakerOn
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
              style={styles.iconButton}
            />
          </Pressable>
        </Animated.View>
      </View>

      {/* Loading indicator */}
      {audioLoading && (
        <View style={styles.loadingContainer}>
          <AnimatedLoadingDot delay={0} style={styles.loadingDot} />
          <AnimatedLoadingDot delay={100} style={styles.loadingDot} />
          <AnimatedLoadingDot delay={200} style={styles.loadingDot} />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      height: 100,
      borderRadius: 25,
      overflow: "hidden",
      ...theme.shadows.lg,
    },
    controls: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadows.sm,
    },
    endCallButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      overflow: "hidden",
      ...theme.shadows.md,
    },
    endCallGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    iconButton: {
      margin: 0,
    },
    loadingContainer: {
      position: "absolute",
      top: 8,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      opacity: 0.6,
    },
  });

interface AnimatedLoadingDotProps {
  delay: number;
  style?: any;
}

const AnimatedLoadingDot: React.FC<AnimatedLoadingDotProps> = ({
  delay,
  style,
}) => {
  const opacity = useSharedValue(0.6);

  React.useEffect(() => {
    const animate = () => {
      opacity.value = withTiming(1, { duration: 400 }, () => {
        opacity.value = withTiming(0.6, { duration: 400 }, animate);
      });
    };
    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
};

export default ExpoFloatingControls;
