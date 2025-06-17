import type {
  VoiceInput,
  TextInput,
  FactCheckClaim,
  FactCheckResult,
  VoiceCommand,
  MultiModalSession,
  AudioFeedback,
} from "../types/multi-modal"

interface VerificationSource {
  id: string
  title: string
  url: string
  domain: string
  credibilityScore: number
  sourceType: string
  excerpt: string
  publishDate: string
}

export class MultiModalProcessor {
  private sessions = new Map<string, MultiModalSession>()
  private wakeWordDetector: WakeWordDetector
  private speechToText: SpeechToTextEngine
  private textToSpeech: TextToSpeechEngine
  private claimDetector: ClaimDetectionEngine
  private factChecker: MultiSourceFactChecker
  private voiceCommandProcessor: VoiceCommandProcessor

  constructor() {
    this.wakeWordDetector = new WakeWordDetector(["hey factbot", "factbot"])
    this.speechToText = new SpeechToTextEngine()
    this.textToSpeech = new TextToSpeechEngine()
    this.claimDetector = new ClaimDetectionEngine()
    this.factChecker = new MultiSourceFactChecker()
    this.voiceCommandProcessor = new VoiceCommandProcessor()
  }

  async processVoiceInput(input: VoiceInput): Promise<void> {
    const session = this.sessions.get(input.sessionId)
    if (!session) return

    try {
      // Step 1: Check for wake word
      const hasWakeWord = await this.wakeWordDetector.detect(input.audioData)

      if (hasWakeWord) {
        // Process as voice command
        const transcript = await this.speechToText.transcribe(input.audioData)
        const command = await this.voiceCommandProcessor.parse(transcript)
        await this.handleVoiceCommand(command, session)
        return
      }

      // Step 2: Convert speech to text for claim detection
      const transcript = await this.speechToText.transcribe(input.audioData)

      if (session.mode === "passive" || session.mode === "hybrid") {
        // Step 3: Detect potential claims
        const claims = await this.claimDetector.detectClaims(transcript)

        for (const claim of claims) {
          await this.processClaim(claim, session)
        }
      }
    } catch (error) {
      console.error("Voice processing error:", error)
    }
  }

  async processTextInput(input: TextInput): Promise<void> {
    const session = this.sessions.get(input.sessionId)
    if (!session) return

    try {
      if (input.type === "voice_command") {
        const command = await this.voiceCommandProcessor.parse(input.text)
        await this.handleVoiceCommand(command, session)
        return
      }

      // Detect claims in text input
      const claims = await this.claimDetector.detectClaims(input.text)

      for (const claim of claims) {
        await this.processClaim(claim, session)
      }
    } catch (error) {
      console.error("Text processing error:", error)
    }
  }

  private async processClaim(claim: FactCheckClaim, session: MultiModalSession): Promise<void> {
    // Add claim to session
    session.claims.push(claim)

    // Start fact-checking process
    const startTime = Date.now()

    try {
      const result = await this.factChecker.verifyClaimWithThreeSources(claim.text)
      const processingTime = Date.now() - startTime

      const factCheckResult: FactCheckResult = {
        id: `result_${Date.now()}`,
        claimId: claim.id,
        accuracy: result.accuracy,
        confidence: result.confidence,
        summary: await this.generateSummary(result, session.voiceSettings.enabled),
        sources: result.sources,
        processingTime,
        timestamp: Date.now(),
      }

      session.results.push(factCheckResult)

      // Deliver results based on session mode
      await this.deliverResults(factCheckResult, session)
    } catch (error) {
      console.error("Fact-checking error:", error)
    }
  }

