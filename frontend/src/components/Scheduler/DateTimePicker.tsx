// src/components/CustomDateTimePicker.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Text, Button, useTheme, HelperText } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

// 1. Run once in your project root:
//    expo install @react-native-community/datetimepicker

interface DateTimePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  error?: string;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onDateChange,
  error,
}) => {
  const theme = useTheme();
  const styles = createDateTimeStyles(theme);

  // UI state for showing the native pickers
  const [showPickerMode, setShowPickerMode] = useState<"date" | "time" | null>(
    null
  );

  // Provisional selection until user confirms
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  // Sync tempDate if selectedDate changes from outside
  useEffect(() => {
    setTempDate(selectedDate);
  }, [selectedDate]);

  // Called on every native picker change
  const handleNativeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
    // don't auto-close; wait for confirm or cancel
  };

  const openDatePicker = () => {
    setTempDate(selectedDate);
    setShowPickerMode("date");
  };

  const openTimePicker = () => {
    setTempDate(selectedDate);
    setShowPickerMode("time");
  };

  const confirm = () => {
    onDateChange(tempDate);
    setShowPickerMode(null);
  };

  const cancel = () => {
    setShowPickerMode(null);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        When should this call happen?
      </Text>

      {/* Trigger buttons */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.input, { flex: 1.5 }]}
          onPress={openDatePicker}
        >
          <Text>📅 {dayjs(selectedDate).format("YYYY-MM-DD")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.input, { flex: 1 }]}
          onPress={openTimePicker}
        >
          <Text>🕐 {dayjs(selectedDate).format("HH:mm")}</Text>
        </TouchableOpacity>
      </View>

      {/* Native picker + confirm/cancel */}
      {showPickerMode && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={tempDate}
            mode={showPickerMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleNativeChange}
            style={styles.picker}
          />
          <View style={styles.pickerButtons}>
            <Button compact onPress={cancel}>
              Cancel
            </Button>
            <Button compact onPress={confirm}>
              Confirm
            </Button>
          </View>
        </View>
      )}

      {/* Quick‑pick buttons */}
      <Text variant="bodySmall" style={styles.quickTimeLabel}>
        Quick times:
      </Text>
      <View style={styles.quickTimeButtons}>
        {(
          [
            [9, 0],
            [10, 0],
            [14, 0],
            [15, 30],
          ] as const
        ).map(([h, m]) => (
          <Button
            key={`${h}:${m}`}
            mode="outlined"
            compact
            onPress={() =>
              onDateChange(dayjs(selectedDate).hour(h).minute(m).toDate())
            }
            style={styles.quickTimeButton}
          >
            {dayjs().hour(h).minute(m).format("h:mm A")}
          </Button>
        ))}
      </View>

      <Text variant="bodySmall" style={styles.previewText}>
        Preview: {dayjs(selectedDate).format("dddd, MMMM D, YYYY [at] h:mm A")}
      </Text>

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
};

const createDateTimeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: "600",
      marginBottom: 12,
    },
    inputRow: {
      flexDirection: "row",
      gap: 12,
    },
    input: {
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 4,
      backgroundColor: "transparent",
      justifyContent: "center",
    },
    pickerContainer: {
      marginVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      overflow: "hidden",
    },
    picker: {
      width: "100%",
    },
    pickerButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 8,
      gap: 8,
    },
    quickTimeLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      marginBottom: 4,
    },
    quickTimeButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    quickTimeButton: {
      borderRadius: 20,
    },
    previewText: {
      color: theme.colors.primary,
      fontWeight: "500",
      marginTop: 8,
      textAlign: "center",
      padding: 8,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 8,
    },
  });
