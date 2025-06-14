import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  Portal,
  Modal,
  IconButton,
  Divider,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useCallStore, CallFormData } from "../store/callStore";
import { useUserStore } from "../store/userStore";
import { VoicePersona, UserProfile } from "../types";

// Enhanced Form Components
import { CallDetailsForm } from "../components/Scheduler/CallDetailsForm";
import { CustomDateTimePicker } from "../components/Scheduler/DateTimePicker";
import { VoicePersonaSelector } from "../components/Scheduler/VoicePersonaSelector";
import { ProfileDataSelector } from "../components/Scheduler/ProfileDataSelector";
import { ConditionalProfileForm } from "../components/Scheduler/ConditionalProfileForm";

export interface FormErrors {
  title?: string;
  scheduledDate?: string;
  voicePersona?: string;
  selectedProfileFields?: string;
  additionalData?: {
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
  };
}

interface SchedulerScreenProps {
  onClose?: () => void;
}

const { width } = Dimensions.get("window");

const SchedulerScreen: React.FC<SchedulerScreenProps> = ({ onClose }) => {
  const theme = useTheme();
  const { addEventFromForm } = useCallStore();
  const { profile } = useUserStore();

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CallFormData>({
    title: "",
    description: "",
    scheduledDate: new Date(),
    voicePersona: "friendly",
    selectedProfileFields: [],
    additionalData: {},
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Animation values
  const slideAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  // Dummy profile with realistic missing data scenarios
  const dummyProfile: UserProfile = {
    id: "demo-user",
    name: profile?.name || "Sarah Chen",
    email: profile?.email || "sarah.chen@example.com",
    phone: profile?.phone || "",
    company: profile?.company || "",
    jobTitle: profile?.jobTitle || "Product Designer",
    location: profile?.location || "Seattle, WA",
    bio: profile?.bio || "",
    voicePersona: profile?.voicePersona || "friendly",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const currentProfile = profile || dummyProfile;

  // Steps configuration
  const steps = [
    {
      title: "Call Details",
      subtitle: "What's this call about?",
      icon: "💬",
      component: "details",
    },
    {
      title: "Schedule",
      subtitle: "When should it happen?",
      icon: "📅",
      component: "datetime",
    },
    {
      title: "AI Personality",
      subtitle: "How should your AI sound?",
      icon: "🎭",
      component: "persona",
    },
    {
      title: "Profile Info",
      subtitle: "What should the AI know?",
      icon: "👤",
      component: "profile",
    },
    {
      title: "Review",
      subtitle: "Confirm your settings",
      icon: "✨",
      component: "review",
    },
  ];

  const totalSteps = steps.length;

  // Validation per step
  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: FormErrors = {};

      switch (step) {
        case 0:
          if (!formData.title.trim()) {
            newErrors.title = "Please enter a call title";
          } else if (formData.title.length < 3) {
            newErrors.title = "Title must be at least 3 characters";
          }
          break;

        case 1:
          const now = new Date();
          if (formData.scheduledDate <= now) {
            newErrors.scheduledDate = "Cannot schedule calls in the past";
          }
          break;

        case 2:
          if (!formData.voicePersona) {
            newErrors.voicePersona = "Please select an AI personality";
          }
          break;

        case 3:
          if (formData.selectedProfileFields.length === 0) {
            newErrors.selectedProfileFields =
              "Select at least one profile field";
          }

          const additionalDataErrors: FormErrors["additionalData"] = {};
          const missingFields = getMissingProfileFields();

          missingFields.forEach((field) => {
            if (field === "name" && !formData.additionalData.name?.trim()) {
              additionalDataErrors.name = "Name is required";
            }
            if (field === "phone" && !formData.additionalData.phone?.trim()) {
              additionalDataErrors.phone = "Phone number is required";
            }
            if (
              field === "company" &&
              !formData.additionalData.company?.trim()
            ) {
              additionalDataErrors.company = "Company is required";
            }
            if (
              field === "jobTitle" &&
              !formData.additionalData.jobTitle?.trim()
            ) {
              additionalDataErrors.jobTitle = "Job title is required";
            }
          });

          if (Object.keys(additionalDataErrors).length > 0) {
            newErrors.additionalData = additionalDataErrors;
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  // Navigation
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        slideAnimation.value = withSpring(step);
        progressAnimation.value = withTiming(step / (totalSteps - 1));
        setCurrentStep(step);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [slideAnimation, progressAnimation, totalSteps]
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      goToStep(currentStep + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [currentStep, validateStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Form handlers
  const updateFormData = useCallback((updates: Partial<CallFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const updateAdditionalData = useCallback(
    (field: keyof CallFormData["additionalData"], value: string) => {
      setFormData((prev) => ({
        ...prev,
        additionalData: { ...prev.additionalData, [field]: value },
      }));
      setErrors((prev) => ({
        ...prev,
        additionalData: prev.additionalData
          ? { ...prev.additionalData, [field]: undefined }
          : undefined,
      }));
    },
    []
  );

  const getMissingProfileFields = useCallback((): (keyof UserProfile)[] => {
    return formData.selectedProfileFields.filter((field) => {
      const value = currentProfile[field];
      return !value || (typeof value === "string" && !value.trim());
    });
  }, [formData.selectedProfileFields, currentProfile]);

  // Close handler
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);

    try {
      const newEvent = addEventFromForm(formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);

      // Reset form
      setFormData({
        title: "",
        description: "",
        scheduledDate: new Date(),
        voicePersona: "friendly",
        selectedProfileFields: [],
        additionalData: {},
      });
      setCurrentStep(0);
      slideAnimation.value = withSpring(0);
      progressAnimation.value = withTiming(0);
      setErrors({});
    } catch (error) {
      Alert.alert("Error", "Failed to schedule call. Please try again.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    currentStep,
    validateStep,
    addEventFromForm,
    slideAnimation,
    progressAnimation,
  ]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    handleClose();
  }, [handleClose]);

  // Animated styles
  const slideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          slideAnimation.value,
          [0, totalSteps - 1],
          [0, -(totalSteps - 1) * width]
        ),
      },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const styles = createStyles(theme);

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CallDetailsForm
            title={formData.title}
            description={formData.description}
            onTitleChange={(title) => updateFormData({ title })}
            onDescriptionChange={(description) =>
              updateFormData({ description })
            }
            titleError={errors.title}
          />
        );
      case 1:
        return (
          <CustomDateTimePicker
            selectedDate={formData.scheduledDate}
            onDateChange={(scheduledDate) => updateFormData({ scheduledDate })}
            error={errors.scheduledDate}
          />
        );
      case 2:
        return (
          <VoicePersonaSelector
            selectedPersona={formData.voicePersona}
            onPersonaChange={(voicePersona) => updateFormData({ voicePersona })}
            error={errors.voicePersona}
          />
        );
      case 3:
        return (
          <View>
            <ProfileDataSelector
              selectedFields={formData.selectedProfileFields}
              onFieldsChange={(selectedProfileFields) =>
                updateFormData({ selectedProfileFields })
              }
              profile={currentProfile}
              error={errors.selectedProfileFields}
            />
            {getMissingProfileFields().length > 0 && (
              <View style={styles.conditionalSection}>
                <ConditionalProfileForm
                  missingFields={getMissingProfileFields()}
                  additionalData={formData.additionalData}
                  onDataChange={updateAdditionalData}
                  errors={errors.additionalData}
                />
              </View>
            )}
          </View>
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            profile={currentProfile}
            missingFields={getMissingProfileFields()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <LinearGradient
        colors={[theme.colors.primary + "10", theme.colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header with close button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="close"
            size={24}
            onPress={handleClose}
            style={styles.closeButton}
          />
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Schedule AI Call
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {steps[currentStep].subtitle}
        </Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Text variant="bodySmall" style={styles.progressText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepIndicators}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepIndicator}>
            <View
              style={[
                styles.stepCircle,
                index === currentStep && styles.stepCircleActive,
                index < currentStep && styles.stepCircleCompleted,
              ]}
            >
              <Text
                style={[
                  styles.stepIcon,
                  index === currentStep && styles.stepIconActive,
                  index < currentStep && styles.stepIconCompleted,
                ]}
              >
                {index < currentStep ? "✓" : step.icon}
              </Text>
            </View>
            <Text
              variant="labelSmall"
              style={[
                styles.stepLabel,
                index === currentStep && styles.stepLabelActive,
              ]}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Form Content */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.formWrapper}>
          <Animated.View style={[styles.formSlider, slideStyle]}>
            {steps.map((_, index) => (
              <View key={index} style={styles.formStep}>
                <ScrollView
                  style={styles.stepContent}
                  contentContainerStyle={styles.stepContentContainer}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Card style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepEmoji}>{steps[index].icon}</Text>
                      <Text variant="titleLarge" style={styles.stepTitle}>
                        {steps[index].title}
                      </Text>
                    </View>
                    <Divider style={styles.stepDivider} />
                    <View style={styles.stepBody}>
                      {renderStepContent(index)}
                    </View>
                  </Card>
                </ScrollView>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            mode="outlined"
            onPress={prevStep}
            disabled={currentStep === 0}
            style={[styles.navButton, styles.backButton]}
            contentStyle={styles.navButtonContent}
          >
            ← Back
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              mode="contained"
              onPress={nextStep}
              style={[styles.navButton, styles.nextButton]}
              contentStyle={styles.navButtonContent}
            >
              Next →
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={[styles.navButton, styles.submitButton]}
              contentStyle={styles.navButtonContent}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Call ✨"}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Portal>
        <Modal
          visible={showSuccessModal}
          onDismiss={handleSuccessModalClose}
          contentContainerStyle={styles.successModal}
        >
          <View style={styles.successContent}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text variant="headlineSmall" style={styles.successTitle}>
              Call Scheduled!
            </Text>
            <Text variant="bodyLarge" style={styles.successMessage}>
              Your AI call "{formData.title}" is scheduled for{" "}
              {dayjs(formData.scheduledDate).format("MMM D, YYYY at h:mm A")}
            </Text>
            <View style={styles.successDetails}>
              <Text variant="bodyMedium" style={styles.successDetail}>
                🎭 Personality: {formData.voicePersona}
              </Text>
              <Text variant="bodyMedium" style={styles.successDetail}>
                📋 Profile fields: {formData.selectedProfileFields.length}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handleSuccessModalClose}
              style={styles.successButton}
            >
              Perfect! 🚀
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

// Review Step Component
const ReviewStep: React.FC<{
  formData: CallFormData;
  profile: UserProfile;
  missingFields: (keyof UserProfile)[];
}> = ({ formData, profile, missingFields }) => {
  const theme = useTheme();
  const styles = createReviewStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.description}>
        Review your call settings before scheduling
      </Text>

      <View style={styles.sections}>
        {/* Call Details */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            💬 Call Details
          </Text>
          <Text variant="bodyMedium" style={styles.sectionContent}>
            <Text style={styles.label}>Title: </Text>
            {formData.title}
          </Text>
          {formData.description && (
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={styles.label}>Description: </Text>
              {formData.description}
            </Text>
          )}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            📅 Scheduled For
          </Text>
          <Text variant="bodyMedium" style={styles.sectionContent}>
            {dayjs(formData.scheduledDate).format("dddd, MMMM D, YYYY")}
          </Text>
          <Text variant="bodyMedium" style={styles.sectionContent}>
            {dayjs(formData.scheduledDate).format("h:mm A")}
          </Text>
        </View>

        {/* AI Personality */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            🎭 AI Personality
          </Text>
          <Text variant="bodyMedium" style={styles.sectionContent}>
            {formData.voicePersona.charAt(0).toUpperCase() +
              formData.voicePersona.slice(1)}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            👤 Profile Information
          </Text>
          {formData.selectedProfileFields.map((field) => (
            <Text
              key={field}
              variant="bodyMedium"
              style={styles.sectionContent}
            >
              • {field}:{" "}
              {(() => {
                const value =
                  profile[field] ||
                  formData.additionalData[
                    field as keyof typeof formData.additionalData
                  ];
                if (typeof value === "string") return value;
                if (value instanceof Date) return value.toLocaleString();
                if (typeof value === "object" && value !== null)
                  return JSON.stringify(value);
                return value ?? "Provided";
              })()}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const createReviewStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 20,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 8,
    },
    sections: {
      gap: 16,
    },
    section: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    sectionContent: {
      color: theme.colors.onSurfaceVariant,
    },
    label: {
      fontWeight: "500",
      color: theme.colors.onSurface,
    },
  });

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    closeButton: {
      margin: 0,
    },
    headerSpacer: {
      width: 48,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: 16,
    },
    progressContainer: {
      gap: 8,
    },
    progressBackground: {
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    progressText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    stepIndicators: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
    },
    stepIndicator: {
      alignItems: "center",
      flex: 1,
      gap: 8,
    },
    stepCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.outline,
    },
    stepCircleActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    stepCircleCompleted: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    stepIcon: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    stepIconActive: {
      fontSize: 18,
      color: theme.colors.primary,
    },
    stepIconCompleted: {
      fontSize: 16,
      color: theme.colors.onPrimary,
      fontWeight: "bold",
    },
    stepLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      fontSize: 10,
    },
    stepLabelActive: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    formContainer: {
      flex: 1,
    },
    formWrapper: {
      flex: 1,
      overflow: "hidden",
    },
    formSlider: {
      flex: 1,
      flexDirection: "row",
      width: width * 5,
    },
    formStep: {
      width: width,
    },
    stepContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
    stepContentContainer: {
      paddingBottom: 20,
    },
    stepCard: {
      marginVertical: 16,
      elevation: 3,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingBottom: 16,
      gap: 12,
    },
    stepEmoji: {
      fontSize: 24,
    },
    stepTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    stepDivider: {
      marginHorizontal: 20,
    },
    stepBody: {
      padding: 20,
    },
    conditionalSection: {
      marginTop: 16,
    },
    navigation: {
      flexDirection: "row",
      padding: 20,
      paddingTop: 16,
      backgroundColor: theme.colors.surface,
      elevation: 8,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      gap: 12,
    },
    navButton: {
      flex: 1,
    },
    navButtonContent: {
      paddingVertical: 8,
    },
    backButton: {
      maxWidth: 100,
    },
    nextButton: {
      minWidth: 120,
    },
    submitButton: {
      minWidth: 140,
    },
    successModal: {
      margin: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: "hidden",
    },
    successContent: {
      padding: 32,
      alignItems: "center",
      gap: 16,
    },
    successEmoji: {
      fontSize: 48,
    },
    successTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    successMessage: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      lineHeight: 24,
    },
    successDetails: {
      gap: 8,
      alignItems: "center",
    },
    successDetail: {
      color: theme.colors.onSurfaceVariant,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    successButton: {
      marginTop: 8,
      minWidth: 140,
    },
  });

export default SchedulerScreen;
