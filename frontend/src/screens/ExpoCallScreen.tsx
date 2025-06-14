// src/screens/CallScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Dimensions, Alert, ScrollView } from "react-native";
import { Text, useTheme, ActivityIndicator } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";

import { useCallStore } from "../store/callStore";
import { useUserStore } from "../store/userStore";
import { useExpoAudioPlayer } from "../hooks/useExpoAudioPlayer";
import { useCallMetrics } from "../hooks/useCallMertics";
import { useExpoNotifications } from "../hooks/useExpoNotifications";
import {
  generateAIResponse,
  analyzeSentiment,
  generateCallSummary,
} from "../utils/api";
import { CallMessage } from "../types";
import ExpoGlassCard from "../components/common/ExpoGlassCard";
import AnimatedButton from "../components/common/AnimatedButton";
import ExpoVoiceVisualizer from "../components/CallUI/ExpoVoiceVisualizer";
import ExpoFloatingControls from "../components/CallUI/ExpoFloatingControls";
import ParallaxHeader from "../components/common/ParallaxHeader";
import ParticleBackground from "../components/animations/ParticleBackground";

const { width, height } = Dimensions.get("window");

const CallScreen: React.FC = () => {
  const theme = useTheme();
  const { profile } = useUserStore();
  const {
    currentSession,
    startSession,
    endSession,
    addMessage,
    updateSessionMetrics,
    setSessionSummary,
    getUpcomingEvents,
  } = useCallStore();

  const {
    playText,
    isPlaying,
    isLoading: audioLoading,
    stopAudio,
  } = useExpoAudioPlayer();
  const {
    recordMessage,
    getAverageResponseTime,
    getWordsPerMinute,
    getAverageSentiment,
    getCallDuration,
    resetMetrics,
  } = useCallMetrics();
  const { sendCallEndNotification } = useExpoNotifications();

  const [isCallActive, setIsCallActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Animation values
  const callAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const floatingControlsY = useSharedValue(height);
  const scrollY = useSharedValue(0);

  const upcomingEvents = getUpcomingEvents();
  const nextEvent = upcomingEvents[0];

  useEffect(() => {
    if (isCallActive) {
      callAnimation.value = withTiming(1, { duration: 800 });
      floatingControlsY.value = withSpring(height - 200);

      // Enhanced pulse animation for active call
      const animatePulse = () => {
        pulseAnimation.value = withTiming(1.05, { duration: 1000 }, () => {
          pulseAnimation.value = withTiming(1, { duration: 1000 }, () => {
            if (isCallActive) {
              runOnJS(animatePulse)();
            }
          });
        });
      };
      animatePulse();
    } else {
      callAnimation.value = withTiming(0, { duration: 500 });
      floatingControlsY.value = withSpring(height);
      pulseAnimation.value = 1;
    }
  }, [isCallActive]);

  const startCall = useCallback(async () => {
    if (!profile) {
      Alert.alert("Profile Required", "Please complete your profile first", [
        { text: "OK", style: "default" },
      ]);
      return;
    }

    if (!nextEvent) {
      Alert.alert("No Calls Scheduled", "Please schedule a call first", [
        { text: "OK", style: "default" },
      ]);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsCallActive(true);
    setCallStartTime(new Date());
    startSession(nextEvent.id);
    resetMetrics();

    // Enhanced AI greeting based on persona
    const greetings = {
      friendly:
        "Hi there! I'm so excited to help you with your call today. What would you like to talk about?",
      formal:
        "Good day. I am ready to assist you with your scheduled call. How may I help you today?",
      funny:
        "Hey! Your AI buddy is here and ready to make this call absolutely amazing. What's on your mind?",
    };

    const greeting = greetings[profile.voicePersona as keyof typeof greetings];
    const greetingMessage: Omit<CallMessage, "id" | "timestamp"> = {
      content: greeting,
      sender: "ai",
      sentiment: "positive",
      confidence: 0.9,
    };

    addMessage(greetingMessage);
    recordMessage({ ...greetingMessage, id: "temp", timestamp: new Date() });

    // Play greeting with enhanced voice
    if (!isMuted) {
      playText(greeting, profile.voicePersona);
    }
  }, [
    profile,
    nextEvent,
    startSession,
    resetMetrics,
    addMessage,
    recordMessage,
    playText,
    isMuted,
  ]);

  const endCall = useCallback(async () => {
    if (!currentSession || !profile) return;

    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Stop any current audio
      await stopAudio();

      // Generate enhanced call summary
      const messages = currentSession.messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const summaryResult = await generateCallSummary(messages);

      if (summaryResult.success && summaryResult.data) {
        setSessionSummary(
          summaryResult.data.summary,
          summaryResult.data.actionItems
        );
      }

      const duration = getCallDuration() / 60; // Convert to minutes

      await sendCallEndNotification(nextEvent?.title || "Call", duration);

      endSession();
      setIsCallActive(false);
      setCallStartTime(null);

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "✅ Call Completed!",
        "Your call summary has been generated. Great conversation!",
        [{ text: "Awesome!", style: "default" }]
      );
    } catch (error) {
      console.error("Error ending call:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to complete call summary.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    currentSession,
    profile,
    setSessionSummary,
    endSession,
    sendCallEndNotification,
    nextEvent,
    stopAudio,
    getCallDuration,
  ]);

  const handleMute = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMuted(!isMuted);

    if (!isMuted) {
      await stopAudio();
    }
  }, [isMuted, stopAudio]);

  const handleSpeaker = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSpeakerOn(!isSpeakerOn);
  }, [isSpeakerOn]);

  const sendTestMessage = useCallback(async () => {
    if (!currentSession || !profile || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: Omit<CallMessage, "id" | "timestamp"> = {
      content:
        "Can you help me understand the key points we should cover in this call?",
      sender: "user",
      sentiment: "neutral",
      confidence: 0.8,
    };

    addMessage(userMessage);
    recordMessage({ ...userMessage, id: "temp", timestamp: new Date() });

    try {
      // Analyze sentiment of user message
      const sentimentResult = await analyzeSentiment(userMessage.content);
      if (sentimentResult.success && sentimentResult.data) {
        // Update message with sentiment analysis
        const updatedUserMessage = {
          ...userMessage,
          sentiment: sentimentResult.data.sentiment,
          confidence: sentimentResult.data.confidence,
        };
        recordMessage({
          ...updatedUserMessage,
          id: "temp",
          timestamp: new Date(),
        });
      }

      // Generate AI response
      const messages = currentSession.messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      messages.push({ role: "user", content: userMessage.content });

      const aiResponse = await generateAIResponse(
        messages,
        profile.voicePersona
      );

      if (aiResponse.success && aiResponse.data) {
        const aiMessage: Omit<CallMessage, "id" | "timestamp"> = {
          content: aiResponse.data,
          sender: "ai",
          sentiment: "positive",
          confidence: 0.9,
        };

        addMessage(aiMessage);
        recordMessage({ ...aiMessage, id: "temp", timestamp: new Date() });

        // Analyze AI response sentiment
        const aiSentimentResult = await analyzeSentiment(aiResponse.data);
        if (aiSentimentResult.success && aiSentimentResult.data) {
          const updatedAiMessage = {
            ...aiMessage,
            sentiment: aiSentimentResult.data.sentiment,
            confidence: aiSentimentResult.data.confidence,
          };
          recordMessage({
            ...updatedAiMessage,
            id: "temp",
            timestamp: new Date(),
          });
        }

        // Play AI response if not muted
        if (!isMuted) {
          playText(aiResponse.data, profile.voicePersona);
        }

        // Update session metrics
        updateSessionMetrics({
          averageResponseTime: getAverageResponseTime(),
          wordsPerMinute: getWordsPerMinute(),
          sentimentScore: getAverageSentiment(),
          messageCount: currentSession.messages.length + 2, // +2 for the new messages
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      Alert.alert("Error", "Failed to process your message. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    currentSession,
    profile,
    isProcessing,
    addMessage,
    recordMessage,
    isMuted,
    playText,
    updateSessionMetrics,
    getAverageResponseTime,
    getWordsPerMinute,
    getAverageSentiment,
  ]);

  const formatCallDuration = useCallback(() => {
    const duration = getCallDuration();
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [getCallDuration]);

  // Animated styles
  const callButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const immersiveStyle = useAnimatedStyle(() => ({
    opacity: callAnimation.value,
    transform: [{ scale: interpolate(callAnimation.value, [0, 1], [0.9, 1]) }],
  }));

  const floatingControlsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingControlsY.value }],
  }));

  const styles = createStyles(theme);

  // Profile required state
  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <LinearGradient
          colors={
            theme.colors.backgroundGradient || [
              theme.colors.background,
              theme.colors.surface,
            ]
          }
          style={StyleSheet.absoluteFillObject}
        />
        <ParticleBackground />
        <ExpoGlassCard style={styles.centerCard}>
          <View style={styles.centerContent}>
            {/* <LottieView
              source={require("../assets/animations/profile-needed.json")}
              autoPlay
              loop
              style={styles.errorAnimation}
            /> */}
            <Text variant="headlineSmall" style={styles.errorText}>
              Profile Required
            </Text>
            <Text variant="bodyMedium" style={styles.errorSubtext}>
              Please complete your profile to start making calls
            </Text>
            <AnimatedButton
              mode="contained"
              onPress={() => {
                /* Navigate to profile */
              }}
              style={styles.actionButton}
              gradient
            >
              Complete Profile
            </AnimatedButton>
          </View>
        </ExpoGlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        style={isCallActive ? "light" : theme.dark ? "light" : "dark"}
      />

      {/* Dynamic Background */}
      <LinearGradient
        colors={
          isCallActive
            ? ["#6200EA", "#3700B3", "#000051"]
            : theme.colors.backgroundGradient || [
                theme.colors.background,
                theme.colors.surface,
              ]
        }
        style={StyleSheet.absoluteFillObject}
      />

      <ParticleBackground />

      {/* Parallax Header - only show when not in call */}
      {!isCallActive && (
        <ParallaxHeader
          title="AI Call"
          subtitle="Ready when you are"
          scrollY={scrollY}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isCallActive ? (
          // Ready State - Before Call
          <Animated.View style={styles.readyState}>
            <ExpoGlassCard style={styles.mainCard} intensity={80}>
              <View style={styles.readyContent}>
                {/* <LottieView
                  source={require("../assets/animations/ready-to-call.json")}
                  autoPlay
                  loop
                  style={styles.readyAnimation}
                /> */}

                <Text variant="displaySmall" style={styles.title}>
                  Ready to Call
                </Text>

                {nextEvent ? (
                  <View style={styles.nextCallInfo}>
                    <Text variant="headlineSmall" style={styles.nextCallTitle}>
                      {nextEvent.title}
                    </Text>
                    <Text variant="bodyLarge" style={styles.nextCallTime}>
                      {new Date(nextEvent.scheduledTime).toLocaleString()}
                    </Text>
                    {nextEvent.description && (
                      <Text
                        variant="bodyMedium"
                        style={styles.nextCallDescription}
                      >
                        {nextEvent.description}
                      </Text>
                    )}
                    {nextEvent.participants.length > 0 && (
                      <Text variant="bodyMedium" style={styles.participants}>
                        📞 {nextEvent.participants.join(", ")}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.callDuration}>
                      ⏱️ {nextEvent.duration} minutes
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noCallsContainer}>
                    <Text variant="bodyLarge" style={styles.noCallsText}>
                      No scheduled calls
                    </Text>
                    <Text variant="bodyMedium" style={styles.noCallsSubtext}>
                      Visit the Scheduler to create one
                    </Text>
                  </View>
                )}

                <Animated.View style={callButtonStyle}>
                  <AnimatedButton
                    mode="contained"
                    onPress={startCall}
                    disabled={!nextEvent}
                    style={styles.callButton}
                    icon="phone"
                    gradient
                  >
                    Start Call
                  </AnimatedButton>
                </Animated.View>
              </View>
            </ExpoGlassCard>
          </Animated.View>
        ) : (
          // Active Call State
          <Animated.View style={[styles.activeCallContainer, immersiveStyle]}>
            {/* Call Header */}
            <View style={styles.callHeader}>
              <Text variant="headlineLarge" style={styles.callTitle}>
                AI Assistant Call
              </Text>
              <Text variant="bodyLarge" style={styles.callSubtitle}>
                Live conversation in progress
              </Text>
              <Text variant="bodyMedium" style={styles.callTimer}>
                {formatCallDuration()}
              </Text>
            </View>

            {/* Voice Visualizer */}
            <ExpoVoiceVisualizer
              isActive={isPlaying || audioLoading || isProcessing}
              sentiment={getAverageSentiment()}
            />

            {/* Live Metrics Card */}
            <ExpoGlassCard
              style={styles.metricsCard}
              intensity={60}
              tint="dark"
            >
              <Text variant="titleLarge" style={styles.metricsTitle}>
                Live Metrics
              </Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Response
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={[
                      styles.metricValue,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {Math.round(getAverageResponseTime() / 1000)}s
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    WPM
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={[
                      styles.metricValue,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    {Math.round(getWordsPerMinute())}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Messages
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={[
                      styles.metricValue,
                      { color: theme.colors.tertiary || theme.colors.primary },
                    ]}
                  >
                    {currentSession?.messages.length || 0}
                  </Text>
                </View>
              </View>

              {/* Sentiment Indicator */}
              <View style={styles.sentimentContainer}>
                <Text variant="bodySmall" style={styles.sentimentLabel}>
                  Conversation Sentiment
                </Text>
                <View style={styles.sentimentBar}>
                  <View
                    style={[
                      styles.sentimentFill,
                      {
                        width: `${Math.max(0, Math.min(100, (getAverageSentiment() + 1) * 50))}%`,
                        backgroundColor:
                          getAverageSentiment() > 0.3
                            ? "#4CAF50"
                            : getAverageSentiment() < -0.3
                              ? "#F44336"
                              : "#FF9800",
                      },
                    ]}
                  />
                </View>
              </View>
            </ExpoGlassCard>

            {/* Status Indicators */}
            {(audioLoading || isProcessing) && (
              <View style={styles.statusContainer}>
                {audioLoading && (
                  <ExpoGlassCard style={styles.statusCard} intensity={90}>
                    <View style={styles.statusItem}>
                      <ActivityIndicator size="small" color="white" />
                      <Text variant="bodyMedium" style={styles.statusText}>
                        Generating voice...
                      </Text>
                    </View>
                  </ExpoGlassCard>
                )}

                {isProcessing && (
                  <ExpoGlassCard style={styles.statusCard} intensity={90}>
                    <View style={styles.statusItem}>
                      <ActivityIndicator size="small" color="white" />
                      <Text variant="bodyMedium" style={styles.statusText}>
                        AI is thinking...
                      </Text>
                    </View>
                  </ExpoGlassCard>
                )}
              </View>
            )}

            {/* Demo Interaction Button */}
            <AnimatedButton
              mode="outlined"
              onPress={sendTestMessage}
              disabled={isProcessing}
              style={styles.testButton}
              icon="message"
            >
              Continue Conversation
            </AnimatedButton>

            {/* Recent Messages Preview */}
            {currentSession && currentSession.messages.length > 0 && (
              <ExpoGlassCard style={styles.messagesCard} intensity={40}>
                <Text variant="titleMedium" style={styles.messagesTitle}>
                  Recent Messages
                </Text>
                {currentSession.messages.slice(-3).map((message, index) => (
                  <View key={index} style={styles.messageItem}>
                    <Text variant="bodySmall" style={styles.messageSender}>
                      {message.sender === "user" ? "👤 You" : "🤖 AI"}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={styles.messageContent}
                      numberOfLines={2}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}
              </ExpoGlassCard>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Controls for Active Call */}
      {isCallActive && (
        <Animated.View style={[styles.floatingControls, floatingControlsStyle]}>
          <ExpoFloatingControls
            onEndCall={endCall}
            onMute={handleMute}
            onSpeaker={handleSpeaker}
            isProcessing={isProcessing}
            audioLoading={audioLoading}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
          />
        </Animated.View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      padding: 16,
      paddingTop: 60,
      paddingBottom: 120, // Account for floating controls
    },
    centerCard: {
      flex: 1,
      margin: 16,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    errorAnimation: {
      width: 120,
      height: 120,
      marginBottom: 24,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 8,
      textAlign: "center",
    },
    errorSubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 32,
    },
    actionButton: {
      minWidth: 200,
    },
    readyState: {
      flex: 1,
    },
    mainCard: {
      flex: 1,
    },
    readyContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    readyAnimation: {
      width: 150,
      height: 150,
      marginBottom: 24,
    },
    title: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Black",
      textAlign: "center",
      marginBottom: 32,
    },
    nextCallInfo: {
      alignItems: "center",
      marginBottom: 32,
      padding: 24,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 16,
      width: "100%",
    },
    nextCallTitle: {
      color: theme.colors.onPrimaryContainer,
      fontFamily: "Inter-Bold",
      marginBottom: 8,
      textAlign: "center",
    },
    nextCallTime: {
      color: theme.colors.onPrimaryContainer,
      marginBottom: 8,
      textAlign: "center",
    },
    nextCallDescription: {
      color: theme.colors.onPrimaryContainer,
      marginBottom: 8,
      textAlign: "center",
      opacity: 0.8,
    },
    participants: {
      color: theme.colors.onPrimaryContainer,
      textAlign: "center",
      marginBottom: 4,
    },
    callDuration: {
      color: theme.colors.onPrimaryContainer,
      textAlign: "center",
      opacity: 0.7,
    },
    noCallsContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    noCallsText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 8,
    },
    noCallsSubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      fontSize: 12,
    },
    callButton: {
      paddingHorizontal: 32,
      paddingVertical: 8,
      minWidth: 180,
    },
    activeCallContainer: {
      flex: 1,
      gap: 16,
    },
    callHeader: {
      alignItems: "center",
      marginBottom: 24,
    },
    callTitle: {
      color: "white",
      fontFamily: "Inter-Black",
      textAlign: "center",
      marginBottom: 8,
    },
    callSubtitle: {
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      marginBottom: 4,
    },
    callTimer: {
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      fontFamily: "Inter-Bold",
    },
    metricsCard: {
      padding: 24,
    },
    metricsTitle: {
      color: "white",
      fontFamily: "Inter-Bold",
      marginBottom: 24,
      textAlign: "center",
    },
    metricsGrid: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 16,
    },
    metricItem: {
      alignItems: "center",
      flex: 1,
    },
    metricLabel: {
      color: "rgba(255, 255, 255, 0.7)",
      marginBottom: 4,
      textAlign: "center",
    },
    metricValue: {
      fontFamily: "Inter-Bold",
    },
    sentimentContainer: {
      alignItems: "center",
    },
    sentimentLabel: {
      color: "rgba(255, 255, 255, 0.7)",
      marginBottom: 8,
    },
    sentimentBar: {
      width: "100%",
      height: 6,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 3,
      overflow: "hidden",
    },
    sentimentFill: {
      height: "100%",
      borderRadius: 3,
    },
    statusContainer: {
      alignItems: "center",
      gap: 12,
    },
    statusCard: {
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    statusItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusText: {
      color: "rgba(255, 255, 255, 0.9)",
      fontFamily: "Inter-Regular",
    },
    testButton: {
      alignSelf: "center",
      marginTop: 16,
    },
    messagesCard: {
      padding: 16,
      marginTop: 16,
    },
    messagesTitle: {
      color: "white",
      fontFamily: "Inter-Bold",
      marginBottom: 12,
      textAlign: "center",
    },
    messageItem: {
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    messageSender: {
      color: "rgba(255, 255, 255, 0.7)",
      marginBottom: 4,
    },
    messageContent: {
      color: "white",
    },
    floatingControls: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 0,
    },
  });

export default CallScreen;