  private async handleVoiceCommand(command: VoiceCommand, session: MultiModalSession): Promise<void> {
    switch (command.intent) {
      case "fact_check":
        const claimText = command.parameters.claim || command.parameters.text
        if (claimText) {
          const claim: FactCheckClaim = {
            id: `claim_${Date.now()}`,
            text: claimText,
            timestamp: command.timestamp,
            confidence: command.confidence,
            type: "voice_command",
            sessionId: session.id,
          }
          await this.processClaim(claim, session)
        }
        break

      case "read_sources":
        const lastResult = session.results[session.results.length - 1]
        if (lastResult) {
          await this.readSourcesAloud(lastResult, session)
        }
        break

      case "save_result":
        // Save current fact-check for later reference
        await this.saveFactCheckResult(session)
        break

      case "toggle_mode":
        await this.toggleSessionMode(session)
        break

      case "help":
        await this.provideVoiceHelp(session)
        break
    }
  }

  private async generateSummary(
    result: any,
    includeAudio: boolean,
  ): Promise<{ text: string; audioUrl?: string; duration?: number }> {
    // Generate concise text summary (30-60 words)
    const textSummary = await this.generateTextSummary(result)

    if (!includeAudio) {
      return { text: textSummary }
    }

    // Generate voice summary (10-15 seconds)
    const audioSummary = await this.textToSpeech.synthesize(textSummary, {
      speed: 1.1,
      voice: "professional",
      maxDuration: 15,
    })

    return {
      text: textSummary,
      audioUrl: audioSummary.url,
      duration: audioSummary.duration,
    }
  }

  private async generateTextSummary(result: any): Promise<string> {
    const accuracy = result.accuracy
    const confidence = result.confidence
    const mainSource = result.sources[0]

    switch (accuracy) {
      case "verified":
        return `✅ Verified (${confidence} confidence). ${mainSource.excerpt.substring(0, 100)}... Source: ${mainSource.domain}`

      case "false":
        return `❌ Incorrect (${confidence} confidence). ${mainSource.excerpt.substring(0, 100)}... Source: ${mainSource.domain}`

      case "uncertain":
        return `⚠️ Uncertain (${confidence} confidence). Mixed evidence found. Check sources for details.`

      case "partial":
        return `🔶 Partially correct (${confidence} confidence). ${mainSource.excerpt.substring(0, 100)}... Source: ${mainSource.domain}`

      default:
        return `🔍 Unable to verify. Please check sources manually.`
    }
  }

  private async deliverResults(result: FactCheckResult, session: MultiModalSession): Promise<void> {
    // Always send visual results
    await this.sendVisualUpdate(result, session)

    // Send audio feedback if enabled
    if (session.voiceSettings.enabled && session.voiceSettings.privateAudio) {
      const audioFeedback: AudioFeedback = {
        text: result.summary.text,
        audioUrl: result.summary.audioUrl!,
        duration: result.summary.duration!,
        priority: result.accuracy === "false" ? "high" : "medium",
        type: "fact_check",
      }

      await this.sendAudioFeedback(audioFeedback, session)
    }
  }

  private async sendVisualUpdate(result: FactCheckResult, session: MultiModalSession): Promise<void> {
    // Send to WebSocket clients
    const visualUpdate = {
      type: "fact_check_result",
      sessionId: session.id,
      result: {
        id: result.id,
        accuracy: result.accuracy,
        confidence: result.confidence,
        summary: result.summary.text,
        sources: result.sources.map((s) => ({
          title: s.title,
          domain: s.domain,
          credibilityScore: s.credibilityScore,
          url: s.url,
        })),
        processingTime: result.processingTime,
      },
    }

    // Broadcast to connected clients
    this.broadcastToSession(session.id, visualUpdate)
  }

  private async sendAudioFeedback(feedback: AudioFeedback, session: MultiModalSession): Promise<void> {
    const audioUpdate = {
      type: "audio_feedback",
      sessionId: session.id,
      feedback: {
        audioUrl: feedback.audioUrl,
        duration: feedback.duration,
        priority: feedback.priority,
        type: feedback.type,
      },
    }

    this.broadcastToSession(session.id, audioUpdate)
  }

