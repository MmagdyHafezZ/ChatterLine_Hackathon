// src/components/ProfileDataSelector.tsx

import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import {
  Text,
  Checkbox,
  Surface,
  useTheme,
  HelperText,
} from "react-native-paper";
import { UserProfile } from "../../types";

interface ProfileDataSelectorProps {
  selectedFields: (keyof UserProfile)[];
  onFieldsChange: (fields: (keyof UserProfile)[]) => void;
  profile: UserProfile;
  error?: string;
}

export const ProfileDataSelector: React.FC<ProfileDataSelectorProps> = ({
  selectedFields,
  onFieldsChange,
  profile,
  error,
}) => {
  const theme = useTheme();
  const styles = createProfileStyles(theme);

  const profileFields = [
    { key: "name" as keyof UserProfile, label: "Name", icon: "👤" },
    { key: "phone" as keyof UserProfile, label: "Phone Number", icon: "📞" },
    { key: "company" as keyof UserProfile, label: "Company", icon: "🏢" },
    { key: "jobTitle" as keyof UserProfile, label: "Job Title", icon: "💼" },
    { key: "location" as keyof UserProfile, label: "Location", icon: "📍" },
    { key: "bio" as keyof UserProfile, label: "Bio", icon: "📝" },
  ];

  const toggleField = (field: keyof UserProfile) => {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field];
    onFieldsChange(newFields);
  };

  const getFieldValue = (field: keyof UserProfile): string =>
    typeof profile[field] === "string" ? (profile[field] as string) : "";

  const isFieldEmpty = (field: keyof UserProfile): boolean =>
    !getFieldValue(field).trim();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Profile Information to Use
      </Text>
      <Text variant="bodyMedium" style={styles.sectionDescription}>
        Select which parts of your profile the AI should reference
      </Text>

      <View style={styles.fieldsList}>
        {profileFields.map((field) => {
          const isSelected = selectedFields.includes(field.key);
          const empty = isFieldEmpty(field.key);
          const value = getFieldValue(field.key);

          return (
            <Pressable
              key={field.key}
              onPress={() => toggleField(field.key)}
              android_ripple={{ color: theme.colors.onSurfaceVariant }}
              style={({ pressed }) => [
                styles.fieldItem,
                isSelected && styles.selectedFieldItem,
                pressed && styles.pressedItem,
              ]}
            >
              <Surface
                style={StyleSheet.absoluteFill}
                elevation={isSelected ? 2 : 1}
              />

              <Checkbox
                status={isSelected ? "checked" : "unchecked"}
                // disable separate tap
                onPress={() => toggleField(field.key)}
                uncheckedColor={theme.colors.onSurfaceVariant}
              />

              <View style={styles.fieldContent}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldIcon}>{field.icon}</Text>
                  <Text variant="titleSmall" style={styles.fieldLabel}>
                    {field.label}
                  </Text>
                  {empty && <Text style={styles.missingBadge}>Missing</Text>}
                </View>
                <Text
                  variant="bodySmall"
                  style={[styles.fieldValue, empty && styles.emptyFieldValue]}
                >
                  {value || "Not provided"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
};

const createProfileStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 4,
    },
    sectionDescription: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
    },
    fieldsList: {
      gap: 8,
    },
    fieldItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: Platform.OS === "android" ? "hidden" : undefined,
    },
    selectedFieldItem: {
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    pressedItem: {
      opacity: 0.75,
    },
    fieldContent: {
      flex: 1,
      marginLeft: 8,
    },
    fieldHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    fieldIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    fieldLabel: {
      color: theme.colors.onSurface,
      fontWeight: "500",
      flex: 1,
    },
    missingBadge: {
      fontSize: 10,
      color: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontWeight: "500",
    },
    fieldValue: {
      color: theme.colors.onSurfaceVariant,
    },
    emptyFieldValue: {
      fontStyle: "italic",
      color: theme.colors.outline,
    },
  });
