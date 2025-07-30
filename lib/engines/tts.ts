import { ElevenLabsClient } from "@elevenlabs/tts";
const tts = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function synthesizeSpeech(text: string, voice = "Adam", speed = 1.0) {
  const audioBuffer = await tts.synthesize({ text, voice, speed, output_format: "mp3" });
  return audioBuffer.toString('base64'); // can return URL if stored
}