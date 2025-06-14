// store/userStore.ts - Enhanced with demo data
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

  // Demo actions
  initializeDemoProfile: () => void;
  clearProfile: () => void;
}

// Demo profile data
const createDemoProfile = (): UserProfile => ({
  id: "demo-user-123",
  name: "Alex Johnson",
  email: "alex.johnson@techcorp.com",
  phone: "+1 (555) 123-4567",
  company: "TechCorp Solutions",
  jobTitle: "Senior Product Manager",
  location: "San Francisco, CA",
  bio: "Passionate about building user-centered products that make a difference. 5+ years in product management with expertise in mobile apps and AI integrations.",
  voicePersona: "friendly",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date(),
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  timezone: "America/Los_Angeles",
  workingHours: {
    start: 9, // 9 AM
    end: 17, // 5 PM
  },
});

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

        initializeDemoProfile: () => {
          const demoProfile = createDemoProfile();
          const demoMetrics: CallMetrics = {
            streak: 7,
            totalCalls: 42,
            totalMinutes: 1260, // 21 hours
            averageSentiment: 0.75, // Positive sentiment
            completionRate: 0.95, // 95% completion rate
            weeklyGoal: 5,
            monthlyGoal: 20,
            productivity: {
              peakHours: [10, 14, 15], // 10 AM, 2 PM, 3 PM
              averagePreparationTime: 15, // 15 minutes
              meetingEffectiveness: 0.82, // 82% effectiveness
            },
          };

          set(
            {
              profile: demoProfile,
              metrics: demoMetrics,
            },
            false,
            "initializeDemoProfile"
          );
        },

        clearProfile: () =>
          set(
            {
              profile: null,
              metrics: {
                streak: 0,
                totalCalls: 0,
                totalMinutes: 0,
                averageSentiment: 0,
                completionRate: 0,
              },
            },
            false,
            "clearProfile"
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

// Helper hook to initialize demo data
export const useDemoData = () => {
  const { initializeDemoProfile, clearProfile, profile } = useUserStore(
    (state) => ({
      initializeDemoProfile: state.initializeDemoProfile,
      clearProfile: state.clearProfile,
      profile: state.profile,
    })
  );

  return {
    initializeDemoProfile,
    clearProfile,
    hasProfile: !!profile,
    profile,
  };
};
