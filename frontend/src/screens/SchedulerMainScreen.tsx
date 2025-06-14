import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  IconButton,
  Chip,
  Divider,
  Badge,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(relativeTime);
dayjs.extend(isToday);

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useCallStore } from "../store/callStore";
import { CallEvent } from "../types";

// Import your existing scheduler component
import SchedulerScreen from "./SchedulerScreen";

const { width } = Dimensions.get("window");

interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CallEvent[];
}

const ScheduleMainScreen: React.FC = () => {
  const theme = useTheme();
  const { events } = useCallStore();

  // State management
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [showScheduler, setShowScheduler] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Animation values
  const fabScale = useSharedValue(1);
  const calendarOpacity = useSharedValue(1);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfCalendar = startOfMonth.startOf("week");
    const endOfCalendar = endOfMonth.endOf("week");

    const days: CalendarDay[] = [];
    let current = startOfCalendar;

    while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar)) {
      const dayEvents = events.filter((event) =>
        dayjs(event.scheduledDate).isSame(current, "day")
      );

      days.push({
        date: current,
        isCurrentMonth: current.isSame(currentMonth, "month"),
        isToday: current.isToday(),
        isSelected: current.isSame(selectedDate, "day"),
        events: dayEvents,
      });

      current = current.add(1, "day");
    }

    return days;
  }, [currentMonth, selectedDate, events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((event) => dayjs(event.scheduledDate).isSame(selectedDate, "day"))
      .sort((a, b) => dayjs(a.scheduledDate).diff(dayjs(b.scheduledDate)));
  }, [events, selectedDate]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = dayjs();
    const weekFromNow = now.add(7, "days");

    return events
      .filter((event) => {
        const eventDate = dayjs(event.scheduledDate);
        return eventDate.isAfter(now) && eventDate.isBefore(weekFromNow);
      })
      .sort((a, b) => dayjs(a.scheduledDate).diff(dayjs(b.scheduledDate)));
  }, [events]);

  // Handlers
  const handleDateSelect = useCallback((date: dayjs.Dayjs) => {
    setSelectedDate(date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleMonthChange = useCallback(
    (direction: "prev" | "next") => {
      const newMonth =
        direction === "next"
          ? currentMonth.add(1, "month")
          : currentMonth.subtract(1, "month");
      setCurrentMonth(newMonth);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [currentMonth]
  );

  const handleScheduleCall = useCallback(() => {
    setShowScheduler(true);
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [fabScale]);

  const handleSchedulerClose = useCallback(() => {
    setShowScheduler(false);
    calendarOpacity.value = withTiming(1);
  }, [calendarOpacity]);

  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const calendarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: calendarOpacity.value,
  }));

  const styles = createStyles(theme);

  // Render calendar day
  const renderCalendarDay = (day: CalendarDay, index: number) => (
    <Pressable
      key={`${day.date.format("YYYY-MM-DD")}-${index}`}
      style={[
        styles.calendarDay,
        !day.isCurrentMonth && styles.calendarDayInactive,
        day.isToday && styles.calendarDayToday,
        day.isSelected && styles.calendarDaySelected,
      ]}
      onPress={() => handleDateSelect(day.date)}
    >
      <Text
        variant="bodyMedium"
        style={[
          styles.calendarDayText,
          !day.isCurrentMonth && styles.calendarDayTextInactive,
          day.isToday && styles.calendarDayTextToday,
          day.isSelected && styles.calendarDayTextSelected,
        ]}
      >
        {day.date.format("D")}
      </Text>
      {day.events.length > 0 && (
        <View style={styles.eventDots}>
          {day.events.slice(0, 3).map((_, eventIndex) => (
            <View
              key={eventIndex}
              style={[
                styles.eventDot,
                day.isSelected && styles.eventDotSelected,
              ]}
            />
          ))}
          {day.events.length > 3 && <Text style={styles.eventDotMore}>+</Text>}
        </View>
      )}
    </Pressable>
  );

  // Render event card
  const renderEventCard = (event: CallEvent) => (
    <Card key={event.id} style={styles.eventCard}>
      <View style={styles.eventCardContent}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTime}>
            <Text variant="labelSmall" style={styles.eventTimeText}>
              {dayjs(event.scheduledDate).format("h:mm A")}
            </Text>
          </View>
          <Chip
            mode="outlined"
            compact
            style={styles.statusChip}
            textStyle={styles.statusChipText}
          >
            {event.status}
          </Chip>
        </View>

        <Text variant="titleMedium" style={styles.eventTitle}>
          {event.title}
        </Text>

        {event.description && (
          <Text variant="bodyMedium" style={styles.eventDescription}>
            {event.description}
          </Text>
        )}

        <View style={styles.eventMeta}>
          <Text variant="bodySmall" style={styles.eventMetaText}>
            🎭 {event.voicePersona} • 👤{" "}
            {event.selectedProfileFields?.length || 0} fields
          </Text>
        </View>
      </View>
    </Card>
  );

  if (showScheduler) {
    return (
      <Portal>
        <SchedulerScreen onClose={handleSchedulerClose} />
      </Portal>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <LinearGradient
        colors={[theme.colors.primary + "08", theme.colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.content, calendarAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Schedule
            </Text>
            <View style={styles.viewModeToggle}>
              {(["month", "week", "day"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.viewModeButton,
                    viewMode === mode && styles.viewModeButtonActive,
                  ]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.viewModeText,
                      viewMode === mode && styles.viewModeTextActive,
                    ]}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => handleMonthChange("prev")}
            />
            <Pressable onPress={() => setCurrentMonth(dayjs())}>
              <Text variant="titleLarge" style={styles.monthTitle}>
                {currentMonth.format("MMMM YYYY")}
              </Text>
            </Pressable>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => handleMonthChange("next")}
            />
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} variant="labelSmall" style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar Grid */}
          <Card style={styles.calendarCard}>
            <View style={styles.calendarGrid}>
              {calendarDays.map(renderCalendarDay)}
            </View>
          </Card>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {events.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Calls
                </Text>
              </View>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {upcomingEvents.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  This Week
                </Text>
              </View>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {selectedDateEvents.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Today
                </Text>
              </View>
            </Card>
          </View>

          {/* Selected Date Events */}
          {selectedDateEvents.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {selectedDate.isToday()
                  ? "Today's Calls"
                  : `Calls for ${selectedDate.format("MMM D")}`}
              </Text>
              <View style={styles.eventsList}>
                {selectedDateEvents.map(renderEventCard)}
              </View>
            </View>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Upcoming This Week
              </Text>
              <View style={styles.eventsList}>
                {upcomingEvents.slice(0, 3).map(renderEventCard)}
                {upcomingEvents.length > 3 && (
                  <Card style={styles.moreEventsCard}>
                    <Pressable style={styles.moreEventsContent}>
                      <Text variant="bodyMedium" style={styles.moreEventsText}>
                        +{upcomingEvents.length - 3} more calls this week
                      </Text>
                    </Pressable>
                  </Card>
                )}
              </View>
            </View>
          )}

          {/* Empty State */}
          {events.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No calls scheduled
              </Text>
              <Text variant="bodyLarge" style={styles.emptyMessage}>
                Tap the + button below to schedule your first AI call
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Floating Action Button - Tab Bar Safe */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <FAB
          icon="plus"
          label="Schedule Call"
          onPress={handleScheduleCall}
          style={styles.fab}
          customSize={56}
        />
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 100, // Space for FAB and tab bar
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
      elevation: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    viewModeToggle: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      padding: 2,
    },
    viewModeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
    },
    viewModeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    viewModeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      fontWeight: "500",
    },
    viewModeTextActive: {
      color: theme.colors.onPrimary,
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    monthTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    dayLabels: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 8,
    },
    dayLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      width: (width - 40) / 7,
      fontWeight: "500",
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
    calendarCard: {
      marginVertical: 8,
      padding: 8,
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    calendarDay: {
      width: (width - 56) / 7,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 2,
      borderRadius: 8,
      position: "relative",
    },
    calendarDayInactive: {
      opacity: 0.3,
    },
    calendarDayToday: {
      backgroundColor: theme.colors.primaryContainer + "50",
    },
    calendarDaySelected: {
      backgroundColor: theme.colors.primary,
    },
    calendarDayText: {
      color: theme.colors.onSurface,
      fontWeight: "500",
    },
    calendarDayTextInactive: {
      color: theme.colors.onSurfaceVariant,
    },
    calendarDayTextToday: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    calendarDayTextSelected: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    eventDots: {
      position: "absolute",
      bottom: 2,
      flexDirection: "row",
      alignItems: "center",
    },
    eventDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 1,
    },
    eventDotSelected: {
      backgroundColor: theme.colors.onPrimary,
    },
    eventDotMore: {
      fontSize: 8,
      color: theme.colors.primary,
      fontWeight: "bold",
      marginLeft: 2,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginVertical: 8,
    },
    statCard: {
      padding: 16,
    },
    statContent: {
      alignItems: "center",
      gap: 4,
    },
    statNumber: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    section: {
      marginVertical: 8,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 12,
      marginLeft: 4,
    },
    eventsList: {
      gap: 8,
    },
    eventCard: {
      elevation: 1,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    eventCardContent: {
      padding: 16,
      gap: 8,
    },
    eventHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eventTime: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    eventTimeText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "600",
    },
    statusChip: {
      height: 24,
    },
    statusChipText: {
      fontSize: 10,
    },
    eventTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    eventDescription: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    eventMeta: {
      marginTop: 4,
    },
    eventMetaText: {
      color: theme.colors.onSurfaceVariant,
    },
    moreEventsCard: {
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: "transparent",
    },
    moreEventsContent: {
      padding: 16,
      alignItems: "center",
    },
    moreEventsText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 16,
    },
    emptyEmoji: {
      fontSize: 48,
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      textAlign: "center",
    },
    emptyMessage: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: 20,
      lineHeight: 24,
    },
    fabContainer: {
      position: "absolute",
      bottom: 100, // Space for tab bar (60px) + safe area (40px)
      right: 24,
      zIndex: 1000,
    },
    fab: {
      backgroundColor: theme.colors.primary,
    },
    schedulerModal: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export default ScheduleMainScreen;
