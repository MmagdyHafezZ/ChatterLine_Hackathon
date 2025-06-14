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

export async function chatWithSession(sessionId: string, userMessage: string): Promise<string> {
  const messages = getOrCreateSession(sessionId);
  messages.push({ role: 'user', content: userMessage });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  const assistantMessage = completion.choices[0].message.content ?? '';
  messages.push({ role: 'assistant', content: assistantMessage });

  // Optional: Add a follow-up user/system message to guide the next turn
  messages.push({ role: 'user', content: 'Can you confirm if there are any available time slots next week?' });

  const followUpCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  const followUpMessage = followUpCompletion.choices[0].message.content ?? '';
  messages.push({ role: 'assistant', content: followUpMessage });

  return `${assistantMessage}\n\n${followUpMessage}`;
}
