import { useCallback, useEffect, useState } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { CallEvent } from "../types";

interface VoiceCommand {
  command: string;
  action: string;
  parameters?: any;
}

interface VoiceCommandsProps {
  onScheduleCall: (event: Partial<CallEvent>) => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onNavigate: (screen: string) => void;
}

export const useVoiceCommands = ({
  onScheduleCall,
  onStartCall,
  onEndCall,
  onNavigate,
}: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);

  const processVoiceCommand = useCallback(
    (transcript: string) => {
      const normalizedText = transcript.toLowerCase().trim();

      // Schedule call commands
      if (
        normalizedText.includes("schedule") &&
        normalizedText.includes("call")
      ) {
        const timeMatch = normalizedText.match(
          /at (\d{1,2}):?(\d{2})?\s?(am|pm)?/i
        );
        const titleMatch = normalizedText.match(/about (.+?)(?:\sat|$)/i);

        let scheduledTime = new Date();
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const minute = parseInt(timeMatch[2] || "0");
          const isPM = timeMatch[3]?.toLowerCase() === "pm";

          scheduledTime.setHours(isPM && hour !== 12 ? hour + 12 : hour);
          scheduledTime.setMinutes(minute);
          scheduledTime.setSeconds(0);
        }

        const title = titleMatch ? titleMatch[1] : "Voice Scheduled Call";

        onScheduleCall({
          title,
          scheduledTime,
          duration: 30,
          participants: [],
          status: "scheduled",
        });

        speak(
          `Scheduled call "${title}" for ${dayjs(scheduledTime).format("h:mm A")}`
        );
        return;
      }

      // Navigation commands
      if (normalizedText.includes("go to") || normalizedText.includes("open")) {
        if (normalizedText.includes("profile")) {
          onNavigate("Profile");
          speak("Opening your profile");
          return;
        }
        if (
          normalizedText.includes("schedule") ||
          normalizedText.includes("calendar")
        ) {
          onNavigate("Scheduler");
          speak("Opening scheduler");
          return;
        }
        if (normalizedText.includes("call")) {
          onNavigate("Call");
          speak("Opening call screen");
          return;
        }
      }

      // Call control commands
      if (
        normalizedText.includes("start call") ||
        normalizedText.includes("begin call")
      ) {
        onStartCall();
        speak("Starting your call now");
        return;
      }

      if (
        normalizedText.includes("end call") ||
        normalizedText.includes("hang up")
      ) {
        onEndCall();
        speak("Ending the call");
        return;
      }

      // Quick scheduling commands
      if (normalizedText.includes("quick meeting")) {
        const nextHour = dayjs().add(1, "hour").startOf("hour");
        onScheduleCall({
          title: "Quick Meeting",
          scheduledTime: nextHour.toDate(),
          duration: 15,
          participants: [],
          status: "scheduled",
        });
        speak(`Quick meeting scheduled for ${nextHour.format("h:mm A")}`);
        return;
      }

      // Fallback
      speak(
        "I didn't understand that command. Try saying 'schedule call about project review at 3 PM'"
      );
    },
    [onScheduleCall, onStartCall, onEndCall, onNavigate]
  );

  const speak = useCallback(async (text: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      setIsListening(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // This would integrate with a speech recognition service
      // For now, we'll simulate with a mock implementation
      console.log("Voice command listening started...");

      // In a real implementation, you would use:
      // - expo-speech for speech synthesis (already implemented)
      // - A cloud speech recognition service (Google Cloud Speech, Azure, etc.)
      // - Or react-native-voice for device-based recognition
    } catch (error) {
      console.error("Voice recognition error:", error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    console.log("Voice command listening stopped");
  }, []);

  // Simulate voice command for demo purposes
  const simulateVoiceCommand = useCallback(
    (command: string) => {
      processVoiceCommand(command);
    },
    [processVoiceCommand]
  );

  return {
    isListening,
    lastCommand,
    startListening,
    stopListening,
    speak,
    simulateVoiceCommand,
  };
};
