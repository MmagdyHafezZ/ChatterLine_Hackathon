import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import MarkdownDisplay from "react-native-markdown-display";

import { CallEvent } from "../../types";
import { AISchedulingService } from "../../services/aiSchedulingService";
import ExpoGlassCard from "../common/ExpoGlassCard";
import AnimatedButton from "../common/AnimatedButton";
import { useState, useEffect, useCallback } from "react";
import { ScrollView, View } from "react-native";
import { useTheme, Checkbox, IconButton, Text } from "react-native-paper";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";

interface PreparationTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  estimatedTime: number; // minutes
}

interface PreparationAssistantProps {
  callEvent: CallEvent;
  onUpdateEvent: (updates: Partial<CallEvent>) => void;
}

const PreparationAssistant: React.FC<PreparationAssistantProps> = ({
  callEvent,
  onUpdateEvent,
}) => {
  const theme = useTheme();
  const [agenda, setAgenda] = useState<string>("");
  const [briefing, setBriefing] = useState<string>("");
  const [preparationTasks, setPreparationTasks] = useState<PreparationTask[]>(
    []
  );
  const [attachedDocuments, setAttachedDocuments] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const progressValue = useSharedValue(0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    generatePreparationContent();
  }, [callEvent]);

  useEffect(() => {
    updateProgress();
  }, [preparationTasks]);

  const generatePreparationContent = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Generate agenda
      const generatedAgenda = await AISchedulingService.generateMeetingAgenda(
        callEvent.title,
        callEvent.participants,
        callEvent.duration,
        callEvent.description
      );
      setAgenda(generatedAgenda);

      // Generate briefing
      const generatedBriefing =
        await AISchedulingService.generatePreCallBriefing(
          callEvent.title,
          callEvent.participants,
          callEvent.description
        );
      setBriefing(generatedBriefing);

      // Generate preparation tasks
      const tasks = generatePreparationTasks(callEvent);
      setPreparationTasks(tasks);
    } catch (error) {
      console.error("Error generating preparation content:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [callEvent]);

  const generatePreparationTasks = (event: CallEvent): PreparationTask[] => {
    const baseTasks: PreparationTask[] = [
      {
        id: "1",
        title: "Review meeting agenda",
        description:
          "Go through the AI-generated agenda and customize if needed",
        completed: false,
        priority: "high",
        estimatedTime: 5,
      },
      {
        id: "2",
        title: "Research participants",
        description: "Review background information about call participants",
        completed: false,
        priority: "medium",
        estimatedTime: 10,
      },
      {
        id: "3",
        title: "Prepare talking points",
        description: "Outline key points you want to discuss",
        completed: false,
        priority: "high",
        estimatedTime: 15,
      },
      {
        id: "4",
        title: "Test technical setup",
        description: "Ensure audio/video equipment is working properly",
        completed: false,
        priority: "medium",
        estimatedTime: 5,
      },
      {
        id: "5",
        title: "Set environment",
        description: "Choose a quiet location and minimize distractions",
        completed: false,
        priority: "low",
        estimatedTime: 5,
      },
    ];

    // Add custom tasks based on call type
    if (event.participants.length > 3) {
      baseTasks.push({
        id: "6",
        title: "Prepare for large group dynamics",
        description: "Plan how to manage multiple participants effectively",
        completed: false,
        priority: "medium",
        estimatedTime: 10,
      });
    }

    if (event.duration > 60) {
      baseTasks.push({
        id: "7",
        title: "Plan break schedule",
        description: "Schedule appropriate breaks for longer meetings",
        completed: false,
        priority: "medium",
        estimatedTime: 5,
      });
    }

    return baseTasks;
  };

  const updateProgress = useCallback(() => {
    const completedTasks = preparationTasks.filter(
      (task) => task.completed
    ).length;
    const totalTasks = preparationTasks.length;
    const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

    progressValue.value = withSpring(progress, { damping: 12 });
  }, [preparationTasks]);

  const toggleTask = useCallback(async (taskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPreparationTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );

    cardScale.value = withTiming(0.98, { duration: 100 }, () => {
      cardScale.value = withSpring(1);
    });
  }, []);

  const attachDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAttachedDocuments((prev) => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  }, []);

  const shareAgenda = useCallback(async () => {
    try {
      await Sharing.shareAsync("data:text/plain;base64," + btoa(agenda), {
        mimeType: "text/plain",
        dialogTitle: "Share Meeting Agenda",
        UTI: "public.plain-text",
      });
    } catch (error) {
      console.error("Error sharing agenda:", error);
    }
  }, [agenda]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const getTotalEstimatedTime = () => {
    return preparationTasks.reduce(
      (total, task) => (!task.completed ? total + task.estimatedTime : total),
      0
    );
  };

  const getCompletionPercentage = () => {
    const completed = preparationTasks.filter((task) => task.completed).length;
    return Math.round((completed / preparationTasks.length) * 100);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Preparation Progress */}
      <Animated.View style={cardStyle}>
        <ExpoGlassCard style={styles.progressCard} intensity={80}>
          <View style={styles.progressHeader}>
            <Text variant="headlineSmall" style={styles.progressTitle}>
              🎯 Preparation Progress
            </Text>
            <Text variant="bodyLarge" style={styles.progressPercentage}>
              {getCompletionPercentage()}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, progressStyle]} />
            </View>
          </View>

          <View style={styles.progressStats}>
            <Text variant="bodyMedium" style={styles.progressStat}>
              ⏱️ {getTotalEstimatedTime()} min remaining
            </Text>
            <Text variant="bodyMedium" style={styles.progressStat}>
              ✅ {preparationTasks.filter((t) => t.completed).length}/
              {preparationTasks.length} tasks
            </Text>
          </View>
        </ExpoGlassCard>
      </Animated.View>

      {/* Preparation Checklist */}
      <ExpoGlassCard style={styles.checklistCard} intensity={60}>
        <View style={styles.checklistHeader}>
          <Text variant="titleLarge" style={styles.checklistTitle}>
            📋 Preparation Checklist
          </Text>
          <Text variant="bodyMedium" style={styles.checklistSubtitle}>
            Complete these tasks before your call
          </Text>
        </View>

        {preparationTasks.map((task) => (
          <Animated.View key={task.id} style={styles.taskItem}>
            <View style={styles.taskContent}>
              <Checkbox
                status={task.completed ? "checked" : "unchecked"}
                onPress={() => toggleTask(task.id)}
                uncheckedColor={theme.colors.onSurfaceVariant}
                color={theme.colors.primary}
              />

              <View style={styles.taskDetails}>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.taskTitle,
                    task.completed && styles.completedTaskTitle,
                  ]}
                >
                  {task.title}
                </Text>
                <Text variant="bodySmall" style={styles.taskDescription}>
                  {task.description}
                </Text>

                <View style={styles.taskMeta}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor:
                          task.priority === "high"
                            ? theme.colors.error
                            : task.priority === "medium"
                              ? theme.colors.secondary
                              : theme.colors.tertiary,
                      },
                    ]}
                  >
                    <Text variant="bodySmall" style={styles.priorityText}>
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={styles.estimatedTime}>
                    ~{task.estimatedTime} min
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
      </ExpoGlassCard>

      {/* AI-Generated Agenda */}
      <ExpoGlassCard style={styles.agendaCard} intensity={60}>
        <View style={styles.agendaHeader}>
          <Text variant="titleLarge" style={styles.agendaTitle}>
            📑 AI-Generated Agenda
          </Text>
          <IconButton
            icon="share"
            size={24}
            onPress={shareAgenda}
            iconColor={theme.colors.primary}
          />
        </View>

        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              🤖 AI is crafting your perfect agenda...
            </Text>
          </View>
        ) : (
          <View style={styles.markdownContainer}>
            <MarkdownDisplay
              style={{
                body: {
                  color: theme.colors.onSurface,
                  fontFamily: "Inter-Regular",
                },
                heading1: {
                  color: theme.colors.primary,
                  fontFamily: "Inter-Bold",
                },
                heading2: {
                  color: theme.colors.primary,
                  fontFamily: "Inter-Bold",
                },
                heading3: {
                  color: theme.colors.secondary,
                  fontFamily: "Inter-Bold",
                },
              }}
            >
              {agenda}
            </MarkdownDisplay>
          </View>
        )}
      </ExpoGlassCard>

      {/* Pre-Call Briefing */}
      <ExpoGlassCard style={styles.briefingCard} intensity={60}>
        <Text variant="titleLarge" style={styles.briefingTitle}>
          🧠 Pre-Call Briefing
        </Text>

        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              🤖 Preparing your briefing...
            </Text>
          </View>
        ) : (
          <View style={styles.markdownContainer}>
            <MarkdownDisplay
              style={{
                body: {
                  color: theme.colors.onSurface,
                  fontFamily: "Inter-Regular",
                },
                heading1: {
                  color: theme.colors.primary,
                  fontFamily: "Inter-Bold",
                },
                heading2: {
                  color: theme.colors.primary,
                  fontFamily: "Inter-Bold",
                },
                heading3: {
                  color: theme.colors.secondary,
                  fontFamily: "Inter-Bold",
                },
              }}
            >
              {briefing}
            </MarkdownDisplay>
          </View>
        )}
      </ExpoGlassCard>

      {/* Document Attachments */}
      <ExpoGlassCard style={styles.documentsCard} intensity={60}>
        <View style={styles.documentsHeader}>
          <Text variant="titleLarge" style={styles.documentsTitle}>
            📎 Related Documents
          </Text>
          <AnimatedButton
            mode="outlined"
            onPress={attachDocument}
            icon="attachment"
            style={styles.attachButton}
          >
            Attach
          </AnimatedButton>
        </View>

        {attachedDocuments.length === 0 ? (
          <Text variant="bodyMedium" style={styles.noDocumentsText}>
            No documents attached yet. Add relevant files to share with
            participants.
          </Text>
        ) : (
          <View style={styles.documentsList}>
            {attachedDocuments.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <Text variant="bodyMedium" style={styles.documentName}>
                  📄 {doc.name}
                </Text>
                <Text variant="bodySmall" style={styles.documentSize}>
                  {(doc.size / 1024).toFixed(1)} KB
                </Text>
              </View>
            ))}
          </View>
        )}
      </ExpoGlassCard>

      {/* Quick Actions */}
      <ExpoGlassCard style={styles.actionsCard} intensity={60}>
        <Text variant="titleLarge" style={styles.actionsTitle}>
          ⚡ Quick Actions
        </Text>

        <View style={styles.actionButtons}>
          <AnimatedButton
            mode="contained"
            onPress={() => onUpdateEvent({ reminders: !callEvent.reminders })}
            icon={callEvent.reminders ? "bell" : "bell-off"}
            style={styles.actionButton}
            gradient
          >
            {callEvent.reminders ? "Disable" : "Enable"} Reminders
          </AnimatedButton>

          <AnimatedButton
            mode="outlined"
            onPress={generatePreparationContent}
            icon="refresh"
            style={styles.actionButton}
            loading={isGenerating}
          >
            Regenerate Content
          </AnimatedButton>

          <AnimatedButton
            mode="outlined"
            onPress={shareAgenda}
            icon="share-variant"
            style={styles.actionButton}
          >
            Share Agenda
          </AnimatedButton>
        </View>
      </ExpoGlassCard>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.md,
    },
    progressCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    progressTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    progressPercentage: {
      color: theme.colors.primary,
      fontFamily: "Inter-Black",
    },
    progressBarContainer: {
      marginBottom: theme.spacing.md,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    progressStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    progressStat: {
      color: theme.colors.onSurfaceVariant,
    },
    checklistCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    checklistHeader: {
      marginBottom: theme.spacing.lg,
    },
    checklistTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    checklistSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    taskItem: {
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    taskContent: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    taskDetails: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    taskTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    completedTaskTitle: {
      textDecorationLine: "line-through",
      color: theme.colors.onSurfaceVariant,
    },
    taskDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    taskMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    priorityBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    priorityText: {
      color: "white",
      fontSize: 10,
      fontFamily: "Inter-Bold",
    },
    estimatedTime: {
      color: theme.colors.onSurfaceVariant,
    },
    agendaCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    agendaHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    agendaTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    briefingCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    briefingTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: "center",
    },
    loadingText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    markdownContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    documentsCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    documentsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    documentsTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
    },
    attachButton: {
      minWidth: 80,
    },
    noDocumentsText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
      textAlign: "center",
      padding: theme.spacing.lg,
    },
    documentsList: {
      gap: theme.spacing.sm,
    },
    documentItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
    },
    documentName: {
      color: theme.colors.onSurface,
      flex: 1,
    },
    documentSize: {
      color: theme.colors.onSurfaceVariant,
    },
    actionsCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    actionsTitle: {
      color: theme.colors.onSurface,
      fontFamily: "Inter-Bold",
      marginBottom: theme.spacing.lg,
    },
    actionButtons: {
      gap: theme.spacing.md,
    },
    actionButton: {
      minHeight: 48,
    },
  });

export default PreparationAssistant;
