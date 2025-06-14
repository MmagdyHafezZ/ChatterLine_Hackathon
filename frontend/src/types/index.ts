export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  bio?: string;
  voicePersona?: VoicePersona;
  createdAt?: Date;
  updatedAt?: Date;
  avatar?: string;
  timezone?: string;
  interests?: string[],
  workingHours?: {
    start?: number;
    end?: number;
  };
}

export interface CallEvent {
  id: string;
  title: string;
  description?: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: "scheduled" | "in-progress" | "completed" | "missed" | "cancelled";
  participants: string[];
  reminders: boolean;
  createdAt: Date;
  updatedAt: Date;
  agenda?: string;
  preparationTasks?: PreparationTask[];
  documents?: AttachedDocument[];
  priority?: "low" | "medium" | "high";
  recurringPattern?: RecurringPattern;
  voicePersona?: VoicePersona;
  scheduledDate?: Date; // For scheduling purposes
  selectedProfileFields?: (keyof UserProfile)[];
  additionalProfileData?: any; // Flexible for additional user data
}

export interface CallMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  emotions?: string[];
  wordCount?: number;
  responseTime?: number;
}

export interface CallSession {
  id: string;
  eventId: string;
  startTime: Date;
  endTime?: Date;
  messages: CallMessage[];
  metrics: {
    totalDuration: number;
    averageResponseTime: number;
    wordsPerMinute: number;
    sentimentScore: number;
    messageCount?: number;
    peakEngagement?: number;
  };
  summary?: string;
  actionItems: string[];
  keyTopics?: string[];
  recording?: string;
  transcript?: string;
}

export interface CallMetrics {
  streak: number;
  totalCalls: number;
  totalMinutes: number;
  averageSentiment: number;
  completionRate: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
  productivity?: {
    peakHours: number[];
    averagePreparationTime: number;
    meetingEffectiveness: number;
  };
}

export interface PreparationTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  estimatedTime: number; // minutes
  category: "research" | "agenda" | "technical" | "documents" | "logistics";
}

export interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
  occurrences?: number;
}

export type VoicePersona = "friendly" | "formal" | "funny";

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CalendarIntegration {
  provider: "google" | "outlook" | "apple" | "exchange";
  connected: boolean;
  syncEnabled: boolean;
  lastSyncAt?: Date;
  calendarId?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTimes: number[]; // minutes before call
  types: {
    scheduled: boolean;
    starting: boolean;
    completed: boolean;
    preparation: boolean;
  };
  quiet_hours?: {
    start: string; // HH:mm format
    end: string;
  };
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export interface AnalyticsData {
  timeRange: "week" | "month" | "quarter" | "year";
  metrics: {
    totalCalls: number;
    totalMinutes: number;
    averageRating: number;
    completionRate: number;
    productivityScore: number;
  };
  trends: {
    callFrequency: { date: string; count: number }[];
    sentiment: { date: string; score: number }[];
    duration: { date: string; minutes: number }[];
  };
  insights: {
    peakTimes: { hour: number; count: number }[];
    topParticipants: { name: string; count: number }[];
    meetingTypes: { type: string; count: number }[];
  };
  recommendations: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  timezone?: string;
  availability?: {
    [day: string]: { start: string; end: string }[];
  };
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  defaultDuration: number;
  agendaTemplate: string;
  preparationTasks: Omit<PreparationTask, "id" | "completed">[];
  category:
    | "standup"
    | "review"
    | "planning"
    | "oneonone"
    | "presentation"
    | "custom";
}
