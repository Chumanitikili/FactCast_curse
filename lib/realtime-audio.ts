export interface TranscriptSegment {
  text: string
  timestamp: number
}

export interface VoiceCommand {
  command: string
  params: any
}

export interface SessionSettings {
  hotkey?: string
  autoFactCheck?: boolean
}

export interface LiveFactCheck {
  result: string
  source: string
}

export class RealTimeAudioProcessor {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private websocket: WebSocket | null = null
  private isRecording = false
  private onTranscriptCallback?: (segment: TranscriptSegment) => void
  private onVoiceCommandCallback?: (command: VoiceCommand) => void

  constructor(
    private sessionId: string,
    private settings: SessionSettings,
  ) {}

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 })

      // Setup media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      // Setup WebSocket connection
      this.websocket = new WebSocket(`ws://localhost:3000/api/realtime/${this.sessionId}`)

      this.setupEventListeners()

      console.log("Real-time audio processor initialized")
    } catch (error) {
      console.error("Failed to initialize audio processor:", error)
      throw error
    }
  }

  private setupEventListeners(): void {
    if (!this.mediaRecorder || !this.websocket) return

    // Media recorder events
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        // Send audio chunk for transcription
        this.websocket.send(event.data)
      }
    }

    // WebSocket events
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "transcript":
          this.handleTranscript(data.segment)
          break
        case "voice_command":
          this.handleVoiceCommand(data.command)
          break
        case "fact_check_result":
          this.handleFactCheckResult(data.result)
          break
      }
    }

    // Setup hotkey listener
    if (this.settings.hotkey) {
      document.addEventListener("keydown", (event) => {
        if (event.code === this.settings.hotkey && event.ctrlKey) {
          this.triggerManualFactCheck()
        }
      })
    }
  }

  startRecording(): void {
    if (this.mediaRecorder && !this.isRecording) {
      this.mediaRecorder.start(1000) // Send chunks every second
      this.isRecording = true
      console.log("Started real-time recording")
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      console.log("Stopped real-time recording")
    }
  }

  private handleTranscript(segment: TranscriptSegment): void {
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(segment)
    }

    // Auto fact-check if enabled
    if (this.settings.autoFactCheck && this.containsFactualClaim(segment.text)) {
      this.requestFactCheck(segment)
    }
  }

  private handleVoiceCommand(command: VoiceCommand): void {
    if (this.onVoiceCommandCallback) {
      this.onVoiceCommandCallback(command)
    }
  }

  private handleFactCheckResult(result: LiveFactCheck): void {
    // Handle completed fact-check result
    console.log("Fact-check completed:", result)
  }

  private containsFactualClaim(text: string): boolean {
    // Simple heuristic to detect factual claims
    const factualIndicators = [
      /\d+%/, // percentages
      /in \d{4}/, // years
      /according to/, // citations
      /studies show/, // research claims
      /data shows/, // data claims
      /\$[\d,]+/, // monetary amounts
      /\d+\s*(million|billion|thousand)/, // large numbers
    ]

    return factualIndicators.some((pattern) => pattern.test(text.toLowerCase()))
  }

  private requestFactCheck(segment: TranscriptSegment): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "fact_check_request",
          segment,
        }),
      )
    }
  }

  private triggerManualFactCheck(): void {
    // Trigger fact-check for current audio or selected text
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "manual_fact_check",
          timestamp: Date.now(),
        }),
      )
    }
  }

  onTranscript(callback: (segment: TranscriptSegment) => void): void {
    this.onTranscriptCallback = callback
  }

  onVoiceCommand(callback: (command: VoiceCommand) => void): void {
    this.onVoiceCommandCallback = callback
  }

  cleanup(): void {
    this.stopRecording()
    this.websocket?.close()
    this.audioContext?.close()
  }
}