  private async readSourcesAloud(result: FactCheckResult, session: MultiModalSession): Promise<void> {
    const sourcesText = result.sources
      .map((source, index) => `Source ${index + 1}: ${source.title} from ${source.domain}. ${source.excerpt}`)
      .join(". ")

    const audioSummary = await this.textToSpeech.synthesize(sourcesText, {
      speed: 1.0,
      voice: "professional",
    })

    const audioFeedback: AudioFeedback = {
      text: sourcesText,
      audioUrl: audioSummary.url,
      duration: audioSummary.duration,
      priority: "medium",
      type: "fact_check",
    }

    await this.sendAudioFeedback(audioFeedback, session)
  }

  private broadcastToSession(sessionId: string, message: any): void {
    // Implementation would use WebSocket or Server-Sent Events
    console.log(`Broadcasting to session ${sessionId}:`, message)
  }

  // Session management methods
  createSession(userId: string, title: string, mode: MultiModalSession["mode"]): MultiModalSession {
    const session: MultiModalSession = {
      id: `session_${Date.now()}`,
      userId,
      title,
      mode,
      voiceSettings: {
        enabled: mode !== "text_only",
        privateAudio: true,
        voiceType: "professional",
        speed: 1.0,
        volume: 0.8,
      },
      isLive: true,
      startTime: new Date().toISOString(),
      claims: [],
      results: [],
    }

    this.sessions.set(session.id, session)
    return session
  }

  getSession(sessionId: string): MultiModalSession | undefined {
    return this.sessions.get(sessionId)
  }

  updateSessionSettings(sessionId: string, settings: Partial<MultiModalSession["voiceSettings"]>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.voiceSettings = { ...session.voiceSettings, ...settings }
    }
  }

  private async toggleSessionMode(session: MultiModalSession): Promise<void> {
    const modes: MultiModalSession["mode"][] = ["voice_only", "text_only", "hybrid", "passive"]
    const currentIndex = modes.indexOf(session.mode)
    const nextIndex = (currentIndex + 1) % modes.length
    session.mode = modes[nextIndex]

    const confirmationText = `Mode switched to ${session.mode.replace("_", " ")}`
    const audioConfirmation = await this.textToSpeech.synthesize(confirmationText)

    await this.sendAudioFeedback(
      {
        text: confirmationText,
        audioUrl: audioConfirmation.url,
        duration: audioConfirmation.duration,
        priority: "low",
        type: "confirmation",
      },
      session,
    )
  }

  private async provideVoiceHelp(session: MultiModalSession): Promise<void> {
    const helpText = `Available commands: Say "Hey FactBot, check" followed by your claim. Say "read sources" to hear source details. Say "toggle mode" to switch between voice and text modes. Say "save result" to bookmark a fact-check.`

    const audioHelp = await this.textToSpeech.synthesize(helpText)

    await this.sendAudioFeedback(
      {
        text: helpText,
        audioUrl: audioHelp.url,
        duration: audioHelp.duration,
        priority: "medium",
        type: "confirmation",
      },
      session,
    )
  }

  private async saveFactCheckResult(session: MultiModalSession): Promise<void> {
    const lastResult = session.results[session.results.length - 1]
    if (lastResult) {
      // Save to database or user's saved items
      console.log("Saving fact-check result:", lastResult.id)

      const confirmationText = "Fact-check saved to your library"
      const audioConfirmation = await this.textToSpeech.synthesize(confirmationText)

      await this.sendAudioFeedback(
        {
          text: confirmationText,
          audioUrl: audioConfirmation.url,
          duration: audioConfirmation.duration,
          priority: "low",
          type: "confirmation",
        },
        session,
      )
    }
  }
}

// Supporting engine classes (simplified interfaces)
class WakeWordDetector {
  constructor(private wakeWords: string[]) {}

  async detect(audioData: ArrayBuffer): Promise<boolean> {
    // Implementation would use wake word detection library
    return Math.random() > 0.9 // Mock: 10% chance of wake word detection
  }
}

