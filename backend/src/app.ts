import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { get_audio, play_audio } from "./11labs";
import { Readable } from "stream";
import { chatWithSession } from "./chatgpt";

import prisma from "./prisma";
import cron from "node-cron";
import callClient from "./call";
const app = express();
const port = process.env.PORT || 3000;

// Enhanced cache structure for scheduled calls
interface ScheduledCall {
  id: string;
  phoneNumber: string;
  userInfo: {
    name: string;
    email?: string;
    notes?: string;
    company?: string;
    jobTitle?: string;
    location?: string;
  };
  callPurpose: string;
  scheduledDateTime: Date;
  status: "pending" | "processing" | "completed" | "failed";
  script?: string;
  audioBuffer?: Buffer;
  callSid?: string;
  createdAt: Date;
  voicePersona?: string;
}
let scheduledCalls: Map<string, ScheduledCall> = new Map();
let cachedAudio: Buffer | null = null;
function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

app.use(express.static("public")); // To serve static files like HTML
app.use(express.urlencoded({ extended: true }));

app.use(express.json()); // Add this line to parse JSON request bodies

async function generateCallScript(
  userInfo: any,
  callPurpose: string
): Promise<string> {
  const prompt = `Create a professional phone call script for the following:
    
    User Information: ${JSON.stringify(userInfo)}
    Call Purpose: ${callPurpose}
    
    Please create a concise, professional script that:
    1. Introduces the caller appropriately
    2. Clearly states the purpose
    3. Is conversational and friendly
    4. Keeps the message under 2 minutes when spoken
    5. Ends with a clear call-to-action or next steps
    
    Return only the script text, no additional formatting or quotes.`;

  try {
    const script = await chatWithSession("script_generation", prompt);
    return script;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate call script");
  }
}

