import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { get_audio, play_audio } from './11labs';
import { Readable } from 'stream';
import { chatWithSession } from './chatgpt';

import prisma from './prisma';

import callClient from './call';

const app = express();
const port = process.env.PORT || 3000;

let cachedAudio: Buffer | null = null;

app.use(express.static('public')); // To serve static files like HTML
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
  
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/twiml', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Gather input="speech" action="/handle-speech" method="POST">
        <Say>Hi! What would you like to talk about?</Say>
      </Gather>
      <Say>We didn't hear anything. Goodbye!</Say>
    </Response>
  `);
});

app.get('/get-audio', async (req: Request, res: Response) => {
    try {
      const text = "Hello! 你好! Hola! नमस्ते! Bonjour! こんにちは! مرحبا! 안녕하세요! Ciao! Cześć! Привіт! வணக்கம்!";
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
  

app.get('/play-audio', async (req: Request, res: Response) => {
    if (!cachedAudio) {
        res.status(400).send("No audio cached yet");
        return;
    }
    try {
        //send the audio as a response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(cachedAudio);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to play audio");
    }
});

app.post('/call', async (req: Request, res: Response) => {
  try {
    const call = await callClient.calls.create({
    url: 'https://712d-138-51-79-134.ngrok-free.app/twiml', 
      to: '+18255616645',
      from: '+18259069630'
    });
    console.log(`Call initiated: ${call.sid}`);
    res.status(200).send("Call started");
  } catch (err) {
    console.error(err);
    res.status(500).send("Call failed");
  }
});

// Handle speech and reply using ChatGPT
app.post('/handle-speech', async (req: Request, res: Response) => {
  const userInput = req.body.SpeechResult;
  console.log(`User said: ${userInput}`);

  let reply = "Sorry, I couldn't understand that.";
  if (userInput) {
    const chatResp = await chatWithSession('1', userInput);
    reply = chatResp || reply;
  }

  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Say>${reply}</Say>
      <Redirect method="POST">/twiml</Redirect>
    </Response>
  `);
});


app.post('/chat-gpt', async (req, res) => {
    const { prompt } = req.body;
    const response = await chatWithSession('1', prompt); // use your session chat logic
    res.json({ response });
  });
  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
