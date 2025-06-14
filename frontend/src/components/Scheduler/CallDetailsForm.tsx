import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  useTheme,
  HelperText,
  Surface,
} from "react-native-paper";

interface CallDetailsFormProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  titleError?: string;
}

export const CallDetailsForm: React.FC<CallDetailsFormProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleError,
}) => {
  const theme = useTheme();
  const styles = createCallDetailsStyles(theme);

  const callSuggestions = [
    "Weekly team sync",
    "Client presentation",
    "Project kickoff",
    "Performance review",
    "Strategy planning",
    "Customer discovery call",
  ];

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.description}>
        Give your AI call a clear title and add any specific details you'd like
        to discuss.
      </Text>

      <TextInput
        label="Call Title"
        value={title}
        onChangeText={onTitleChange}
        mode="outlined"
        style={styles.input}
        error={!!titleError}
        placeholder="e.g., Weekly team sync, Client presentation..."
        left={<TextInput.Icon icon="chat-outline" />}
      />
      <HelperText type="error" visible={!!titleError}>
        {titleError}
      </HelperText>

      <Text variant="bodyMedium" style={styles.suggestionsTitle}>
        💡 Quick suggestions:
      </Text>
      <View style={styles.suggestions}>
        {callSuggestions.map((suggestion, index) => (
          <Surface key={index} style={styles.suggestionChip} elevation={1}>
            <Text
              variant="bodySmall"
              style={styles.suggestionText}
              onPress={() => onTitleChange(suggestion)}
            >
              {suggestion}
            </Text>
          </Surface>
        ))}
      </View>

      <TextInput
        label="Additional Details (Optional)"
        value={description}
        onChangeText={onDescriptionChange}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.textArea}
        placeholder="Add any specific topics, agenda items, or goals for this call..."
        left={<TextInput.Icon icon="text-box-outline" />}
      />
    </View>
  );
};

const createCallDetailsStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 16,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 8,
    },
    input: {
      backgroundColor: "transparent",
    },
    textArea: {
      backgroundColor: "transparent",
      minHeight: 100,
    },
    suggestionsTitle: {
      color: theme.colors.onSurface,
      fontWeight: "500",
      marginTop: 8,
      marginBottom: 4,
    },
    suggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    suggestionChip: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      elevation: 1,
    },
    suggestionText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "500",
    },
  });