async function generateAudioFromScript(
  script: string,
  voicePersona: string = "eleven_multilingual_v2"
): Promise<Buffer> {
  try {
    const audioStream = await get_audio(script, voicePersona);
    return await streamToBuffer(audioStream);
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio from script");
  }
}
app.post("/schedule-call", async (req: Request, res: Response) => {
  try {
    const {
      phoneNumber,
      userInfo,
      callPurpose,
      scheduledDateTime,
      voicePersona,
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !userInfo || !callPurpose || !scheduledDateTime) {
      return res.status(400).json({
        error:
          "Missing required fields: phoneNumber, userInfo, callPurpose, scheduledDateTime",
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: "Invalid phone number format. Use +1XXXXXXXXXX",
      });
    }

    // Validate scheduled time is in the future
    const scheduleDate = new Date(scheduledDateTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        error: "Scheduled time must be in the future",
      });
    }

    const callId = generateCallId();
    const scheduledCall: ScheduledCall = {
      id: callId,
      phoneNumber,
      userInfo,
      callPurpose,
      scheduledDateTime: scheduleDate,
      status: "pending",
      createdAt: new Date(),
      voicePersona: voicePersona || "eleven_multilingual_v2",
    };

    scheduledCalls.set(callId, scheduledCall);

    console.log(
      `New call scheduled: ${callId} for ${scheduleDate.toISOString()}`
    );

    res.status(201).json({
      success: true,
      callId,
      message: "Call scheduled successfully",
      scheduledCall: {
        id: callId,
        phoneNumber,
        userInfo,
        callPurpose,
        scheduledDateTime: scheduleDate,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error scheduling call:", error);
    res.status(500).json({ error: "Failed to schedule call" });
  }
});
app.get("/scheduled-calls", (req: Request, res: Response) => {
  const calls = Array.from(scheduledCalls.values()).map((call) => ({
    id: call.id,
    phoneNumber: call.phoneNumber,
    userInfo: call.userInfo,
    callPurpose: call.callPurpose,
    scheduledDateTime: call.scheduledDateTime,
    status: call.status,
    callSid: call.callSid,
    createdAt: call.createdAt,
    voicePersona: call.voicePersona,
  }));

  res.json({ calls });
});

// Get specific scheduled call
app.get("/scheduled-calls/:id", (req: Request, res: Response) => {
  const callId = req.params.id;
  const call = scheduledCalls.get(callId);

  if (!call) {
    return res.status(404).json({ error: "Call not found" });
  }

  res.json({
    id: call.id,
    phoneNumber: call.phoneNumber,
    userInfo: call.userInfo,
    callPurpose: call.callPurpose,
    scheduledDateTime: call.scheduledDateTime,
    status: call.status,
    script: call.script,
    callSid: call.callSid,
    createdAt: call.createdAt,
    voicePersona: call.voicePersona,
  });
});
async function processScheduledCall(callData: ScheduledCall): Promise<void> {
  try {
    console.log(`Processing scheduled call: ${callData.id}`);
    callData.status = "processing";

    // Generate script
    console.log("Generating AI script...");
    const script = await generateCallScript(
      callData.userInfo,
      callData.callPurpose
    );
    callData.script = script;
    console.log("Script generated:", script.substring(0, 100) + "...");

    // Generate audio
    console.log("Generating audio from script...");
    const audioBuffer = await generateAudioFromScript(
      script,
      callData.voicePersona
    );
    callData.audioBuffer = audioBuffer;
    console.log("Audio generated successfully");

    // Make the call using Twilio with the generated script
    console.log(`Making call to ${callData.phoneNumber}...`);
    const call = await callClient.calls.create({
      to: callData.phoneNumber,
      from: "+18259069630", // Your Twilio number
      twiml: `<Response><Say voice="alice">${script}</Say></Response>`,
    });

    callData.callSid = call.sid;
    callData.status = "completed";

    console.log(`Call initiated successfully: ${call.sid}`);
  } catch (error) {
    console.error(`Failed to process call ${callData.id}:`, error);
    callData.status = "failed";
  }
}

// Check and process scheduled calls every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  console.log(`Checking scheduled calls at ${now.toISOString()}`);

  for (const [id, callData] of scheduledCalls) {
    if (callData.status === "pending" && callData.scheduledDateTime <= now) {
      console.log(`Found scheduled call ready for processing: ${id}`);
      await processScheduledCall(callData);
    }
  }
});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/twiml", (req: Request, res: Response) => {
  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Gather input="speech" action="/handle-speech" method="POST">
        <Say>
          Hi, this is John Smith. I'm calling because I'd like to book an appointment with Doctor Patel sometime next week. 
          I’ve been feeling under the weather and would really appreciate a check-up. Can you help me with that?
        </Say>
      </Gather>
      <Say>Sorry, I didn’t catch that. Please try again later. Goodbye!</Say>
    </Response>
  `);
});

app.get("/get-audio", async (req: Request, res: Response) => {
  try {
    const text =
      "Hello! 你好! Hola! नमस्ते! Bonjour! こんにちは! مرحبا! 안녕하세요! Ciao! Cześć! Привіт! வணக்கம்!";
    const voiceId = "eleven_multilingual_v2";

    const audioStream = await get_audio(text, voiceId); // This returns a Readable
    const audioBuffer = await streamToBuffer(audioStream); // Convert to Buffer

    cachedAudio = audioBuffer;
    res.status(200).send("Audio fetched and cached!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get audio");
  }
});

app.get("/play-audio", async (req: Request, res: Response) => {
  if (!cachedAudio) {
    res.status(400).send("No audio cached yet");
    return;
  }
  try {
    //send the audio as a response
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(cachedAudio);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to play audio");
  }
});

app.post("/call", async (req: Request, res: Response) => {
  try {
    const call = await callClient.calls.create({
      url: "https://712d-138-51-79-134.ngrok-free.app/twiml",
      to: "+18255616645",
      from: "+18259069630",
    });
    console.log(`Call initiated: ${call.sid}`);
    res.status(200).send("Call started");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get audio");
  }
});

// Handle speech and reply using ChatGPT
app.post("/handle-speech", async (req: Request, res: Response) => {
  const userInput = req.body.SpeechResult;
  console.log(`User said: ${userInput}`);

  let reply = "Sorry, I couldn't understand that.";

  if (userInput) {
    const roleplayPrompt = `
You are playing the role of **John Smith**, a patient trying to book a doctor's appointment over the phone.

- You work 9 to 5 on weekdays, so you prefer appointments on the **weekend**.
- The assistant (receptionist) just said: "${userInput}"
- Respond **only as John**. Do not include the assistant's lines.
- Your reply should be **one short sentence**, polite and natural.
- Do not include multiple options or inner thoughts — **only say one thing**.

Now reply only as John:
`;

    const chatResp = await chatWithSession("1", roleplayPrompt);
    reply = chatResp || reply;
  }

  console.log(`Replying with: ${reply}`);

  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Say>${reply}</Say>
      <Redirect method="POST">/twiml</Redirect>
    </Response>
  `);
});

app.post("/chat-gpt", async (req, res) => {
  const { prompt } = req.body;
  const response = await chatWithSession("1", prompt); // use your session chat logic
  res.json({ response });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