class SpeechToTextEngine {
  async transcribe(audioData: ArrayBuffer): Promise<string> {
    // Integration with Google Speech-to-Text, Azure Speech, or Whisper
    return "Mock transcription of audio data"
  }
}

class TextToSpeechEngine {
  async synthesize(
    text: string,
    options?: { speed?: number; voice?: string; maxDuration?: number },
  ): Promise<{ url: string; duration: number }> {
    // Integration with ElevenLabs, Azure TTS, or Google Cloud TTS
    return {
      url: `/api/audio/tts/${Date.now()}.mp3`,
      duration: Math.min(text.length * 0.1, options?.maxDuration || 30),
    }
  }
}

class ClaimDetectionEngine {
  async detectClaims(text: string): Promise<FactCheckClaim[]> {
    // Advanced NLP to detect factual claims
    const factualIndicators = [
      /\d+%/, // percentages
      /in \d{4}/, // years
      /according to/, // citations
      /studies show/, // research claims
      /data shows/, // data claims
      /\$[\d,]+/, // monetary amounts
      /\d+\s*(million|billion|thousand)/, // large numbers
    ]

    const hasClaim = factualIndicators.some((pattern) => pattern.test(text.toLowerCase()))

    if (hasClaim) {
      return [
        {
          id: `claim_${Date.now()}`,
          text: text,
          timestamp: Date.now(),
          confidence: 0.8,
          type: "detected",
          sessionId: "current",
        },
      ]
    }

    return []
  }
}

class MultiSourceFactChecker {
  async verifyClaimWithThreeSources(claim: string): Promise<{
    accuracy: "verified" | "false" | "uncertain" | "partial"
    confidence: "high" | "medium" | "low"
    sources: VerificationSource[]
  }> {
    // Implementation would search multiple APIs and sources
    // Must return exactly 3 sources as per requirements

    const mockSources: VerificationSource[] = [
      {
        id: "1",
        title: "Reuters Fact Check",
        url: "https://reuters.com/fact-check",
        domain: "reuters.com",
        credibilityScore: 95,
        sourceType: "news",
        excerpt: "According to verified data...",
        publishDate: "2024-01-15",
      },
      {
        id: "2",
        title: "Academic Research Paper",
        url: "https://pubmed.ncbi.nlm.nih.gov/12345",
        domain: "pubmed.ncbi.nlm.nih.gov",
        credibilityScore: 98,
        sourceType: "academic",
        excerpt: "Peer-reviewed study confirms...",
        publishDate: "2023-12-01",
      },
      {
        id: "3",
        title: "Government Statistics",
        url: "https://data.gov/statistics",
        domain: "data.gov",
        credibilityScore: 92,
        sourceType: "government",
        excerpt: "Official government data shows...",
        publishDate: "2024-01-01",
      },
    ]

    return {
      accuracy: "verified",
      confidence: "high",
      sources: mockSources,
    }
  }
}

class VoiceCommandProcessor {
  async parse(transcript: string): Promise<VoiceCommand> {
    const lowerTranscript = transcript.toLowerCase()

    // Intent recognition
    let intent: VoiceCommand["intent"] = "help"
    const parameters: Record<string, any> = {}

    if (lowerTranscript.includes("check") || lowerTranscript.includes("fact")) {
      intent = "fact_check"
      parameters.claim = transcript.replace(/hey factbot|check|fact/gi, "").trim()
    } else if (lowerTranscript.includes("read sources") || lowerTranscript.includes("sources")) {
      intent = "read_sources"
    } else if (lowerTranscript.includes("save")) {
      intent = "save_result"
    } else if (lowerTranscript.includes("toggle") || lowerTranscript.includes("mode")) {
      intent = "toggle_mode"
    }

    return {
      command: transcript,
      intent,
      parameters,
      confidence: 0.9,
      timestamp: Date.now(),
    }
  }
}
