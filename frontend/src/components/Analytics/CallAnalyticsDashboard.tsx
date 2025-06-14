import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, useTheme, SegmentedButtons } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { LineChart, BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { useCallStore } from "../../store/callStore";
import ExpoGlassCard from "../common/ExpoGlassCard";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;

interface AnalyticsData {
  totalCalls: number;
  totalMinutes: number;
  averageRating: number;
  completionRate: number;
  peakCallTimes: { hour: number; count: number }[];
  sentimentTrends: { date: string; sentiment: number }[];
  callDurationTrends: { date: string; duration: number }[];
  topParticipants: { name: string; count: number }[];
}

const CallAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const { sessions, events } = useCallStore();
  const [timeRange, setTimeRange] = useState("week");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  const fadeInValue = useSharedValue(0);

  useEffect(() => {
    calculateAnalytics();
    fadeInValue.value = withTiming(1, { duration: 800 });
  }, [timeRange, sessions, events]);

  const calculateAnalytics = useCallback(() => {
    const now = dayjs();
    let startDate: dayjs.Dayjs;

    switch (timeRange) {
      case "week":
        startDate = now.subtract(7, "days");
        break;
      case "month":
        startDate = now.subtract(30, "days");
        break;
      case "quarter":
        startDate = now.subtract(90, "days");
        break;
      default:
        startDate = now.subtract(7, "days");
    }

    const filteredSessions = sessions.filter((session) =>
      dayjs(session.startTime).isAfter(startDate)
    );

    const filteredEvents = events.filter((event) =>
      dayjs(event.scheduledTime).isAfter(startDate)
    );

    // Calculate basic metrics
    const totalCalls = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((sum, session) => {
      const duration = session.endTime
        ? dayjs(session.endTime).diff(dayjs(session.startTime), "minute")
        : 0;
      return sum + duration;
    }, 0);

    const averageRating =
      filteredSessions.reduce(
        (sum, session) => sum + (session.metrics?.sentimentScore || 0),
        0
      ) / Math.max(totalCalls, 1);

    const completedCalls = filteredSessions.filter(
      (session) => session.endTime
    ).length;
    const scheduledCalls = filteredEvents.length;
    const completionRate =
      scheduledCalls > 0 ? completedCalls / scheduledCalls : 0;

    // Calculate peak call times
    const hourCounts: { [hour: number]: number } = {};
    filteredSessions.forEach((session) => {
      const hour = dayjs(session.startTime).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakCallTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate sentiment trends
    const sentimentByDate: { [date: string]: number[] } = {};
    filteredSessions.forEach((session) => {
      const date = dayjs(session.startTime).format("YYYY-MM-DD");
      if (!sentimentByDate[date]) sentimentByDate[date] = [];
      sentimentByDate[date].push(session.metrics?.sentimentScore || 0);
    });

    const sentimentTrends = Object.entries(sentimentByDate)
      .map(([date, sentiments]) => ({
        date,
        sentiment:
          sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate call duration trends
    const durationByDate: { [date: string]: number[] } = {};
    filteredSessions.forEach((session) => {
      const date = dayjs(session.startTime).format("YYYY-MM-DD");
      const duration = session.endTime
        ? dayjs(session.endTime).diff(dayjs(session.startTime), "minute")
        : 0;
      if (!durationByDate[date]) durationByDate[date] = [];
      durationByDate[date].push(duration);
    });

    const callDurationTrends = Object.entries(durationByDate)
      .map(([date, durations]) => ({
        date,
        duration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top participants
    const participantCounts: { [name: string]: number } = {};
    filteredEvents.forEach((event) => {
      event.participants.forEach((participant) => {
        participantCounts[participant] =
          (participantCounts[participant] || 0) + 1;
      });
    });

    const topParticipants = Object.entries(participantCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setAnalyticsData({
      totalCalls,
      totalMinutes,
      averageRating,
      completionRate,
      peakCallTimes,
      sentimentTrends,
      callDurationTrends,
      topParticipants,
    });
  }, [timeRange, sessions, events]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [
      {
        translateY: interpolate(fadeInValue.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const formatHour = (hour: number) => {
    return hour === 0
      ? "12 AM"
      : hour < 12
        ? `${hour} AM`
        : hour === 12
          ? "12 PM"
          : `${hour - 12} PM`;
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.primary,
    backgroundGradientTo: theme.colors.secondary,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  const styles = createStyles(theme);

  if (!analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="bodyLarge">Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={animatedStyle}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "quarter", label: "Quarter" },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Key Metrics Cards */}
        <View style={styles.metricsGrid}>
          <ExpoGlassCard style={styles.metricCard} intensity={80}>
            <LinearGradient
              colors={["#4CAF50", "#45A049"]}
              style={styles.metricGradient}
            >
              <Text variant="headlineLarge" style={styles.metricValue}>
                {analyticsData.totalCalls}
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Total Calls
              </Text>
            </LinearGradient>
          </ExpoGlassCard>

          <ExpoGlassCard style={styles.metricCard} intensity={80}>
            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              style={styles.metricGradient}
            >
              <Text variant="headlineLarge" style={styles.metricValue}>
                {Math.round(analyticsData.totalMinutes)}
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Total Minutes
              </Text>
            </LinearGradient>
          </ExpoGlassCard>

          <ExpoGlassCard style={styles.metricCard} intensity={80}>
            <LinearGradient
              colors={["#FF9800", "#F57C00"]}
              style={styles.metricGradient}
            >
              <Text variant="headlineLarge" style={styles.metricValue}>
                {(analyticsData.averageRating * 100).toFixed(0)}%
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Avg Sentiment
              </Text>
            </LinearGradient>
          </ExpoGlassCard>

          <ExpoGlassCard style={styles.metricCard} intensity={80}>
            <LinearGradient
              colors={["#9C27B0", "#7B1FA2"]}
              style={styles.metricGradient}
            >
              <Text variant="headlineLarge" style={styles.metricValue}>
                {(analyticsData.completionRate * 100).toFixed(0)}%
              </Text>
              <Text variant="bodyMedium" style={styles.metricLabel}>
                Completion Rate
              </Text>
            </LinearGradient>
          </ExpoGlassCard>
        </View>

        {/* Sentiment Trends Chart */}
        {analyticsData.sentimentTrends.length > 0 && (
          <ExpoGlassCard style={styles.chartCard} intensity={60}>
            <Text variant="titleLarge" style={styles.chartTitle}>
              📈 Sentiment Trends
            </Text>
            <LineChart
              data={{
                labels: analyticsData.sentimentTrends.map((item) =>
                  dayjs(item.date).format("MM/DD")
                ),
                datasets: [
                  {
                    data: analyticsData.sentimentTrends.map(
                      (item) => item.sentiment * 100
                    ),
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ExpoGlassCard>
        )}

        {/* Call Duration Trends */}
        {analyticsData.callDurationTrends.length > 0 && (
          <ExpoGlassCard style={styles.chartCard} intensity={60}>
            <Text variant="titleLarge" style={styles.chartTitle}>
              ⏱️ Call Duration Trends
            </Text>
            <BarChart
              data={{
                labels: analyticsData.callDurationTrends.map((item) =>
                  dayjs(item.date).format("MM/DD")
                ),
                datasets: [
                  {
                    data: analyticsData.callDurationTrends.map(
                      (item) => item.duration
                    ),
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel={""}
              yAxisSuffix={""}
            />
          </ExpoGlassCard>
        )}

        {/* Peak Call Times */}
        {analyticsData.peakCallTimes.length > 0 && (
          <ExpoGlassCard style={styles.chartCard} intensity={60}>
            <Text variant="titleLarge" style={styles.chartTitle}>
              🕐 Peak Call Times
            </Text>
            <View style={styles.peakTimesContainer}>
              {analyticsData.peakCallTimes.map((item, index) => (
                <View key={item.hour} style={styles.peakTimeItem}>
                  <View style={styles.peakTimeRank}>
                    <Text variant="bodyLarge" style={styles.peakTimeRankText}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.peakTimeDetails}>
                    <Text variant="bodyLarge" style={styles.peakTimeHour}>
                      {formatHour(item.hour)}
                    </Text>
                    <Text variant="bodyMedium" style={styles.peakTimeCount}>
                      {item.count} calls
                    </Text>
                  </View>
                  <View style={styles.peakTimeBar}>
                    <View
                      style={[
                        styles.peakTimeBarFill,
                        {
                          width: `${(item.count / Math.max(...analyticsData.peakCallTimes.map((p) => p.count))) * 100}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ExpoGlassCard>
        )}

        {/* Top Participants */}
        {analyticsData.topParticipants.length > 0 && (
          <ExpoGlassCard style={styles.chartCard} intensity={60}>
            <Text variant="titleLarge" style={styles.chartTitle}>
              👥 Top Participants
            </Text>
            <View style={styles.participantsContainer}>
              {analyticsData.topParticipants.map((participant, index) => (
                <View key={participant.name} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Text variant="bodyLarge" style={styles.participantInitial}>
                      {participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantDetails}>
                    <Text variant="bodyLarge" style={styles.participantName}>
                      {participant.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.participantCount}>
                      {participant.count} calls
                    </Text>
                  </View>
                  <View style={styles.participantBadge}>
                    <Text
                      variant="bodySmall"
                      style={styles.participantBadgeText}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ExpoGlassCard>
        )}

        {/* Insights & Recommendations */}
        <ExpoGlassCard style={styles.insightsCard} intensity={60}>
          <Text variant="titleLarge" style={styles.insightsTitle}>
            🧠 AI Insights & Recommendations
          </Text>

          <View style={styles.insightsList}>
            {analyticsData.averageRating > 0.7 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>✨</Text>
                <Text variant="bodyMedium" style={styles.insightText}>
                  Great job! Your call sentiment is consistently positive. Keep
                  up the engaging conversation style.
                </Text>
              </View>
            )}

            {analyticsData.totalMinutes /
              Math.max(analyticsData.totalCalls, 1) >
              45 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>⏰</Text>
                <Text variant="bodyMedium" style={styles.insightText}>
                  Your calls average{" "}
                  {Math.round(
                    analyticsData.totalMinutes /
                      Math.max(analyticsData.totalCalls, 1)
                  )}{" "}
                  minutes. Consider scheduling shorter, more focused sessions.
                </Text>
              </View>
            )}

            {analyticsData.peakCallTimes.length > 0 &&
              analyticsData.peakCallTimes[0].hour >= 14 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📅</Text>
                  <Text variant="bodyMedium" style={styles.insightText}>
                    Your peak call time is{" "}
                    {formatHour(analyticsData.peakCallTimes[0].hour)}. This
                    aligns well with post-lunch productivity hours.
                  </Text>
                </View>
              )}

            {analyticsData.completionRate < 0.8 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🎯</Text>
                <Text variant="bodyMedium" style={styles.insightText}>
                  Consider improving your completion rate by setting realistic
                  call durations and sending preparation materials in advance.
                </Text>
              </View>
            )}
          </View>
        </ExpoGlassCard>
      </Animated.View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    timeRangeContainer: {
      padding: theme.spacing.md,
    },
    segmentedButtons: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    metricCard: {
      flex: 1,
      minWidth: "45%",
      aspectRatio: 1.2,
    },
    metricGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    metricValue: {
      color: "white",
      fontFamily: "Inter-Black",
      textAlign: "center",
    },
    metricLabel: {
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
    chartCard: {
      margin: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    chartTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    chart: {
      marginVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    peakTimesContainer: {
      gap: theme.spacing.md,
    },
    peakTimeItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
    },
    peakTimeRank: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: theme.spacing.md,
    },
    peakTimeRankText: {
      color: theme.colors.onPrimary,
      fontFamily: "Inter-Bold",
    },
    peakTimeDetails: {
      flex: 1,
    },
    peakTimeHour: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    peakTimeCount: {
      color: theme.colors.onSurfaceVariant,
    },
    peakTimeBar: {
      width: 80,
      height: 8,
      backgroundColor: theme.colors.outline,
      borderRadius: 4,
      overflow: "hidden",
    },
    peakTimeBarFill: {
      height: "100%",
      borderRadius: 4,
    },
    participantsContainer: {
      gap: theme.spacing.md,
    },
    participantItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: theme.spacing.md,
    },
    participantInitial: {
      color: theme.colors.onPrimary,
      fontFamily: "Inter-Bold",
    },
    participantDetails: {
      flex: 1,
    },
    participantName: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    participantCount: {
      color: theme.colors.onSurfaceVariant,
    },
    participantBadge: {
      backgroundColor: theme.colors.secondaryContainer,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    participantBadgeText: {
      color: theme.colors.onSecondaryContainer,
      fontFamily: "Inter-Bold",
    },
    insightsCard: {
      margin: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    insightsTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    insightsList: {
      gap: theme.spacing.md,
    },
    insightItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
    },
    insightIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
      marginTop: 2,
    },
    insightText: {
      flex: 1,
      color: theme.colors.onSurface,
      lineHeight: 20,
    },
  });

export default CallAnalyticsDashboard;
