// chatgpt.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI with your key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Session memory store (in-memory)
type Message = { role: 'system' | 'user' | 'assistant'; content: string };
const sessions: Record<string, Message[]> = {};

// Helper: Get or create session
function getOrCreateSession(sessionId: string): Message[] {
  if (!sessions[sessionId]) {
    sessions[sessionId] = [
      { role: 'system', content: 'You are a helpful assistant.' },
    ];
  }
  return sessions[sessionId];
}

export async function chatWithSession(sessionId: string, userMessage: string): Promise<{ message: string; end: boolean }> {
  const messages = getOrCreateSession(sessionId);
  messages.push({ role: "user", content: userMessage });

  // Tell the assistant to include an END_CONVO marker if the conversation should end
  messages.push({
    role: "system",
    content: `If John confirms the appointment or says goodbye, include "[END_CONVO]" at the end of your reply. Otherwise, do not include it.`,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  const assistantMessage = completion.choices[0].message.content ?? "";
  messages.push({ role: "assistant", content: assistantMessage });

  const end = assistantMessage.includes("[END_CONVO]");
  const cleanMessage = assistantMessage.replace("[END_CONVO]", "").trim();

  return {
    message: cleanMessage,
    end,
  };
}
