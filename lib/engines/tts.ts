import { ElevenLabsClient } from "@elevenlabs/tts";

// Podcast-friendly, adjustable TTS
const tts = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function speak(text: string, voice = "Adam", speed = 1.0) {
  const audioBuffer = await tts.synthesize({
    text,
    voice,
    speed,
    output_format: "mp3"
  });
  return audioBuffer; // send as audio stream to frontend or mobile
}