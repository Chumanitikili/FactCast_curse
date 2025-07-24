import { AssemblyAI } from 'assemblyai'; // Corrected import
import { RealtimeService } from 'assemblyai'; // Corrected import
import { RealtimeSession } from 'assemblyai'; // Corrected import
import type { TranscriptSegment } from '../realtime-types'; // Adjust import path if necessary
import { executeQuery } from '../database/connection'; // Adjust import path if necessary

interface AssemblyAIRealtimeServiceOptions {
  sessionId: string;
  onTranscript: (segment: TranscriptSegment) => void;
  onError: (error: Error) => void;
  onClose: (code: number, reason: string) => void;
}

export class AssemblyAIRealtimeProcessor {
  private realtimeClient: RealtimeService;
  private session: RealtimeSession | null = null;
  private sessionId: string;
  private onTranscriptCallback: (segment: TranscriptSegment) => void;
  private onErrorCallback: (error: Error) => void;
  private onCloseCallback: (code: number, reason: string) => void;

  constructor(options: AssemblyAIRealtimeServiceOptions) {
    const assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyaiApiKey) {
      throw new Error("ASSEMBLYAI_API_KEY environment variable is not set.");
    }

    this.realtimeClient = new AssemblyAI({ apiKey: assemblyaiApiKey }).realtime;
    this.sessionId = options.sessionId;
    this.onTranscriptCallback = options.onTranscript;
    this.onErrorCallback = options.onError;
    this.onCloseCallback = options.onClose;
  }

  async connect(): Promise<void> {
    try {
      this.session = await this.realtimeClient.connect({
        onData: (data) => {
          if (data.message_type === 'PartialTranscript') {
            // Handle partial transcripts if needed for real-time display
            // console.log('Partial Transcript:', data.text);
          } else if (data.message_type === 'FinalTranscript') {
            // Handle final transcripts
            console.log('Final Transcript:', data.text);
            const transcriptSegment: TranscriptSegment = {
              id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: data.audio_start / 1000, // Use start time from AssemblyAI (in seconds)
              text: data.text,
              confidence: data.confidence,
              sessionId: this.sessionId,
              isProcessed: false, // Mark as not yet processed for claims
              speaker: data.speaker, // If speaker diarization is enabled
            };
            this.onTranscriptCallback(transcriptSegment);
             // Save final transcript segment to your database here
             // Note: The timestamp in the DB is in milliseconds, converting from seconds
             executeQuery(
                "INSERT INTO transcript_segments (id, session_id, timestamp_ms, text, confidence, is_processed, speaker) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [transcriptSegment.id, transcriptSegment.sessionId, transcriptSegment.timestamp * 1000, transcriptSegment.text, transcriptSegment.confidence, transcriptSegment.isProcessed, transcriptSegment.speaker],
             ).catch(console.error); // Basic error handling for DB save
          }
        },
        onError: (error) => {
          console.error('AssemblyAI Realtime Error:', error);
          this.onErrorCallback(error);
        },
        onClose: (code, reason) => {
          console.log('AssemblyAI Realtime Closed:', code, reason);
          this.onCloseCallback(code, reason);
        },
        // Add AssemblyAI specific configuration options here if needed,
        // e.g., enable_speaker_diarization: true, speaker_low_latency: true
         configuration: {
             enable_speaker_diarization: true,
             speaker_low_latency: true,
             // Add other relevant options based on your needs and AssemblyAI docs
         }
      });
      console.log('Connected to AssemblyAI Realtime Service');
    } catch (error) {
      console.error('Failed to connect to AssemblyAI Realtime Service:', error);
      this.onErrorCallback(error);
    }
  }

  sendAudioChunk(audioData: ArrayBuffer): void {
    if (this.session?.isOpen) {
      // Convert ArrayBuffer to Blob if required by AssemblyAI SDK stream method
      // The SDK's stream method might directly accept ArrayBuffer,
      // or require other formats. Check AssemblyAI SDK documentation.
       this.session.stream(audioData);
    } else {
      console.warn('AssemblyAI Realtime session is not open.');
      // Handle case where session is not open
    }
  }

  close(): void {
    if (this.session?.isOpen) {
      this.session.close();
    }
  }
}
