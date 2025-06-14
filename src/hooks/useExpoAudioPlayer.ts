import { useState, useCallback, useRef } from "react";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { synthesizeVoice } from "../utils/api";
import { VoicePersona } from "../types";

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentSound: Audio.Sound | null;
  queue: string[];
}

export const useExpoAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentSound: null,
    queue: [],
  });

  const audioQueue = useRef<Audio.Sound[]>([]);

  const playText = useCallback(async (text: string, persona: VoicePersona) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const audioUrl = await synthesizeVoice(text, persona);

      // Create sound object
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: true,
        currentSound: sound,
      }));

      // Play the sound
      await sound.playAsync();

      // Set up completion callback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentSound: null,
          }));

          // Clean up
          sound.unloadAsync();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
    } catch (error) {
      console.error("Audio playback failed:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (state.currentSound) {
      await state.currentSound.stopAsync();
      await state.currentSound.unloadAsync();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentSound: null,
      }));
    }
  }, [state.currentSound]);

  const queueText = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, text],
    }));
  }, []);

  return {
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    playText,
    stopAudio,
    queueText,
  };
};
