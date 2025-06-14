import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  FAB,
  Portal,
  Modal,
  useTheme,
  IconButton,
  Card,
  Button,
  TextInput,
  Chip,
  RadioButton,
  Switch,
  Divider,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";

import { useCallStore } from "../store/callStore";
import { useUserStore } from "../store/userStore";
import { CallEvent } from "../types";
import AnimatedButton from "../components/common/AnimatedButton";

const SchedulerScreen: React.FC = () => {
  const theme = useTheme();
  const { events, addEvent, updateEvent, deleteEvent, getUpcomingEvents } =
    useCallStore();
  const { profile } = useUserStore();

  // UI State
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<"calendar" | "list">(
    "calendar"
  );
  const [modalStep, setModalStep] = useState<
    "task" | "recipient" | "schedule" | "review"
  >("task");

  // Form State
  const [formData, setFormData] = useState({
    // Task Details
    taskTitle: "",
    taskDescription: "",
    taskType: "appointment", // appointment, inquiry, booking, complaint, other
    priority: "medium", // low, medium, high

    // Recipient Details
    recipientName: "",
    recipientPhone: "",
    recipientCompany: "",

    // Call Settings
    callTime: "09:00",
    duration: 30,
    maxRetries: 2,
    followUpRequired: true,

    // User Context (what AI can share about user)
    sharePersonalInfo: true,
    shareContactInfo: true,
    shareCompanyInfo: true,
    customInstructions: "",
  });

  // Animation
  const scrollY = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const resetForm = () => {
    setFormData({
      taskTitle: "",
      taskDescription: "",
      taskType: "appointment",
      priority: "medium",
      recipientName: "",
      recipientPhone: "",
      recipientCompany: "",
      callTime: "09:00",
      duration: 30,
      maxRetries: 2,
      followUpRequired: true,
      sharePersonalInfo: true,
      shareContactInfo: true,
      shareCompanyInfo: true,
      customInstructions: "",
    });
    setModalStep("task");
  };

  const handleDateSelect = useCallback((day: any) => {
    setSelectedDate(day.dateString);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleNextStep = () => {
    const steps = ["task", "recipient", "schedule", "review"] as const;
    const currentIndex = steps.indexOf(modalStep);
    if (currentIndex < steps.length - 1) {
      setModalStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps = ["task", "recipient", "schedule", "review"] as const;
    const currentIndex = steps.indexOf(modalStep);
    if (currentIndex > 0) {
      setModalStep(steps[currentIndex - 1]);
    }
  };

  const validateCurrentStep = () => {
    switch (modalStep) {
      case "task":
        return formData.taskTitle.trim() && formData.taskDescription.trim();
      case "recipient":
        // Validate phone number has at least 10 digits
        const phoneDigits = formData.recipientPhone.replace(/\D/g, "");
        return formData.recipientName.trim() && phoneDigits.length >= 10;
      case "schedule":
        return true; // Always valid with defaults
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleScheduleAICall = useCallback(async () => {
    if (!profile) {
      Alert.alert(
        "Profile Required",
        "Please complete your profile first to schedule AI calls"
      );
      return;
    }

    // Validate phone number
    const phoneDigits = formData.recipientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    // Create proper date object
    const [hours, minutes] = formData.callTime.split(":").map(Number);
    const callDate = dayjs(selectedDate)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .toDate();

    const newEvent: CallEvent = {
      id: `ai_call_${Date.now()}`,
      title: `AI Call: ${formData.taskTitle}`,
      description: formData.taskDescription,
      scheduledTime: callDate,
      duration: formData.duration,
      status: "scheduled",

      // AI-specific fields
      taskType: formData.taskType,
      priority: formData.priority,
      recipient: {
        name: formData.recipientName,
        phone: formData.recipientPhone,
        company: formData.recipientCompany,
      },
      aiInstructions: {
        maxRetries: formData.maxRetries,
        followUpRequired: formData.followUpRequired,
        sharePersonalInfo: formData.sharePersonalInfo,
        shareContactInfo: formData.shareContactInfo,
        shareCompanyInfo: formData.shareCompanyInfo,
        customInstructions: formData.customInstructions,
      },
      userContext: {
        name: profile.name,
        email: formData.shareContactInfo ? profile.email : undefined,
        phone: formData.shareContactInfo ? profile.phone : undefined,
        company: formData.shareCompanyInfo ? profile.company : undefined,
        jobTitle: formData.shareCompanyInfo ? profile.jobTitle : undefined,
      },

      participants: [formData.recipientName],
      reminders: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addEvent(newEvent);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setIsModalVisible(false);
    resetForm();

    Alert.alert(
      "AI Call Scheduled!",
      `Your AI assistant will call ${formData.recipientPhone} (${formData.recipientName}) on ${dayjs(callDate).format("MMM D, YYYY at h:mm A")} to handle: ${formData.taskTitle}`
    );
  }, [formData, selectedDate, addEvent, profile]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      fabScale.value =
        event.contentOffset.y > 100 ? withSpring(0.85) : withSpring(1);
    },
  });

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Get events for selected date
  const getEventsForDate = (date: string) => {
    return events.filter(
      (event) => dayjs(event.scheduledTime).format("YYYY-MM-DD") === date
    );
  };

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const marked: any = {};

    events.forEach((event) => {
      const dateKey = dayjs(event.scheduledTime).format("YYYY-MM-DD");
      const color =
        event.status === "completed"
          ? theme.colors.tertiary
          : event.status === "failed"
            ? theme.colors.error
            : theme.colors.primary;
      marked[dateKey] = {
        marked: true,
        dotColor: color,
      };
    });

    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marked;
  };

  const taskTypes = [
    { value: "appointment", label: "Schedule Appointment", icon: "📅" },
    { value: "inquiry", label: "Make Inquiry", icon: "❓" },
    { value: "booking", label: "Make Booking", icon: "🎫" },
    { value: "complaint", label: "File Complaint", icon: "⚠️" },
    { value: "follow_up", label: "Follow Up", icon: "📞" },
    { value: "other", label: "Other Task", icon: "💼" },
  ];

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  const renderModalContent = () => {
    switch (modalStep) {
      case "task":
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              What task should AI handle?
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              Describe what you want the AI to accomplish during the call
            </Text>

            <TextInput
              label="Task Title *"
              value={formData.taskTitle}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, taskTitle: text }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Schedule doctor appointment"
            />

            <TextInput
              label="Detailed Description *"
              value={formData.taskDescription}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, taskDescription: text }))
              }
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="e.g., Call Dr. Smith's office to schedule a routine checkup for next week, preferably Tuesday or Wednesday morning"
            />

            <Text variant="bodyLarge" style={styles.sectionLabel}>
              Task Type
            </Text>
            <View style={styles.taskTypeGrid}>
              {taskTypes.map((type) => (
                <Chip
                  key={type.value}
                  selected={formData.taskType === type.value}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, taskType: type.value }))
                  }
                  style={styles.taskTypeChip}
                  icon={() => <Text>{type.icon}</Text>}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            <Text variant="bodyLarge" style={styles.sectionLabel}>
              Priority Level
            </Text>
            <RadioButton.Group
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value }))
              }
              value={formData.priority}
            >
              {[
                {
                  value: "low",
                  label: "Low - Can wait",
                  color: theme.colors.tertiary,
                },
                {
                  value: "medium",
                  label: "Medium - Normal urgency",
                  color: theme.colors.primary,
                },
                {
                  value: "high",
                  label: "High - Urgent",
                  color: theme.colors.error,
                },
              ].map((priority) => (
                <View key={priority.value} style={styles.radioOption}>
                  <RadioButton value={priority.value} />
                  <Text style={[styles.radioLabel, { color: priority.color }]}>
                    {priority.label}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        );

      case "recipient":
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Who should AI call?
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              Enter the phone number and contact details
            </Text>

            <View style={styles.phoneNumberSection}>
              <Text variant="titleMedium" style={styles.phoneNumberLabel}>
                📞 Phone Number to Call
              </Text>
              <TextInput
                label="Phone Number *"
                value={formData.recipientPhone}
                onChangeText={(text) => {
                  // Auto-format phone number as user types
                  const cleaned = text.replace(/\D/g, "");
                  let formatted = cleaned;

                  if (cleaned.length >= 6) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
                  } else if (cleaned.length >= 3) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    recipientPhone: formatted,
                  }));
                }}
                mode="outlined"
                keyboardType="phone-pad"
                style={[styles.input, styles.phoneNumberInput]}
                placeholder="(555) 123-4567"
                left={<TextInput.Icon icon="phone" />}
                maxLength={14}
              />
              <Text variant="bodySmall" style={styles.phoneHint}>
                Enter the complete phone number including area code
              </Text>
            </View>

            <TextInput
              label="Contact Name *"
              value={formData.recipientName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, recipientName: text }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Dr. Smith, ABC Company, John Doe"
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Company/Organization (Optional)"
              value={formData.recipientCompany}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, recipientCompany: text }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Smith Medical Center, ABC Corp"
              left={<TextInput.Icon icon="domain" />}
            />

            <View style={styles.quickContactsSection}>
              <Text variant="bodyMedium" style={styles.quickContactsTitle}>
                💡 Quick tip: Save frequently called numbers in your profile for
                faster scheduling
              </Text>
            </View>
          </View>
        );

      case "schedule":
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              When should AI make the call?
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              Choose the date and time for the AI call
            </Text>

            <Text variant="bodyLarge" style={styles.selectedDateText}>
              📅 {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}
            </Text>

            <Text variant="bodyLarge" style={styles.sectionLabel}>
              Call Time
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.timeSlotsContainer}
            >
              {timeSlots.map((time) => (
                <Chip
                  key={time}
                  selected={formData.callTime === time}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, callTime: time }))
                  }
                  style={styles.timeSlot}
                >
                  {time}
                </Chip>
              ))}
            </ScrollView>

            <Text variant="bodyLarge" style={styles.sectionLabel}>
              Expected Duration
            </Text>
            <View style={styles.durationOptions}>
              {[15, 30, 45, 60].map((duration) => (
                <Chip
                  key={duration}
                  selected={formData.duration === duration}
                  onPress={() => setFormData((prev) => ({ ...prev, duration }))}
                  style={styles.durationChip}
                >
                  {duration} min
                </Chip>
              ))}
            </View>

            <Text variant="bodyLarge" style={styles.sectionLabel}>
              Call Settings
            </Text>
            <View style={styles.callSettings}>
              <View style={styles.settingRow}>
                <Text variant="bodyMedium">Maximum retry attempts</Text>
                <View style={styles.retryOptions}>
                  {[1, 2, 3].map((retries) => (
                    <Chip
                      key={retries}
                      selected={formData.maxRetries === retries}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          maxRetries: retries,
                        }))
                      }
                      style={styles.retryChip}
                    >
                      {retries}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text variant="bodyMedium">Follow-up if unsuccessful</Text>
                <Switch
                  value={formData.followUpRequired}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      followUpRequired: value,
                    }))
                  }
                />
              </View>
            </View>
          </View>
        );

      case "review":
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Review & Privacy Settings
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              What information can AI share about you if asked?
            </Text>

            <Card style={styles.reviewCard}>
              <Text variant="titleMedium" style={styles.reviewSectionTitle}>
                📋 Call Summary
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Task:</Text>{" "}
                {formData.taskTitle}
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Phone:</Text>{" "}
                {formData.recipientPhone}
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Contact:</Text>{" "}
                {formData.recipientName}
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                <Text style={styles.reviewLabel}>When:</Text>{" "}
                {dayjs(selectedDate).format("MMM D")} at {formData.callTime}
              </Text>
              <Text variant="bodyMedium" style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Priority:</Text>{" "}
                {formData.priority}
              </Text>
            </Card>

            <Text variant="titleMedium" style={styles.privacyTitle}>
              🔒 Privacy Settings
            </Text>
            <Text variant="bodySmall" style={styles.privacySubtitle}>
              Choose what personal information AI can share if the recipient
              asks
            </Text>

            <View style={styles.privacySettings}>
              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text variant="bodyMedium">Share personal details</Text>
                  <Text variant="bodySmall" style={styles.privacyDetail}>
                    Name, basic information
                  </Text>
                </View>
                <Switch
                  value={formData.sharePersonalInfo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sharePersonalInfo: value,
                    }))
                  }
                />
              </View>

              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text variant="bodyMedium">Share contact information</Text>
                  <Text variant="bodySmall" style={styles.privacyDetail}>
                    Email, phone number
                  </Text>
                </View>
                <Switch
                  value={formData.shareContactInfo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      shareContactInfo: value,
                    }))
                  }
                />
              </View>

              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text variant="bodyMedium">Share company information</Text>
                  <Text variant="bodySmall" style={styles.privacyDetail}>
                    Company name, job title
                  </Text>
                </View>
                <Switch
                  value={formData.shareCompanyInfo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      shareCompanyInfo: value,
                    }))
                  }
                />
              </View>
            </View>

            <TextInput
              label="Special Instructions for AI (Optional)"
              value={formData.customInstructions}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, customInstructions: text }))
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="e.g., Be polite, mention I'm a regular customer, ask for Dr. Smith specifically..."
            />
          </View>
        );

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    const steps = ["task", "recipient", "schedule", "review"];
    return ((steps.indexOf(modalStep) + 1) / steps.length) * 100;
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            🤖 AI Assistant
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Schedule calls for your AI to handle
          </Text>
        </View>
        <IconButton
          icon={currentView === "calendar" ? "view-list" : "calendar"}
          onPress={() =>
            setCurrentView(currentView === "calendar" ? "list" : "calendar")
          }
          iconColor={theme.colors.primary}
        />
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {currentView === "calendar" ? (
          <>
            {/* Calendar */}
            <Card style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                onDayPress={handleDateSelect}
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
                  monthTextColor: theme.colors.onSurface,
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 13,
                }}
              />
            </Card>

            {/* AI Calls for Selected Date */}
            <Card style={styles.eventsCard}>
              <Text variant="titleLarge" style={styles.eventsTitle}>
                🤖 AI Calls - {dayjs(selectedDate).format("MMM D")}
              </Text>

              {getEventsForDate(selectedDate).length === 0 ? (
                <View style={styles.noEventsContainer}>
                  <Text variant="bodyLarge" style={styles.noEventsText}>
                    No AI calls scheduled for this day
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => setIsModalVisible(true)}
                    style={styles.scheduleButton}
                    icon="robot"
                  >
                    Schedule AI Call
                  </Button>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {getEventsForDate(selectedDate).map((event) => (
                    <Card key={event.id} style={styles.eventCard}>
                      <View style={styles.eventContent}>
                        <View style={styles.eventStatus}>
                          <Text
                            variant="bodyLarge"
                            style={styles.eventTimeText}
                          >
                            {dayjs(event.scheduledTime).format("h:mm A")}
                          </Text>
                          <Chip
                            icon={
                              event.status === "completed"
                                ? "check"
                                : event.status === "failed"
                                  ? "close"
                                  : event.status === "in_progress"
                                    ? "phone"
                                    : "clock"
                            }
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor:
                                  event.status === "completed"
                                    ? theme.colors.tertiary
                                    : event.status === "failed"
                                      ? theme.colors.errorContainer
                                      : event.status === "in_progress"
                                        ? theme.colors.secondaryContainer
                                        : theme.colors.primaryContainer,
                              },
                            ]}
                            textStyle={styles.statusChipText}
                          >
                            {event.status}
                          </Chip>
                        </View>

                        <View style={styles.eventDetails}>
                          <Text variant="titleMedium" style={styles.eventTitle}>
                            {event.title}
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={styles.eventRecipient}
                          >
                            📞 {event.recipient?.phone || "No phone"} •{" "}
                            {event.recipient?.name || "Unknown"}
                          </Text>
                          {event.description && (
                            <Text
                              variant="bodySmall"
                              style={styles.eventDescription}
                            >
                              {event.description}
                            </Text>
                          )}
                        </View>

                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => {
                            Alert.alert(
                              "Cancel AI Call",
                              "Are you sure you want to cancel this AI call?",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => deleteEvent(event.id),
                                },
                              ]
                            );
                          }}
                          iconColor={theme.colors.error}
                        />
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </Card>
          </>
        ) : (
          /* List View */
          <Card style={styles.listCard}>
            <Text variant="titleLarge" style={styles.listTitle}>
              🤖 All Scheduled AI Calls
            </Text>

            {getUpcomingEvents().length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text variant="bodyLarge" style={styles.noEventsText}>
                  No AI calls scheduled
                </Text>
                <Text variant="bodyMedium" style={styles.noEventsSubtext}>
                  Your AI assistant is ready to make calls on your behalf
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setIsModalVisible(true)}
                  style={styles.scheduleButton}
                  icon="robot"
                >
                  Schedule First AI Call
                </Button>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {getUpcomingEvents().map((event) => (
                  <Card key={event.id} style={styles.eventCard}>
                    <View style={styles.eventContent}>
                      <View style={styles.eventTime}>
                        <Text variant="bodyMedium" style={styles.eventDate}>
                          {dayjs(event.scheduledTime).format("MMM D")}
                        </Text>
                        <Text variant="bodyLarge" style={styles.eventTimeText}>
                          {dayjs(event.scheduledTime).format("h:mm A")}
                        </Text>
                      </View>

                      <View style={styles.eventDetails}>
                        <Text variant="titleMedium" style={styles.eventTitle}>
                          {event.title}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={styles.eventRecipient}
                        >
                          📞 {event.recipient?.phone || "No phone"} •{" "}
                          {event.recipient?.name || "Unknown"}
                        </Text>
                        <Chip
                          icon="robot"
                          style={styles.taskTypeChip}
                          textStyle={styles.taskTypeChipText}
                        >
                          {event.taskType || "AI Task"}
                        </Chip>
                      </View>

                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteEvent(event.id)}
                        iconColor={theme.colors.error}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </Card>
        )}
      </Animated.ScrollView>

      {/* Schedule AI Call Modal */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => {
            setIsModalVisible(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getStepProgress()}%` },
                  ]}
                />
              </View>
              <Text variant="bodySmall" style={styles.progressText}>
                Step{" "}
                {["task", "recipient", "schedule", "review"].indexOf(
                  modalStep
                ) + 1}{" "}
                of 4
              </Text>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {renderModalContent()}
            </ScrollView>

            <Divider style={styles.modalDivider} />

            <View style={styles.modalActions}>
              {modalStep !== "task" && (
                <Button
                  mode="outlined"
                  onPress={handlePrevStep}
                  style={styles.prevButton}
                >
                  Previous
                </Button>
              )}

              {modalStep === "task" && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsModalVisible(false);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              )}

              {modalStep !== "review" ? (
                <Button
                  mode="contained"
                  onPress={handleNextStep}
                  disabled={!validateCurrentStep()}
                  style={styles.nextButton}
                >
                  Next
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleScheduleAICall}
                  style={styles.scheduleModalButton}
                  icon="robot"
                >
                  Schedule AI Call
                </Button>
              )}
            </View>
          </Card>
        </Modal>
      </Portal>

      {/* FAB */}
      <Animated.View style={[styles.fab, fabStyle]}>
        <FAB
          icon="robot"
          onPress={() => setIsModalVisible(true)}
          style={[styles.fabButton, { backgroundColor: theme.colors.primary }]}
          label="AI Call"
        />
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    calendarCard: {
      marginBottom: 16,
      padding: 16,
    },
    eventsCard: {
      marginBottom: 16,
      padding: 20,
    },
    eventsTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 16,
    },
    listCard: {
      marginBottom: 16,
      padding: 20,
    },
    listTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 16,
    },
    noEventsContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    noEventsText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
      textAlign: "center",
    },
    noEventsSubtext: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
      textAlign: "center",
      fontSize: 14,
    },
    scheduleButton: {
      marginTop: 8,
    },
    eventsList: {
      gap: 12,
    },
    eventCard: {
      padding: 16,
    },
    eventContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    eventStatus: {
      alignItems: "center",
      marginRight: 16,
      minWidth: 70,
    },
    eventTime: {
      alignItems: "center",
      marginRight: 16,
      minWidth: 70,
    },
    eventDate: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 4,
    },
    eventTimeText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    eventDetails: {
      flex: 1,
    },
    eventTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 4,
    },
    eventRecipient: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    eventDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    statusChip: {
      alignSelf: "flex-start",
      height: 24,
      marginTop: 4,
    },
    statusChipText: {
      fontSize: 12,
    },
    taskTypeChip: {
      alignSelf: "flex-start",
      height: 24,
      marginTop: 4,
    },
    taskTypeChipText: {
      fontSize: 12,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
    },
    fabButton: {
      elevation: 8,
    },
    modalContainer: {
      margin: 20,
      maxHeight: "90%",
    },
    modalCard: {
      padding: 24,
      flex: 1,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
    },
    progressText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    modalScrollView: {
      flex: 1,
    },
    stepContent: {
      paddingBottom: 20,
    },
    stepTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      marginBottom: 8,
    },
    stepSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 24,
    },
    input: {
      backgroundColor: "transparent",
      marginBottom: 16,
    },
    phoneNumberSection: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
    },
    phoneNumberLabel: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "600",
      marginBottom: 12,
    },
    phoneNumberInput: {
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },
    phoneHint: {
      color: theme.colors.onPrimaryContainer,
      textAlign: "center",
      fontStyle: "italic",
    },
    quickContactsSection: {
      padding: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginTop: 8,
    },
    quickContactsTitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      fontStyle: "italic",
    },
    sectionLabel: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 12,
    },
    taskTypeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    taskTypeChip: {
      marginBottom: 8,
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    radioLabel: {
      marginLeft: 8,
      flex: 1,
    },
    selectedDateText: {
      color: theme.colors.primary,
      fontWeight: "600",
      marginBottom: 20,
      textAlign: "center",
    },
    timeSlotsContainer: {
      marginBottom: 20,
    },
    timeSlot: {
      marginRight: 8,
    },
    durationOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    durationChip: {
      marginBottom: 8,
    },
    callSettings: {
      gap: 16,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    retryOptions: {
      flexDirection: "row",
      gap: 8,
    },
    retryChip: {
      minWidth: 40,
    },
    reviewCard: {
      padding: 16,
      marginBottom: 20,
      backgroundColor: theme.colors.surfaceVariant,
    },
    reviewSectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 12,
    },
    reviewText: {
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    reviewLabel: {
      fontWeight: "600",
    },
    privacyTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 8,
    },
    privacySubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
    },
    privacySettings: {
      gap: 16,
      marginBottom: 20,
    },
    privacyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    privacyInfo: {
      flex: 1,
      marginRight: 16,
    },
    privacyDetail: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    modalDivider: {
      marginVertical: 16,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
    },
    prevButton: {
      flex: 1,
    },
    cancelButton: {
      flex: 1,
    },
    nextButton: {
      flex: 2,
    },
    scheduleModalButton: {
      flex: 2,
    },
  });

export default SchedulerScreen;
