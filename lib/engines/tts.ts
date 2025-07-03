// TTS (text-to-speech) for MVP
// In production, integrate with ElevenLabs/Azure/Google for advanced TTS

import axios from 'axios';

// API Keys from environment
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  stability?: number;
  similarity_boost?: number;
}

interface TTSResponse {
  audioUrl: string;
  provider: string;
  duration: number;
  wordCount: number;
}

// ElevenLabs TTS
async function elevenLabsTTS(request: TTSRequest): Promise<TTSResponse | null> {
  if (!ELEVENLABS_API_KEY) return null;
  
  try {
    const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      text: request.text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: request.stability || 0.5,
        similarity_boost: request.similarity_boost || 0.5,
        style: 0.0,
        use_speaker_boost: true,
      },
    }, {
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    // Convert audio buffer to base64 or save to file
    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return {
      audioUrl,
      provider: 'ElevenLabs',
      duration: estimateDuration(request.text),
      wordCount: request.text.split(' ').length,
    };
  } catch (error) {
    console.error('ElevenLabs TTS failed:', error);
    return null;
  }
}

// Web Speech API fallback (browser-based)
function webSpeechTTS(text: string): TTSResponse {
  // This would be implemented in the frontend
  // For now, return a placeholder
  return {
    audioUrl: '', // Will be handled by browser's speech synthesis
    provider: 'Web Speech API',
    duration: estimateDuration(text),
    wordCount: text.split(' ').length,
  };
}

// Simple duration estimation (150 words per minute)
function estimateDuration(text: string): number {
  const words = text.split(' ').length;
  return (words / 150) * 60; // seconds
}

// Main TTS function with fallback
export async function textToSpeech(request: TTSRequest): Promise<TTSResponse> {
  const { text, voice, speed = 1.0, stability = 0.5, similarity_boost = 0.5 } = request;
  
  // Try ElevenLabs first
  const elevenLabsResult = await elevenLabsTTS(request);
  if (elevenLabsResult) {
    return elevenLabsResult;
  }
  
  // Fallback to Web Speech API
  return webSpeechTTS(text);
}

// Batch TTS for multiple texts
export async function batchTextToSpeech(texts: string[]): Promise<TTSResponse[]> {
  const promises = texts.map(text => 
    textToSpeech({ text, speed: 1.0 })
  );
  
  return Promise.all(promises);
}

// Specialized TTS for fact-checking results
export async function speakFactCheckResult(result: any): Promise<TTSResponse> {
  const text = `Fact check result: ${result.verdict}. ${result.explanation}`;
  return textToSpeech({
    text,
    speed: 0.9, // Slightly slower for clarity
    stability: 0.7, // More stable voice
  });
}

// TTS for voice commands
export async function speakVoiceCommand(command: string): Promise<TTSResponse> {
  const text = `Command received: ${command}`;
  return textToSpeech({
    text,
    speed: 1.1, // Faster for commands
    stability: 0.6,
  });
}

// Get available voices
export async function getAvailableVoices(): Promise<Array<{ id: string; name: string; description: string }>> {
  if (!ELEVENLABS_API_KEY) {
    return [
      { id: 'default', name: 'Default Voice', description: 'System default voice' },
    ];
  }
  
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });
    
    return response.data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.labels?.description || voice.name,
    }));
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    return [
      { id: 'default', name: 'Default Voice', description: 'System default voice' },
    ];
  }
} 