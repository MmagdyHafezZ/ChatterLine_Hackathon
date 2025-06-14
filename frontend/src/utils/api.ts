import axios, { AxiosResponse, AxiosError } from "axios";
import { VoicePersona, APIResponse } from "../types";

// API Configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "APIError";
  }
}

const calculateDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof APIError && !error.retryable) {
        throw error;
      }

      if (attempt === retries) {
        break;
      }

      const delay = calculateDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
    }
  }

  throw lastError!;
};

// Enhanced OpenAI API integration
export const generateAIResponse = async (
  messages: Array<{ role: string; content: string }>,
  persona: VoicePersona
): Promise<APIResponse<string>> => {
  const operation = async () => {
    try {
      const systemPrompt = getEnhancedSystemPrompt(persona);

      const response: AxiosResponse = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 200,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const aiMessage = response.data.choices[0]?.message?.content;

      if (!aiMessage) {
        throw new APIError("No response from OpenAI", response.status, true);
      }

      return { success: true, data: aiMessage.trim() };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        const retryable = statusCode
          ? statusCode >= 500 || statusCode === 429
          : true;

        throw new APIError(
          `OpenAI API Error: ${axiosError.message}`,
          statusCode,
          retryable
        );
      }
      throw error;
    }
  };

  try {
    return await withRetry(operation);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      success: false,
      error:
        error instanceof APIError
          ? error.message
          : "Failed to generate AI response",
    };
  }
};

// Enhanced ElevenLabs integration
export const synthesizeVoice = async (
  text: string,
  persona: VoicePersona
): Promise<string> => {
  const operation = async () => {
    try {
      const voiceConfig = getEnhancedVoiceConfig(persona);
      const optimizedText = optimizeTextForSpeech(text);

      const response: AxiosResponse = await axios.post(
        `${ELEVENLABS_API_URL}/${voiceConfig.id}`,
        {
          text: optimizedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: voiceConfig.settings,
        },
        {
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          responseType: "blob",
          timeout: 45000,
        }
      );

      // Convert blob to base64 URL for Expo AV
      const blob = response.data;
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(new Error("Failed to convert audio blob"));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        const retryable = statusCode
          ? statusCode >= 500 || statusCode === 429
          : true;

        throw new APIError(
          `ElevenLabs API Error: ${axiosError.message}`,
          statusCode,
          retryable
        );
      }
      throw error;
    }
  };

  return await withRetry(operation);
};

// Enhanced sentiment analysis
export const analyzeSentiment = async (
  text: string
): Promise<
  APIResponse<{
    sentiment: "positive" | "neutral" | "negative";
    confidence: number;
    emotions: string[];
  }>
