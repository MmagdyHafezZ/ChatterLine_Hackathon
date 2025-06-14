import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  throw new Error('Missing ELEVENLABS_API_KEY in .env');
}


const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey,
});

export async function streamToBuffer(readableStream: any): Promise<Buffer> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}


async function get_audio(text: string, modelId: string) {
    try {
      const audio = await elevenlabs.textToSpeech.convert("Xb7hH8MSUJpSbSDYk0k2", {
        text,
        modelId
      });
  
      if (!audio) {
        throw new Error("Received null or empty audio from ElevenLabs API");
      }

      // save the audio to a file
      const buffer = await streamToBuffer(audio);
      fs.writeFileSync(path.join(__dirname, 'audio/output.mp3'), buffer);
      console.log("Audio fetched successfully");
  
      return audio;
    } catch (err) {

    }

  }
async function play_audio(audio: any) {
    if (!audio) {
        throw new Error('No audio data received');
    }
    console.log('Playing audio...');
    await play(audio);
}

// Example usage
//    text: "Hello! 你好! Hola! नमस्ते! Bonjour! こんにちは! مرحبا! 안녕하세요! Ciao! Cześć! Привіт! வணக்கம்!",
//    modelId: "eleven_multilingual_v2",

async function save_audio(readableStream: any, filename: string): Promise<void> {
  const filePath = path.join(__dirname, 'audio', filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);

  fs.writeFileSync(filePath, buffer);
  console.log(`Audio saved to ${filePath}`);
  
}
export { get_audio, play_audio, elevenlabs };