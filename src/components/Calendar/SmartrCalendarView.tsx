import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { Text, useTheme, Button, IconButton } from "react-native-paper";
import { Calendar, CalendarUtils } from "react-native-calendars";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";

import { CallEvent } from "../../types";
import { useCalendarIntegration } from "../../hooks/useCalendarIntegration";
import ExpoGlassCard from "../common/ExpoGlassCard";
import AnimatedButton from "../common/AnimatedButton";

const { width } = Dimensions.get("window");

interface SmartCalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  callEvents: CallEvent[];
  onTimeSlotSelect: (time: Date) => void;
  onCreateEvent: (date: Date) => void;
}

const SmartCalendarView: React.FC<SmartCalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  callEvents,
  onTimeSlotSelect,
  onCreateEvent,
}) => {
  const theme = useTheme();
  const { getCalendarEvents, suggestOptimalTimes, checkTimeSlotAvailability } =
    useCalendarIntegration();

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [suggestedTimes, setSuggestedTimes] = useState<Date[]>([]);
  const [conflictingSlots, setConflictingSlots] = useState<Set<string>>(
    new Set()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    dayjs(selectedDate).format("YYYY-MM")
  );

  const calendarScale = useSharedValue(1);
  const timeSlotOpacity = useSharedValue(0);

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate]);

  const loadCalendarData = useCallback(async () => {
    const startOfMonth = dayjs(selectedDate).startOf("month").toDate();
    const endOfMonth = dayjs(selectedDate).endOf("month").toDate();

    try {
      const events = await getCalendarEvents(startOfMonth, endOfMonth);
      setCalendarEvents(events);

      // Check for conflicts
      const conflicts = new Set<string>();
      for (const event of callEvents) {
        const { available } = await checkTimeSlotAvailability(
          event.scheduledTime,
          event.duration
        );
        if (!available) {
          conflicts.add(dayjs(event.scheduledTime).format("YYYY-MM-DD"));
        }
      }
      setConflictingSlots(conflicts);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [selectedDate, callEvents, getCalendarEvents, checkTimeSlotAvailability]);

  const handleDatePress = useCallback(
    async (day: any) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newDate = new Date(day.dateString);
      onDateSelect(newDate);

      // Animate calendar
      calendarScale.value = withTiming(0.98, { duration: 100 }, () => {
        calendarScale.value = withSpring(1);
      });

      // Load optimal times for selected date
      const optimal = await suggestOptimalTimes(newDate, 30);
      setSuggestedTimes(optimal);
      timeSlotOpacity.value = withTiming(1, { duration: 300 });
    },
    [onDateSelect, suggestOptimalTimes]
  );

  const handleTimeSlotPress = useCallback(
    async (time: Date) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onTimeSlotSelect(time);
    },
    [onTimeSlotSelect]
  );

  const getMarkedDates = useCallback(() => {
    const marked: any = {};

    // Mark call events
    callEvents.forEach((event) => {
      const dateKey = dayjs(event.scheduledTime).format("YYYY-MM-DD");
      marked[dateKey] = {
        marked: true,
        dotColor: theme.colors.primary,
        selectedColor: theme.colors.primaryContainer,
      };
    });

    // Mark conflicting dates
    conflictingSlots.forEach((dateKey) => {
      marked[dateKey] = {
        ...marked[dateKey],
        marked: true,
        dotColor: theme.colors.error,
      };
    });

    // Mark selected date
    const selectedKey = dayjs(selectedDate).format("YYYY-MM-DD");
    marked[selectedKey] = {
      ...marked[selectedKey],
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marked;
  }, [callEvents, conflictingSlots, selectedDate, theme.colors]);

  const calendarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: calendarScale.value }],
  }));

  const timeSlotStyle = useAnimatedStyle(() => ({
    opacity: timeSlotOpacity.value,
  }));

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ExpoGlassCard style={styles.calendarCard} intensity={80}>
        <Animated.View style={calendarStyle}>
          <Calendar
            current={selectedMonth}
            onDayPress={handleDatePress}
            onMonthChange={(month) => setSelectedMonth(month.dateString)}
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textSectionTitleColor: theme.colors.onSurface,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.onPrimary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.onSurfaceVariant,
              dotColor: theme.colors.primary,
              selectedDotColor: theme.colors.onPrimary,
              arrowColor: theme.colors.primary,
              disabledArrowColor: theme.colors.onSurfaceVariant,
              monthTextColor: theme.colors.onSurface,
              indicatorColor: theme.colors.primary,
              textDayFontFamily: "Inter-Regular",
              textMonthFontFamily: "Inter-Bold",
              textDayHeaderFontFamily: "Inter-Bold",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
          />
        </Animated.View>
      </ExpoGlassCard>

      {/* Smart Time Suggestions */}
      {suggestedTimes.length > 0 && (
        <Animated.View style={[styles.timeSuggestionsContainer, timeSlotStyle]}>
          <ExpoGlassCard style={styles.timeSuggestionsCard} intensity={60}>
            <View style={styles.timeSuggestionsHeader}>
              <Text variant="titleMedium" style={styles.timeSuggestionsTitle}>
                ✨ Smart Time Suggestions
              </Text>
              <Text variant="bodySmall" style={styles.timeSuggestionsSubtitle}>
                AI-optimized based on your schedule
              </Text>
            </View>

            <View style={styles.timeSlotGrid}>
              {suggestedTimes.slice(0, 6).map((time, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleTimeSlotPress(time)}
                  style={styles.timeSlotPressable}
                >
                  <LinearGradient
                    colors={[
                      `${theme.colors.primary}20`,
                      `${theme.colors.primary}10`,
                    ]}
                    style={styles.timeSlot}
                  >
                    <Text variant="bodyMedium" style={styles.timeSlotTime}>
                      {dayjs(time).format("h:mm A")}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeSlotLabel}>
                      Available
                    </Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>

            <AnimatedButton
              mode="contained"
              onPress={() => onCreateEvent(selectedDate)}
              style={styles.createEventButton}
              icon="plus"
              gradient
            >
              Schedule Call
            </AnimatedButton>
          </ExpoGlassCard>
        </Animated.View>
      )}

      {/* Calendar Legend */}
      <ExpoGlassCard style={styles.legendCard} intensity={40}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text variant="bodySmall" style={styles.legendText}>
              Scheduled Calls
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.error },
              ]}
            />
            <Text variant="bodySmall" style={styles.legendText}>
              Conflicts
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <Text variant="bodySmall" style={styles.legendText}>
              Available
            </Text>
          </View>
        </View>
      </ExpoGlassCard>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    calendarCard: {
      padding: theme.spacing.md,
    },
    timeSuggestionsContainer: {
      marginTop: theme.spacing.md,
    },
    timeSuggestionsCard: {
      padding: theme.spacing.lg,
    },
    timeSuggestionsHeader: {
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    timeSuggestionsTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    timeSuggestionsSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    timeSlotGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    timeSlotPressable: {
      flex: 1,
      minWidth: "30%",
    },
    timeSlot: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    timeSlotTime: {
      color: theme.colors.primary,
      fontFamily: "Inter-Bold",
    },
    timeSlotLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    createEventButton: {
      marginTop: theme.spacing.sm,
    },
    legendCard: {
      padding: theme.spacing.md,
    },
    legend: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

export default SmartCalendarView;
