import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { get_audio, play_audio } from './11labs';
import { Readable } from 'stream';
import { chatWithSession } from './chatgpt';

import prisma from './prisma';

const app = express();
const port = process.env.PORT || 3000;

let cachedAudio: Buffer | null = null;

app.use(express.static('public')); // To serve static files like HTML
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

app.post('/chat-gpt', async (req, res) => {
    const { prompt } = req.body;
    const response = await chatWithSession('1', prompt); // use your session chat logic
    res.json({ response });
  });
  


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
