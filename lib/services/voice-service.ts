import { OpenAI } from "openai";
import axios from "axios";

// Import necessary library for Eleven Labs (install if needed)
// pnpm install elevenlabs
// yarn add elevenlabs
// npm install elevenlabs
import { ElevenLabsClient } from 'elevenlabs'; // Adjust import based on the library

// Import types (adjust path if necessary)
// Assuming VoiceSettings and other relevant types are defined elsewhere or can be defined here
interface VoiceSettings {
  speed: number;
  volume: number;
  voiceType: string; // This will likely correspond to an Eleven Labs voice ID
  language: string;
  // Add other relevant voice settings like stability, clarity, etc. if needed for Eleven Labs
   stability?: number;
   similarityBoost?: number;
}

// Assuming FactCheckResult type is defined elsewhere
interface FactCheckResult {
    id: string;
    claimId: string;
    accuracy: "verified" | "false" | "uncertain" | "partial";
    confidence: "high" | "medium" | "low";
    summary: {
      text: string;
      audioUrl?: string;
      duration?: number;
    };
    sources: any[]; // Replace with actual Source type
    processingTime: number;
    timestamp: number;
}


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-build",
});

// API Key from environment for Eleven Labs
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY; // Use environment variable name

// Initialize Eleven Labs client
const elevenLabsClient = elevenLabsApiKey ? new ElevenLabsClient({ apiKey: elevenLabsApiKey }) : null;

