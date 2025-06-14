import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

export const SchedulerHeader: React.FC = () => {
  const theme = useTheme();
  const styles = createHeaderStyles(theme);

  return (
    <View style={styles.header}>
      <Text variant="headlineMedium" style={styles.headerTitle}>
        📅 AI Call Scheduler
      </Text>
      <Text variant="bodyMedium" style={styles.headerSubtitle}>
        Set up your personalized AI conversation
      </Text>
    </View>
  );
};

const createHeaderStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      marginBottom: 4,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
    },
  });
