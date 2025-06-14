import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { CallEvent, CallSession, CallMessage } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  PersistStorage,
  StateStorage,
  StorageValue,
} from "zustand/middleware";

const storage: PersistStorage<{
  events: CallEvent[];
  sessions: CallSession[];
}> = {
  getItem: async (
    name: string
  ): Promise<StorageValue<{
    events: CallEvent[];
    sessions: CallSession[];
  }> | null> => {
    const value = await AsyncStorage.getItem(name);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
  setItem: async (
    name: string,
    value: StorageValue<{ events: CallEvent[]; sessions: CallSession[] }>
  ): Promise<void> => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

interface CallState {
  events: CallEvent[];
  sessions: CallSession[];
  currentSession: CallSession | null;

  // Event management
  addEvent: (event: Omit<CallEvent, "id" | "createdAt" | "updatedAt">) => void;
  updateEvent: (id: string, updates: Partial<CallEvent>) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => CallEvent | undefined;

  // Session management
  startSession: (eventId: string) => void;
  endSession: () => void;
  addMessage: (message: Omit<CallMessage, "id" | "timestamp">) => void;
  updateSessionMetrics: (metrics: Partial<CallSession["metrics"]>) => void;
  setSessionSummary: (summary: string, actionItems: string[]) => void;

  // Utilities
  getUpcomingEvents: () => CallEvent[];
  getCompletedSessions: () => CallSession[];
  getTodaysEvents: () => CallEvent[];
  getEventsByStatus: (status: CallEvent["status"]) => CallEvent[];
}

export const useCallStore = create<CallState>()(
  devtools(
    persist(
      (set, get) => ({
        events: [],
        sessions: [],
        currentSession: null,

        addEvent: (eventData) => {
          const event: CallEvent = {
            ...eventData,
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(
            (state) => ({ events: [...state.events, event] }),
            false,
            "addEvent"
          );
        },

        updateEvent: (id, updates) =>
          set(
            (state) => ({
              events: state.events.map((event) =>
                event.id === id
                  ? { ...event, ...updates, updatedAt: new Date() }
                  : event
              ),
            }),
            false,
            "updateEvent"
          ),

        deleteEvent: (id) =>
          set(
            (state) => ({
              events: state.events.filter((event) => event.id !== id),
            }),
            false,
            "deleteEvent"
          ),

        getEvent: (id) => {
          return get().events.find((event) => event.id === id);
        },

        startSession: (eventId) => {
          const session: CallSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId,
            startTime: new Date(),
            messages: [],
            metrics: {
              totalDuration: 0,
              averageResponseTime: 0,
              wordsPerMinute: 0,
              sentimentScore: 0,
            },
            actionItems: [],
          };

          set({ currentSession: session }, false, "startSession");
        },

        endSession: () => {
          const { currentSession } = get();
          if (!currentSession) return;

          const endedSession: CallSession = {
            ...currentSession,
            endTime: new Date(),
          };

          set(
            (state) => ({
              sessions: [...state.sessions, endedSession],
              currentSession: null,
            }),
            false,
            "endSession"
          );
        },

        addMessage: (messageData) => {
          const message: CallMessage = {
            ...messageData,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          };

          set(
            (state) => ({
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    messages: [...state.currentSession.messages, message],
                  }
                : null,
            }),
            false,
            "addMessage"
          );
        },

        updateSessionMetrics: (metrics) =>
          set(
            (state) => ({
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    metrics: { ...state.currentSession.metrics, ...metrics },
                  }
                : null,
            }),
            false,
            "updateSessionMetrics"
          ),

        setSessionSummary: (summary, actionItems) =>
          set(
            (state) => ({
              currentSession: state.currentSession
                ? { ...state.currentSession, summary, actionItems }
                : null,
            }),
            false,
            "setSessionSummary"
          ),

        getUpcomingEvents: () => {
          const now = new Date();
          return get()
            .events.filter(
              (event) =>
                event.scheduledTime > now && event.status === "scheduled"
            )
            .sort(
              (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
            );
        },

        getCompletedSessions: () => {
          return get()
            .sessions.filter((session) => session.endTime)
            .sort(
              (a, b) =>
                (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0)
            );
        },

        getTodaysEvents: () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          return get().events.filter(
            (event) =>
              event.scheduledTime >= today && event.scheduledTime < tomorrow
          );
        },

        getEventsByStatus: (status) => {
          return get().events.filter((event) => event.status === status);
        },
      }),
      {
        name: "call-storage",
        storage,
        partialize: (state) => ({
          events: state.events,
          sessions: state.sessions,
        }),
      }
    ),
    { name: "CallStore" }
  )
);
