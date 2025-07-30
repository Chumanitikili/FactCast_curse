import { SpeechClient } from "@google-cloud/speech";
const client = new SpeechClient();

export async function transcribeAudio(audioBase64: string) {
  const audio = {
    content: audioBase64,
  };
  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US",
  };
  const [resp] = await client.recognize({ audio, config });
  return resp.results?.map(r => r.alternatives[0].transcript).join(' ') || '';
}
