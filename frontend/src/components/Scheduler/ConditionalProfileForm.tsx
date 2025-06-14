// src/components/ConditionalProfileForm.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  useTheme,
  HelperText,
  Surface,
} from "react-native-paper";
import { UserProfile } from "../../types";

interface ConditionalProfileFormProps {
  missingFields: (keyof UserProfile)[];
  additionalData: {
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
  };
  onDataChange: (
    field: keyof ConditionalProfileFormProps["additionalData"],
    value: string
  ) => void;
  errors?: {
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
  };
}

export const ConditionalProfileForm: React.FC<ConditionalProfileFormProps> = ({
  missingFields,
  additionalData,
  onDataChange,
  errors,
}) => {
  const theme = useTheme();
  const styles = createConditionalStyles(theme);

  type FieldType = "text" | "number";

  type FieldConfig = {
    label: string;
    placeholder: string;
    icon: string;
    keyboardType: "default" | "email-address" | "numeric" | "phone-pad";
    type: FieldType;
  };

  const fieldConfig: Record<
    keyof ConditionalProfileFormProps["additionalData"],
    FieldConfig
  > = {
    name: {
      label: "Your Name",
      placeholder: "Enter your full name",
      icon: "👤",
      keyboardType: "default",
      type: "text",
    },
    phone: {
      label: "Phone Number",
      placeholder: "Enter your phone number",
      icon: "📞",
      keyboardType: "phone-pad",
      type: "number",
    },
    company: {
      label: "Company",
      placeholder: "Enter your company name",
      icon: "🏢",
      keyboardType: "default",
      type: "text",
    },
    jobTitle: {
      label: "Job Title",
      placeholder: "Enter your job title",
      icon: "💼",
      keyboardType: "default",
      type: "text",
    },
  };

  const handleChange = (
    field: keyof ConditionalProfileFormProps["additionalData"],
    raw: string
  ) => {
    const cfg = fieldConfig[field];
    let filtered = raw;

    if (cfg.type === "number") {
      // strip out anything but digits
      filtered = raw.replace(/\D+/g, "");
    } else {
      // letters and spaces only
      filtered = raw.replace(/[^A-Za-z ]+/g, "");
    }

    onDataChange(field, filtered);
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          🔍 Additional Information Required
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Please provide the missing information for your selected profile
          fields
        </Text>
      </View>

      <View style={styles.fieldsList}>
        {missingFields.map((field) => {
          const cfg = fieldConfig[field as keyof typeof fieldConfig];
          if (!cfg) return null;

          const value =
            additionalData[field as keyof typeof additionalData] || "";
          const errorMsg = errors && errors[field as keyof typeof errors];

          return (
            <View key={field} style={styles.fieldContainer}>
              <TextInput
                label={`${cfg.icon} ${cfg.label} *`}
                value={value}
                onChangeText={(txt) => handleChange(field as any, txt)}
                mode="outlined"
                placeholder={cfg.placeholder}
                style={styles.input}
                error={!!errorMsg}
                keyboardType={cfg.keyboardType}
              />
              <HelperText type="error" visible={!!errorMsg}>
                {errorMsg}
              </HelperText>
            </View>
          );
        })}
      </View>
    </Surface>
  );
};

const createConditionalStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.secondaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    header: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.colors.onSecondaryContainer,
      fontWeight: "600",
      marginBottom: 4,
    },
    sectionDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    fieldsList: {
      gap: 12,
    },
    fieldContainer: {
      gap: 4,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
  });
