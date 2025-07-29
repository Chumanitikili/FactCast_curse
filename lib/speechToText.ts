import { SpeechClient } from "@google-cloud/speech";
import { PassThrough } from "stream";

// Continuous real-time speech-to-text streaming for <3s latency
const client = new SpeechClient();

export async function transcribeStream(audioStream: PassThrough, onTranscript: (text: string) => void) {
  const request = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    },
    interimResults: true,
  };

  const recognizeStream = client
    .streamingRecognize(request)
    .on("data", (data: any) => {
      if (data.results[0] && data.results[0].alternatives[0]) {
        onTranscript(data.results[0].alternatives[0].transcript);
      }
    })
    .on("error", (err: Error) => {
      console.error("Speech-to-text error:", err);
    });

  audioStream.pipe(recognizeStream);
}