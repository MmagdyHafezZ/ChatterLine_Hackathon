import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  throw new Error('Missing ELEVENLABS_API_KEY in .env');
}


const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey,
});

async function get_audio(text: string, modelId: string) {
    try {
      const audio = await elevenlabs.textToSpeech.convert("Xb7hH8MSUJpSbSDYk0k2", {
        text,
        modelId
      });
  
      if (!audio) {
        throw new Error("Received null or empty audio from ElevenLabs API");
      }
  
      return audio;
    } catch (err) {
      console.error("get_audio failed:", err);
      throw err ?? new Error("Unknown error in get_audio");
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


export { get_audio, play_audio, elevenlabs };