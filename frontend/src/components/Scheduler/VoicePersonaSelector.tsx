import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  SegmentedButtons,
  useTheme,
  HelperText,
} from "react-native-paper";
import { VoicePersona } from "../../types";

interface VoicePersonaSelectorProps {
  selectedPersona: VoicePersona;
  onPersonaChange: (persona: VoicePersona) => void;
  error?: string;
}

export const VoicePersonaSelector: React.FC<VoicePersonaSelectorProps> = ({
  selectedPersona,
  onPersonaChange,
  error,
}) => {
  const theme = useTheme();
  const styles = createPersonaStyles(theme);

  const personaOptions = [
    {
      value: "friendly" as VoicePersona,
      label: "😊 Friendly",
      description: "Warm, casual, and approachable",
    },
    {
      value: "formal" as VoicePersona,
      label: "🎩 Formal",
      description: "Professional and polished",
    },
    {
      value: "funny" as VoicePersona,
      label: "😄 Funny",
      description: "Light-hearted with humor",
    },
  ];

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Voice Personality
      </Text>
      <Text variant="bodyMedium" style={styles.sectionDescription}>
        How should the AI sound during your call?
      </Text>

      <SegmentedButtons
        value={selectedPersona}
        onValueChange={onPersonaChange}
        buttons={personaOptions.map((option) => ({
          value: option.value,
          label: option.label,
          style:
            selectedPersona === option.value
              ? styles.selectedButton
              : styles.button,
        }))}
        style={styles.segmentedButtons}
      />

      <View style={styles.descriptions}>
        {personaOptions.map((option) => (
          <Text
            key={option.value}
            variant="bodySmall"
            style={[
              styles.description,
              selectedPersona === option.value && styles.selectedDescription,
            ]}
          >
            {selectedPersona === option.value &&
              `${option.label}: ${option.description}`}
          </Text>
        ))}
      </View>

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
};

const createPersonaStyles = (theme: any) =>
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
    segmentedButtons: {
      marginBottom: 8,
    },
    button: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    selectedButton: {
      backgroundColor: theme.colors.primaryContainer,
    },
    descriptions: {
      minHeight: 20,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    selectedDescription: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
  });
