import { OpenAI } from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VoiceSettings {
  speed: number;
  volume: number;
  voiceType: string;
  language: string;
}

export class VoiceService {
  private static instance: VoiceService;
  private constructor() {}

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async transcribeAudio(audioData: string): Promise<string> {
    try {
      const response = await openai.audio.transcriptions.create({
        file: audioData,
        model: "whisper-1",
      });
      return response.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }

  async generateResponse(verifiedClaims: any[], settings: VoiceSettings = null): Promise<string> {
    const defaultSettings: VoiceSettings = {
      speed: 1.0,
      volume: 1.0,
      voiceType: "standard",
      language: "en-US",
    };

    const finalSettings = settings || defaultSettings;

    // Generate summary for voice response
    const summary = verifiedClaims.map((claim) => {
      const status = claim.confidence >= 0.8 ? "verified" : claim.confidence >= 0.5 ? "uncertain" : "incorrect";
      return `The claim about ${claim.claim} is ${status}. ${claim.summary}`;
    }).join(" ");

    try {
      const response = await axios.post(
        "https://api.elevenlabs.io/v1/text-to-speech",
        {
          text: summary,
          voice_settings: {
            stability: finalSettings.speed,
            similarity_boost: finalSettings.volume,
          },
        },
        {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.audio;
    } catch (error) {
      console.error("Error generating voice response:", error);
      throw error;
    }
  }

  async processVoiceCommand(command: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a voice command processor for a fact-checking assistant. Only respond with JSON containing the command type and parameters.",
          },
          {
            role: "user",
            content: command,
          },
        ],
      });

      const { commandType, parameters } = JSON.parse(response.choices[0].message.content);
      return { commandType, parameters };
    } catch (error) {
      console.error("Error processing voice command:", error);
      throw error;
    }
  }
}