> => {
  const operation = async () => {
    try {
      const response: AxiosResponse = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analyze the sentiment and emotions in the following text. Respond with a JSON object containing:
                - "sentiment": "positive", "neutral", or "negative"
                - "confidence": a number between 0 and 1
                - "emotions": an array of detected emotions (max 3)
                
                Be precise and consider context, sarcasm, and nuance.`,
            },
            { role: "user", content: text },
          ],
          max_tokens: 100,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const result = JSON.parse(
        response.data.choices[0]?.message?.content || "{}"
      );

      if (!result.sentiment || typeof result.confidence !== "number") {
        throw new APIError("Invalid sentiment analysis response", 200, true);
      }

      return { success: true, data: result };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        const retryable = statusCode
          ? statusCode >= 500 || statusCode === 429
          : true;

        throw new APIError(
          `Sentiment Analysis Error: ${axiosError.message}`,
          statusCode,
          retryable
        );
      }
      throw error;
    }
  };

  try {
    return await withRetry(operation);
  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return {
      success: false,
      error:
        error instanceof APIError
          ? error.message
          : "Failed to analyze sentiment",
      data: { sentiment: "neutral", confidence: 0, emotions: [] },
    };
  }
};

// Enhanced call summary generation
export const generateCallSummary = async (
  messages: Array<{ role: string; content: string }>
): Promise<
  APIResponse<{
    summary: string;
    actionItems: string[];
    keyTopics: string[];
    sentiment: string;
  }>
> => {
  const operation = async () => {
    try {
      const response: AxiosResponse = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Analyze this conversation and provide a comprehensive summary. Respond with a JSON object containing:
                - "summary": A concise but thorough summary (2-3 sentences)
                - "actionItems": Array of specific action items or next steps
                - "keyTopics": Array of main topics discussed (max 5)
                - "sentiment": Overall conversation sentiment
                
                Focus on practical outcomes and important details.`,
            },
            {
              role: "user",
              content: `Please summarize this conversation: ${JSON.stringify(messages)}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const result = JSON.parse(
        response.data.choices[0]?.message?.content || "{}"
      );

      const summary = {
        summary: result.summary || "Call completed successfully.",
        actionItems: Array.isArray(result.actionItems)
          ? result.actionItems
          : [],
        keyTopics: Array.isArray(result.keyTopics) ? result.keyTopics : [],
        sentiment: result.sentiment || "neutral",
      };

      return { success: true, data: summary };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        const retryable = statusCode
          ? statusCode >= 500 || statusCode === 429
          : true;

        throw new APIError(
          `Summary Generation Error: ${axiosError.message}`,
          statusCode,
          retryable
        );
      }
      throw error;
    }
  };

  try {
    return await withRetry(operation);
  } catch (error) {
    console.error("Summary Generation Error:", error);
    return {
      success: false,
      error:
        error instanceof APIError
          ? error.message
          : "Failed to generate summary",
    };
  }
};

// Mock SMS implementation (replace with Twilio)
export const sendSMSSummary = async (
  phoneNumber: string,
  summary: string,
  actionItems: string[] = []
): Promise<APIResponse<boolean>> => {
  try {
    const message = formatSMSMessage(summary, actionItems);

    console.log(`📱 Sending SMS to ${phoneNumber}:`);
    console.log(message);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return { success: true, data: true };
  } catch (error) {
    console.error("SMS Send Error:", error);
    return { success: false, error: "Failed to send SMS summary" };
  }
};

// Helper functions
const getEnhancedSystemPrompt = (persona: VoicePersona): string => {
  const basePrompt =
    "You are an intelligent AI assistant helping with phone calls. ";

  const personaPrompts: Record<VoicePersona, string> = {
    friendly: `${basePrompt}Be warm, conversational, and supportive. Use a friendly tone with appropriate enthusiasm. Show empathy and understanding. Keep responses natural and engaging while maintaining professionalism.`,

    formal: `${basePrompt}Maintain a professional, business-appropriate tone. Be clear, direct, and respectful. Use proper grammar and formal language. Focus on efficiency and accuracy while remaining courteous.`,

    funny: `${basePrompt}Add light humor and personality to responses while staying helpful and appropriate. Use wit and cleverness to make conversations enjoyable, but never at the expense of being useful or respectful.`,
  };

  return (
    personaPrompts[persona] +
    " Keep responses concise but complete, typically 1-2 sentences."
  );
};

const getEnhancedVoiceConfig = (persona: VoicePersona) => {
  // ElevenLabs voice configurations
  const configs = {
    friendly: {
      id: "ErXwobaYiN019PkySvjV", // Antoni
      settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    },
    formal: {
      id: "VR6AewLTigWG4xSOukaG", // Arnold
      settings: {
        stability: 0.8,
        similarity_boost: 0.7,
        style: 0.1,
        use_speaker_boost: true,
      },
    },
    funny: {
      id: "pNInz6obpgDQGcFmaJgB", // Adam
      settings: {
        stability: 0.5,
        similarity_boost: 0.9,
        style: 0.6,
        use_speaker_boost: true,
      },
    },
  };

  return configs[persona as keyof typeof configs];
};

const optimizeTextForSpeech = (text: string): string => {
  return (
    text
      // Replace abbreviations with full words
      .replace(/\bw\//g, "with")
      .replace(/\be\.g\./g, "for example")
      .replace(/\bi\.e\./g, "that is")
      .replace(/\betc\./g, "and so on")
      .replace(/\bvs\./g, "versus")
      .replace(/\bDr\./g, "Doctor")
      .replace(/\bMr\./g, "Mister")
      .replace(/\bMs\./g, "Miss")
      // Add pauses for better speech flow
      .replace(/([.!?])\s/g, "$1. ")
      .replace(/([,;])\s/g, "$1, ")
      // Remove problematic characters
      .replace(/[()[\]{}]/g, "")
      .replace(/"/g, "")
      .replace(/'/g, "'")
      // Ensure proper spacing
      .replace(/\s+/g, " ")
      .trim()
  );
};

const formatSMSMessage = (summary: string, actionItems: string[]): string => {
  let message = `🤖 AI Call Summary\n\n${summary}`;

  if (actionItems.length > 0) {
    message += "\n\n📋 Action Items:";
    actionItems.forEach((item, index) => {
      message += `\n${index + 1}. ${item}`;
    });
  }

  message += "\n\nSent from AI Call Assistant";
  return message;
};

export { APIError };
