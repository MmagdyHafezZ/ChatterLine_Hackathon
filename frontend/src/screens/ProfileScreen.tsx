import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Switch,
  useTheme,
  IconButton,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useUserStore, useThemeStore } from "../store/userStore";
import { UserProfile, VoicePersona } from "../types";
import AnimatedButton from "../components/common/AnimatedButton";

const { width, height } = Dimensions.get("window");

const ExpoProfileScreen: React.FC = () => {
  // Always call hooks in consistent order
  const themeStoreData = useThemeStore();
  const userStoreData = useUserStore();

  const { profile, metrics, setProfile, updateProfile } = userStoreData || {};
  const { isDarkMode, toggleDarkMode } = themeStoreData || {};
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(!profile);

  // Destructure after ensuring hooks are called

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    jobTitle: profile?.jobTitle || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    voicePersona: profile?.voicePersona || ("friendly" as VoicePersona),
    avatar: profile?.avatar || null,
  });

  // Animation values - always initialize in same order
  const scrollY = useSharedValue(0);
  const fadeAnim = useSharedValue(1);
  const editingAnim = useSharedValue(isEditing ? 1 : 0);
  const statsAnimations = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  // Effects
  useEffect(() => {
    // Animate stats cards on mount
    statsAnimations.forEach((anim, index) => {
      anim.value = withDelay(index * 150, withSpring(1, { damping: 15 }));
    });
  }, []);

  useEffect(() => {
    editingAnim.value = withTiming(isEditing ? 1 : 0, { duration: 300 });
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Missing Information", "Please fill in name and email");
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const profileData: UserProfile = {
      id: profile?.id || `user_${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      jobTitle: formData.jobTitle.trim(),
      location: formData.location.trim(),
      bio: formData.bio.trim(),
      voicePersona: formData.voicePersona,
      avatar: formData.avatar,
      createdAt: profile?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (profile && updateProfile) {
      updateProfile(profileData);
    } else if (setProfile) {
      setProfile(profileData);
    }

    setIsEditing(false);
  }, [formData, profile, setProfile, updateProfile]);

  const handleAvatarPress = useCallback(async () => {
    if (!isEditing) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Change Avatar", "Avatar customization coming soon!", [
      { text: "OK", style: "default" },
    ]);
  }, [isEditing]);

  const handlePersonaSelect = useCallback(async (persona: VoicePersona) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData((prev) => ({ ...prev, voicePersona: persona }));
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      fadeAnim.value = interpolate(event.contentOffset.y, [0, 100], [1, 0.8]);
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: scrollY.value * 0.3 }],
  }));

  const editingContainerStyle = useAnimatedStyle(() => ({
    opacity: editingAnim.value,
    transform: [{ scale: interpolate(editingAnim.value, [0, 1], [0.95, 1]) }],
  }));
  if (!userStoreData) {
    return <ActivityIndicator />;
  }
  const voicePersonas = [
    {
      key: "friendly",
      label: "Friendly",
      emoji: "😊",
      description: "Warm and approachable",
      color: "#4CAF50",
    },
    {
      key: "formal",
      label: "Professional",
      emoji: "👔",
      description: "Business-focused",
      color: "#2196F3",
    },
    {
      key: "funny",
      label: "Casual",
      emoji: "😄",
      description: "Relaxed and fun",
      color: "#FF9800",
    },
  ];

  const statsData = [
    {
      label: "Total Calls",
      value: metrics?.totalCalls || 0,
      icon: "phone",
      color: theme.colors.primary,
      suffix: "",
    },
    {
      label: "Day Streak",
      value: metrics?.streak || 0,
      icon: "fire",
      color: "#FF6B35",
      suffix: " days",
    },
    {
      label: "Success Rate",
      value: Math.round((metrics?.completionRate || 0) * 100),
      icon: "check-circle",
      color: "#4CAF50",
      suffix: "%",
    },
    {
      label: "Total Hours",
      value: Math.floor((metrics?.totalMinutes || 0) / 60),
      icon: "clock",
      color: "#9C27B0",
      suffix: "h",
    },
  ];

  const renderStatCard = (stat: (typeof statsData)[0], index: number) => {
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: statsAnimations[index].value,
      transform: [
        { scale: statsAnimations[index].value },
        {
          translateY: interpolate(
            statsAnimations[index].value,
            [0, 1],
            [20, 0]
          ),
        },
      ],
    }));

    return (
      <Animated.View key={stat.label} style={[styles.statCard, animatedStyle]}>
        <Card style={[styles.statCardInner, { borderLeftColor: stat.color }]}>
          <View style={styles.statContent}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: `${stat.color}20` },
                ]}
              >
                <IconButton
                  icon={stat.icon}
                  size={20}
                  iconColor={stat.color}
                  style={styles.statIcon}
                />
              </View>
              <Text
                variant="headlineMedium"
                style={[styles.statNumber, { color: stat.color }]}
              >
                {stat.value}
                {stat.suffix}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <LinearGradient
        colors={[
          theme.colors.background || "#ffffff",
          theme.colors.surface || "#f5f5f5",
          theme.colors.surfaceVariant || "#e0e0e0",
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Enhanced Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <Text variant="headlineLarge" style={styles.headerTitle}>
            {isEditing ? "Edit Profile" : "Profile"}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {isEditing
              ? "Update your information"
              : "Manage your account settings"}
          </Text>
        </View>
        {profile && !isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.editIconButton}
          >
            <IconButton icon="pencil" size={24} iconColor="white" />
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              style={styles.avatarContainer}
            >
              <Avatar.Text
                size={120}
                label={
                  formData.name ? formData.name.charAt(0).toUpperCase() : "U"
                }
                style={styles.avatar}
              />
              {isEditing && (
                <View style={styles.avatarOverlay}>
                  <IconButton icon="camera" size={24} iconColor="white" />
                  <Text variant="bodySmall" style={styles.avatarOverlayText}>
                    Change Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {!isEditing && profile ? (
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>
                  {profile.name}
                </Text>
                <Text variant="bodyMedium" style={styles.profileEmail}>
                  {profile.email}
                </Text>
                {profile.jobTitle && profile.company && (
                  <Chip icon="briefcase" style={styles.jobChip}>
                    {profile.jobTitle} at {profile.company}
                  </Chip>
                )}
                {profile.location && (
                  <Chip icon="map-marker" style={styles.locationChip}>
                    {profile.location}
                  </Chip>
                )}
                {profile.bio && (
                  <Text variant="bodyMedium" style={styles.bioText}>
                    {profile.bio}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </Card>

        {/* Enhanced Form Section */}
        {isEditing && (
          <Animated.View style={editingContainerStyle}>
            <Card style={styles.formCard}>
              <Text variant="titleLarge" style={styles.formTitle}>
                Personal Information
              </Text>

              <View style={styles.formGrid}>
                <View style={styles.formRow}>
                  <TextInput
                    label="Full Name *"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, name: text }))
                    }
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    label="Email Address *"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, email: text }))
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="email" />}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    label="Phone Number"
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, phone: text }))
                    }
                    keyboardType="phone-pad"
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="phone" />}
                  />
                </View>

                <View style={styles.formRowDouble}>
                  <TextInput
                    label="Job Title"
                    value={formData.jobTitle}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, jobTitle: text }))
                    }
                    style={[styles.input, styles.inputHalf]}
                    mode="outlined"
                    left={<TextInput.Icon icon="briefcase" />}
                  />
                  <TextInput
                    label="Company"
                    value={formData.company}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, company: text }))
                    }
                    style={[styles.input, styles.inputHalf]}
                    mode="outlined"
                    left={<TextInput.Icon icon="domain" />}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    label="Location"
                    value={formData.location}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, location: text }))
                    }
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="map-marker" />}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    label="Bio / About"
                    value={formData.bio}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, bio: text }))
                    }
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                    mode="outlined"
                    left={<TextInput.Icon icon="text" />}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Enhanced Stats Grid */}
        {metrics && !isEditing && (
          <View style={styles.statsContainer}>
            <Text variant="titleLarge" style={styles.statsTitle}>
              Your Statistics
            </Text>
            <View style={styles.statsGrid}>
              {statsData.map((stat, index) => renderStatCard(stat, index))}
            </View>
          </View>
        )}

        {/* Settings Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              App Preferences
            </Text>
          </View>

          <View style={styles.settingsGrid}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  Dark Mode
                </Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDarkMode || false}
                onValueChange={toggleDarkMode}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  Haptic Feedback
                </Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Feel vibrations for app interactions
                </Text>
              </View>
              <Switch value={true} disabled />
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <AnimatedButton
              mode="outlined"
              onPress={() => {
                setIsEditing(false);
                if (profile) {
                  setFormData({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone || "",
                    company: profile.company || "",
                    jobTitle: profile.jobTitle || "",
                    location: profile.location || "",
                    bio: profile.bio || "",
                    voicePersona: profile.voicePersona,
                    avatar: profile.avatar || null,
                  });
                }
              }}
              style={styles.cancelButton}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              icon="content-save"
            >
              Save Changes
            </AnimatedButton>
          </View>
        )}
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    editIconButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 100,
    },
    profileCard: {
      marginBottom: 20,
      padding: 24,
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    avatarSection: {
      alignItems: "center",
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarOverlayText: {
      color: "white",
      fontSize: 12,
      marginTop: -8,
    },
    profileInfo: {
      alignItems: "center",
      gap: 8,
    },
    profileName: {
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    profileEmail: {
      color: theme.colors.onSurfaceVariant,
    },
    jobChip: {
      marginTop: 8,
    },
    locationChip: {
      marginTop: 4,
    },
    bioText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 16,
    },
    formCard: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    formTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 20,
    },
    formGrid: {
      gap: 16,
    },
    formRow: {
      width: "100%",
    },
    formRowDouble: {
      flexDirection: "row",
      gap: 12,
    },
    input: {
      backgroundColor: "transparent",
    },
    inputHalf: {
      flex: 1,
    },
    textArea: {
      backgroundColor: "transparent",
      minHeight: 100,
    },
    statsContainer: {
      marginBottom: 20,
    },
    statsTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: (width - 52) / 2,
    },
    statCardInner: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      elevation: 3,
      borderLeftWidth: 4,
    },
    statContent: {
      gap: 8,
    },
    statHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    statIconContainer: {
      borderRadius: 20,
      padding: 4,
    },
    statIcon: {
      margin: 0,
    },
    statNumber: {
      fontWeight: "700",
      flex: 1,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    sectionCard: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 4,
    },
    sectionDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    personaGrid: {
      gap: 12,
    },
    personaCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      position: "relative",
    },
    selectedPersonaCard: {
      backgroundColor: theme.colors.primaryContainer,
    },
    personaIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    personaEmoji: {
      fontSize: 24,
    },
    personaLabel: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 4,
    },
    personaDescription: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    selectedIndicator: {
      position: "absolute",
      top: 8,
      right: 8,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    settingsGrid: {
      gap: 16,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    settingContent: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      color: theme.colors.onSurface,
      fontWeight: "500",
      marginBottom: 4,
    },
    settingDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 2,
    },
  });

export default ExpoProfileScreen;
