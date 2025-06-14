import { generateAIResponse } from "../utils/api";
import { CallEvent, UserProfile } from "../types";
import dayjs from "dayjs";

interface SchedulingSuggestion {
  time: Date;
  confidence: number;
  reason: string;
  prepTime?: number;
}

interface MeetingContext {
  participants: string[];
  topic: string;
  priority: "low" | "medium" | "high";
  estimatedDuration: number;
  followUpRequired: boolean;
}

export class AISchedulingService {
  static async analyzeSchedulingContext(
    userProfile: UserProfile,
    recentCalls: CallEvent[],
    requestedTime: Date,
    context: MeetingContext
  ): Promise<SchedulingSuggestion[]> {
    try {
      const prompt = this.buildSchedulingPrompt(
        userProfile,
        recentCalls,
        requestedTime,
        context
      );

      const response = await generateAIResponse(
        [{ role: "user", content: prompt }],
        userProfile.voicePersona
      );

      if (response.success && response.data) {
        return this.parseSchedulingSuggestions(response.data);
      }

      return this.getFallbackSuggestions(requestedTime, context);
    } catch (error) {
      console.error("AI Scheduling error:", error);
      return this.getFallbackSuggestions(requestedTime, context);
    }
  }

  static async generateMeetingAgenda(
    topic: string,
    participants: string[],
    duration: number,
    context?: string
  ): Promise<string> {
    try {
      const prompt = `Create a structured meeting agenda for:
        Topic: ${topic}
        Duration: ${duration} minutes
        Participants: ${participants.join(", ")}
        ${context ? `Context: ${context}` : ""}
        
        Format as markdown with time allocations.`;

      const response = await generateAIResponse(
        [{ role: "user", content: prompt }],
        "formal"
      );

      return response.success
        ? response.data || ""
        : this.getDefaultAgenda(topic, duration);
    } catch (error) {
      console.error("Agenda generation error:", error);
      return this.getDefaultAgenda(topic, duration);
    }
  }

  static async generatePreCallBriefing(
    topic: string,
    participants: string[],
    context?: string
  ): Promise<string> {
    try {
      const prompt = `Generate a pre-call briefing for:
        Topic: ${topic}
        Participants: ${participants.join(", ")}
        ${context ? `Additional Context: ${context}` : ""}
        
        Include key talking points, potential questions, and objectives.`;

      const response = await generateAIResponse(
        [{ role: "user", content: prompt }],
        "formal"
      );

      return response.success
        ? response.data || ""
        : this.getDefaultBriefing(topic);
    } catch (error) {
      console.error("Briefing generation error:", error);
      return this.getDefaultBriefing(topic);
    }
  }

  static async suggestFollowUpActions(
    callSummary: string,
    participants: string[]
  ): Promise<string[]> {
    try {
      const prompt = `Based on this call summary, suggest specific follow-up actions:
        
        Summary: ${callSummary}
        Participants: ${participants.join(", ")}
        
        Return as a JSON array of action items.`;

      const response = await generateAIResponse(
        [{ role: "user", content: prompt }],
        "formal"
      );

      if (response.success && response.data) {
        try {
          return JSON.parse(response.data);
        } catch {
          return response.data
            .split("\n")
            .filter((line) => line.trim().length > 0);
        }
      }

      return ["Schedule follow-up meeting", "Send summary to participants"];
    } catch (error) {
      console.error("Follow-up suggestion error:", error);
      return ["Schedule follow-up meeting", "Send summary to participants"];
    }
  }

  private static buildSchedulingPrompt(
    userProfile: UserProfile,
    recentCalls: CallEvent[],
    requestedTime: Date,
    context: MeetingContext
  ): string {
    const recentCallsContext = recentCalls
      .slice(0, 5)
      .map(
        (call) =>
          `${call.title} - ${dayjs(call.scheduledTime).format("YYYY-MM-DD HH:mm")}`
      )
      .join("\n");

    return `As an AI scheduling assistant, analyze this scheduling request:

User: ${userProfile.name}
Requested Time: ${dayjs(requestedTime).format("YYYY-MM-DD HH:mm")}
Meeting Topic: ${context.topic}
Priority: ${context.priority}
Estimated Duration: ${context.estimatedDuration} minutes
Participants: ${context.participants.join(", ")}

Recent Calls:
${recentCallsContext}

Provide 3 optimal time suggestions with confidence scores and reasoning.
Consider work-life balance, meeting patterns, and productivity hours.

Format as JSON: [{"time": "ISO-date", "confidence": 0-1, "reason": "explanation", "prepTime": minutes}]`;
  }

  private static parseSchedulingSuggestions(
    response: string
  ): SchedulingSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((item: any) => ({
        time: new Date(item.time),
        confidence: item.confidence || 0.5,
        reason: item.reason || "AI recommended time",
        prepTime: item.prepTime || 15,
      }));
    } catch {
      return [];
    }
  }

  private static getFallbackSuggestions(
    requestedTime: Date,
    context: MeetingContext
  ): SchedulingSuggestion[] {
    const base = dayjs(requestedTime);
    return [
      {
        time: base.toDate(),
        confidence: 0.7,
        reason: "Requested time slot",
        prepTime: 15,
      },
      {
        time: base.add(1, "hour").toDate(),
        confidence: 0.8,
        reason: "Alternative with buffer time",
        prepTime: 15,
      },
      {
        time: base.add(1, "day").hour(10).minute(0).toDate(),
        confidence: 0.9,
        reason: "Optimal productivity hours",
        prepTime: 20,
      },
    ];
  }

  private static getDefaultAgenda(topic: string, duration: number): string {
    return `# Meeting Agenda: ${topic}

## Duration: ${duration} minutes

### 1. Opening & Introductions (5 min)
- Welcome participants
- Review agenda and objectives

### 2. Main Discussion (${duration - 15} min)
- ${topic}
- Key discussion points
- Decision making

### 3. Action Items & Next Steps (10 min)
- Summarize decisions
- Assign action items
- Schedule follow-ups

---
*Generated by AI Call Assistant*`;
  }

  private static getDefaultBriefing(topic: string): string {
    return `# Pre-Call Briefing: ${topic}

## Objectives
- Define clear goals for the discussion
- Ensure all participants are aligned

## Key Talking Points
- Background context
- Current status
- Expected outcomes

## Potential Questions
- What are the main challenges?
- What decisions need to be made?
- What are the next steps?

## Success Criteria
- Clear action items identified
- Timeline established
- Responsibilities assigned

---
*Generated by AI Call Assistant*`;
  }
}
