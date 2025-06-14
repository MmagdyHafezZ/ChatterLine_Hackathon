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
function getOrCreateSession(sessionId: string, userdata: string): Message[] {
  if (!sessions[sessionId]) {
    sessions[sessionId] = [
      { role: 'system', content: 'You are a now connected to a call, to make an appoiment on belalf of the user, here are the details ' + userdata},
    ];
  }
  return sessions[sessionId];
}

// Non-streaming chat
export async function chatWithSession(sessionId: string, userMessage: string, appoimentdata: string): Promise<string> {
  const messages = getOrCreateSession(sessionId, appoimentdata);
  messages.push({ role: 'user', content: userMessage });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  const assistantMessage = completion.choices[0].message.content ?? '';
  messages.push({ role: 'assistant', content: assistantMessage });

  return assistantMessage;
}
