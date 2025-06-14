import { useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { CallEvent } from "../types";

export const useExpoNotifications = () => {
  const requestPermissions = useCallback(async () => {
    if (!Device.isDevice) {
      console.warn("Must use physical device for notifications");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  }, []);

  const scheduleCallReminder = useCallback(async (event: CallEvent) => {
    const reminderTime = new Date(event.scheduledTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - 15);

    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📞 Call Reminder",
          body: `Your call "${event.title}" starts in 15 minutes`,
          data: { eventId: event.id, type: "reminder" },
          sound: true,
        },
        trigger: {
          date: reminderTime,
        },
        identifier: `reminder_${event.id}`,
      });
    }

    // Schedule call start notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚀 Call Starting Now",
        body: `Time for your call: "${event.title}"`,
        data: { eventId: event.id, type: "start" },
        sound: true,
      },
      trigger: {
        date: event.scheduledTime,
      },
      identifier: `start_${event.id}`,
    });
  }, []);

  const cancelCallNotifications = useCallback(async (eventId: string) => {
    await Notifications.cancelScheduledNotificationAsync(`reminder_${eventId}`);
    await Notifications.cancelScheduledNotificationAsync(`start_${eventId}`);
  }, []);

  const sendCallEndNotification = useCallback(
    async (callTitle: string, duration: number) => {
      await Notifications.presentNotificationAsync({
        content: {
          title: "✅ Call Completed",
          body: `"${callTitle}" finished (${Math.round(duration)} min). Summary sent to your phone.`,
          data: { type: "end" },
          sound: true,
        },
        identifier: `end_${Date.now()}`,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    []
  );

  useEffect(() => {
    // Handle notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { type, eventId } = response.notification.request.content.data;

        console.log("Notification response:", { type, eventId });

        // Handle different notification types
        if (type === "start") {
          // Navigate to call screen
          console.log("Navigate to call screen for event:", eventId);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return {
    requestPermissions,
    scheduleCallReminder,
    cancelCallNotifications,
    sendCallEndNotification,
  };
};