if (!elevenLabsClient) {
    console.warn("ELEVENLABS_API_KEY environment variable not set. Eleven Labs integration disabled.");
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

  // Existing method for audio transcription (using OpenAI Whisper)
  async transcribeAudio(audioData: string): Promise<string> {
    // **TODO: This method seems to be intended for file upload,
    // but you are using AssemblyAI for real-time transcription.
    // Decide if you still need this method or remove it.**
    // If you keep it, ensure 'audioData' is in a format compatible with openai.audio.transcriptions.create.
    console.warn("VoiceService.transcribeAudio is using OpenAI Whisper. Ensure this is the desired STT method or remove.");
    try {
      // The 'file' parameter usually expects a File object or similar in a browser environment.
      // In a Node.js environment, it might expect a ReadStream or Buffer.
      // You might need to adjust how audioData is handled here based on the input format.
      const response = await openai.audio.transcriptions.create({
        // Assuming audioData is a Buffer or compatible format
        file: audioData as any, // Cast to any for now, adjust based on actual type
        model: "whisper-1",
      });
      return response.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }

  // Existing method for generating a response (purpose unclear from this snippet)
  async generateResponse(verifiedClaims: any[], settings: VoiceSettings = null): Promise<string> {
    const defaultSettings: VoiceSettings = {
      speed: 1.0,
      volume: 1.0,
      voiceType: "standard", // Ensure this "standard" maps to a real voice or setting
      language: "en-US",
      stability: 0.7, // Example default for Eleven Labs
      similarityBoost: 0.8, // Example default for Eleven Labs
    };

    // Merge provided settings with defaults
    const finalSettings = { ...defaultSettings, ...settings };

    // **TODO: Implement the logic for generating a response based on verified claims and settings.**
    // This method's purpose is not fully clear from the snippet.
    // If it's for generating a spoken response summarizing claims, it might involve:
    // 1. Using an AI model (like OpenAI or Gemini) to generate the text of the response based on claims.
    // 2. Calling the generateVoiceSummary method below to convert the text to speech.
    console.warn("VoiceService.generateResponse method needs implementation based on its intended purpose.");
     return "This is a placeholder response."; // Placeholder
  }

  // New method to generate voice summary using Eleven Labs
  async generateVoiceSummary(textSummary: string, voiceSettings: VoiceSettings): Promise<{ audioUrl?: string; duration?: number }> {
      if (!elevenLabsClient) {
          console.warn("Eleven Labs client not initialized. Cannot generate voice summary.");
          return {};
      }

      if (!textSummary || textSummary.trim() === "") {
          console.warn("Text summary is empty. Skipping voice summary generation.");
          return {};
      }

      try {
          // **TODO: Implement Eleven Labs API call to generate audio**
          // Use the Eleven Labs client to synthesize speech from textSummary.
          // Refer to the Eleven Labs SDK documentation for the correct method and parameters.
          // Use voiceSettings to configure the generation (voice, speed, etc.).

          // Example (Conceptual using a possible SDK method):
          /*
          const audio = await elevenLabsClient.generate({
              text: textSummary,
              voice: voiceSettings.voiceType, // Use voiceType from settings (should be an Eleven Labs voice ID)
              model_id: 'eleven_multilingual_v2', // Specify a model ID based on language and quality needs
              // Add other parameters based on voiceSettings and Eleven Labs API:
               voice_settings: {
                   stability: voiceSettings.stability,
                   similarity_boost: voiceSettings.similarityBoost,
               },
               // Eleven Labs handles speed differently, you might need to adjust the text or use their rate parameter if available
          });
          */

          // Assuming the API returns an audio stream or audio data directly.
          // If it returns an audio stream, you'll need to handle it (e.g., pipe to a file stream).
          // If it returns audio data, you'll likely need to store it (e.g., in S3) and get a URL.

          // **TODO: Handle the audio output from Eleven Labs**
          // If the API returns a stream:
          // const audioStream = await elevenLabsClient.textToSpeech.stream({ ... });
          // You would then stream this to a file in your storage service (e.g., S3).

          // If the API returns a pre-signed URL or similar:
          // const audioUrl = apiResponse.audioUrl;

          // For now, a placeholder:
          const mockAudioUrl = `https://your-storage-service.com/voice-summaries/${Date.now()}.mp3`; // Placeholder URL
          const mockDuration = textSummary.split(' ').length * 0.4; // Estimate duration (adjust as needed)


          console.log("Generated voice summary (conceptual):", mockAudioUrl);

          // **TODO: Store the generated audio file in your storage service (e.g., S3)**
          // If the Eleven Labs API gives you audio data directly, you'll need to save it.
          // You'll likely need to use your S3 service client here.
          // Example:
          // import { uploadAudioToS3, getS3PublicUrl } from '../storage/s3'; // Assuming S3 service exists
          // const s3Key = `voice-summaries/${Date.now()}.mp3`;
          // await uploadAudioToS3(audioData, s3Key); // Implement uploadAudioToS3
          // const publicAudioUrl = getS3PublicUrl(s3Key); // Implement getS3PublicUrl
          // return { audioUrl: publicAudioUrl, duration: mockDuration }; // Return the S3 URL and duration


          return { audioUrl: mockAudioUrl, duration: mockDuration }; // Return the placeholder URL and duration

      } catch (error) {
          console.error("Error generating voice summary with Eleven Labs:", error);
          // Handle error appropriately - perhaps return an empty object or throw
          return {};
      }
  }


  // **TODO: Add other voice-related methods as needed**
  // e.g., getAvailableVoices(), setVoiceSettings() etc.

}

// **TODO: Integrate the generateVoiceSummary function into your fact-checking job processor**
// After the AI text summary is generated for a fact-check result, call this function:
/*
async function processFactCheckJob(jobData: any) {
    // ... (Claim detection, source aggregation, text summarization) ...

    const textSummary = factCheckResult.summary.text; // Assuming you have the text summary
    const voiceSettings = jobData.settings.voiceSettings; // Assuming voice settings are passed in job data

    // Get the VoiceService instance
    const voiceService = VoiceService.getInstance();

    const voiceSummary = await voiceService.generateVoiceSummary(textSummary, voiceSettings);

    // Update the fact_check_results table with the voice summary details
    // await executeQuery(
    //     "UPDATE fact_check_results SET ai_voice_summary_url = $1, ai_voice_summary_duration = $2 WHERE id = $3",
    //      [voiceSummary.audioUrl, voiceSummary.duration, factCheckResult.id]
    // );

    // ... (Emit fact-check-result via WebSocket) ...
}
*/

// **TODO: Review the existing transcribeAudio method.**
// You are using AssemblyAI for real-time transcription.
// Decide if the existing transcribeAudio method using OpenAI Whisper is still needed for other purposes
// (e.g., processing pre-recorded audio files for podcasts) or if it can be removed.
// If kept, ensure the audioData input type and handling are correct for OpenAI's API.
