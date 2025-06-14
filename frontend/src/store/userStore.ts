import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { UserProfile, CallMetrics } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PersistStorage, StorageValue } from "zustand/middleware";

type UserPersistedState = {
  profile: UserProfile | null;
  metrics: CallMetrics;
  isDarkMode: boolean | null;
  preferences: {
    notifications: boolean;
    hapticFeedback: boolean;
    voiceCommands: boolean;
    autoSchedule: boolean;
  };
};


const storage: PersistStorage<UserPersistedState> = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    if (!value) return null;
    try {
      return JSON.parse(value) as StorageValue<UserPersistedState>;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};
interface UserState {
  profile: UserProfile | null;
  metrics: CallMetrics;
  isDarkMode: boolean | null;
  preferences: {
    notifications: boolean;
    hapticFeedback: boolean;
    voiceCommands: boolean;
    autoSchedule: boolean;
  };

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateMetrics: (metrics: Partial<CallMetrics>) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  updatePreferences: (prefs: Partial<UserState["preferences"]>) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        profile: null,
        metrics: {
          streak: 0,
          totalCalls: 0,
          totalMinutes: 0,
          averageSentiment: 0,
          completionRate: 0,
        },
        isDarkMode: null,
        preferences: {
          notifications: true,
          hapticFeedback: true,
          voiceCommands: false,
          autoSchedule: true,
        },

        setProfile: (profile) => set({ profile }, false, "setProfile"),

        updateProfile: (updates) =>
          set(
            (state) => ({
              profile: state.profile
                ? { ...state.profile, ...updates, updatedAt: new Date() }
                : null,
            }),
            false,
            "updateProfile"
          ),

        updateMetrics: (metrics) =>
          set(
            (state) => ({
              metrics: { ...state.metrics, ...metrics },
            }),
            false,
            "updateMetrics"
          ),

        incrementStreak: () =>
          set(
            (state) => ({
              metrics: { ...state.metrics, streak: state.metrics.streak + 1 },
            }),
            false,
            "incrementStreak"
          ),

        resetStreak: () =>
          set(
            (state) => ({
              metrics: { ...state.metrics, streak: 0 },
            }),
            false,
            "resetStreak"
          ),

        setDarkMode: (isDark) =>
          set({ isDarkMode: isDark }, false, "setDarkMode"),

        toggleDarkMode: () =>
          set(
            (state) => ({ isDarkMode: !state.isDarkMode }),
            false,
            "toggleDarkMode"
          ),

        updatePreferences: (prefs) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...prefs },
            }),
            false,
            "updatePreferences"
          ),
      }),
      {
        name: "user-storage",
        storage,
        partialize: (state) => ({
          profile: state.profile,
          metrics: state.metrics,
          isDarkMode: state.isDarkMode,
          preferences: state.preferences,
        }),
      }
    ),
    { name: "UserStore" }
  )
);
export const useThemeStore = () => {
  const { isDarkMode, setDarkMode, toggleDarkMode } = useUserStore((state) => ({
    isDarkMode: state.isDarkMode,
    setDarkMode: state.setDarkMode,
    toggleDarkMode: state.toggleDarkMode,
  }));

  return { isDarkMode, setDarkMode, toggleDarkMode };
};
