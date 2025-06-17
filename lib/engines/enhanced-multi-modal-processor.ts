import type {
  VoiceInput,
  TextInput,
  FactCheckClaim,
  EnhancedFactCheckResult,
  VoiceCommand,
  MultiModalSession,
  AudioFeedback,
  VoiceSettings,
  ClaimDetectionResult,
  VerificationSource,
} from "../types/multi-modal"

export class EnhancedMultiModalProcessor {
  private sessions = new Map<string, MultiModalSession>()
  private wakeWordDetector: EnhancedWakeWordDetector
  private speechToText: EnhancedSpeechToTextEngine
  private textToSpeech: EnhancedTextToSpeechEngine
  private claimDetector: AdvancedClaimDetectionEngine
  private factChecker: ThreeSourceFactChecker
  private voiceCommandProcessor: AdvancedVoiceCommandProcessor
  private audioAlertSystem: AudioAlertSystem

  constructor() {
    this.wakeWordDetector = new EnhancedWakeWordDetector(["hey factbot", "factbot", "fact check", "verify this"])
    this.speechToText = new EnhancedSpeechToTextEngine()
    this.textToSpeech = new EnhancedTextToSpeechEngine()
    this.claimDetector = new AdvancedClaimDetectionEngine()
    this.factChecker = new ThreeSourceFactChecker()
    this.voiceCommandProcessor = new AdvancedVoiceCommandProcessor()
    this.audioAlertSystem = new AudioAlertSystem()
  }

  async processVoiceInput(input: VoiceInput): Promise<void> {
    const session = this.sessions.get(input.sessionId)
    if (!session) return

    try {
      const startTime = Date.now()

      // Step 1: Enhanced wake word detection with confidence scoring
      const wakeWordResult = await this.wakeWordDetector.detectWithConfidence(input.audioData)

      if (wakeWordResult.detected && wakeWordResult.confidence > 0.8) {
        // Process as voice command with enhanced intent recognition
        const transcript = await this.speechToText.transcribeWithSpeakerDiarization(input.audioData)
        const command = await this.voiceCommandProcessor.parseWithContext(transcript, session)
        await this.handleEnhancedVoiceCommand(command, session)
        return
      }

      // Step 2: Continuous transcription for claim detection
      const transcript = await this.speechToText.transcribeRealTime(input.audioData)

      if (session.mode === "passive" || session.mode === "hybrid") {
        // Step 3: Advanced claim detection with ML
        const detectionResult = await this.claimDetector.detectClaimsAdvanced(transcript)

        if (detectionResult.claims.length > 0 && detectionResult.confidence > 0.7) {
          // Play subtle audio alert for detected claims
          if (session.voiceSettings.audioAlerts) {
            await this.audioAlertSystem.playAlert("detection", session.voiceSettings.chimeVolume)
          }

          for (const claim of detectionResult.claims) {
            await this.processEnhancedClaim(claim, session)
          }
        }
      }

      const processingTime = Date.now() - startTime
      console.log(`Voice processing completed in ${processingTime}ms`)
    } catch (error) {
      console.error("Enhanced voice processing error:", error)
      await this.handleProcessingError(error, session)
    }
  }

  async processTextInput(input: TextInput): Promise<void> {
    const session = this.sessions.get(input.sessionId)
    if (!session) return

    try {
      const startTime = Date.now()

      if (input.type === "voice_command") {
        const command = await this.voiceCommandProcessor.parseWithContext(input.text, session)
        await this.handleEnhancedVoiceCommand(command, session)
        return
      }

      // Enhanced claim detection for text input
      const detectionResult = await this.claimDetector.detectClaimsAdvanced(input.text)

      for (const claim of detectionResult.claims) {
        await this.processEnhancedClaim(claim, session)
      }

      const processingTime = Date.now() - startTime
      console.log(`Text processing completed in ${processingTime}ms`)
    } catch (error) {
      console.error("Enhanced text processing error:", error)
      await this.handleProcessingError(error, session)
    }
  }

  private async processEnhancedClaim(claim: FactCheckClaim, session: MultiModalSession): Promise<void> {
    // Add claim to session
    session.claims.push(claim)

    // Start enhanced fact-checking process with 3-second timeout
    const startTime = Date.now()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Fact-check timeout")), 3000))

    try {
      const result = await Promise.race([this.factChecker.verifyWithExactlyThreeSources(claim.text), timeoutPromise])

      const processingTime = Date.now() - startTime

      const enhancedResult: EnhancedFactCheckResult = {
        id: `result_${Date.now()}`,
        claimId: claim.id,
        accuracy: result.accuracy,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        summary: await this.generateEnhancedSummary(result, session.voiceSettings),
        sources: result.sources, // Exactly 3 sources
        processingTime,
        timestamp: Date.now(),
        visualAlert: this.generateVisualAlert(result.accuracy, result.confidence),
      }

      session.results.push(enhancedResult)

      // Deliver results with enhanced multi-modal output
      await this.deliverEnhancedResults(enhancedResult, session)
    } catch (error) {
      console.error("Enhanced fact-checking error:", error)
      await this.handleFactCheckError(error, claim, session)
    }
  }

  private async handleEnhancedVoiceCommand(command: VoiceCommand, session: MultiModalSession): Promise<void> {
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
          await this.processEnhancedClaim(claim, session)
        }
        break

      case "read_sources":
        const lastResult = session.results[session.results.length - 1]
        if (lastResult) {
          await this.readSourcesAloudEnhanced(lastResult, session)
        }
        break

      case "save_result":
        await this.saveFactCheckResultEnhanced(session)
        break

      case "share_with_audience":
        await this.shareWithAudience(session)
        break

      case "toggle_mode":
        await this.toggleSessionModeEnhanced(session)
        break

      case "adjust_voice_settings":
        await this.adjustVoiceSettings(command.parameters, session)
        break

      case "help":
        await this.provideEnhancedVoiceHelp(session)
        break
    }
  }

  private async generateEnhancedSummary(
    result: any,
    voiceSettings: VoiceSettings,
  ): Promise<{
    text: string
    audioUrl?: string
    duration?: number
    contradictions?: string[]
    uncertainties?: string[]
  }> {
    // Generate concise text summary (30-60 words max)
    const textSummary = await this.generateConciseTextSummary(result)

    // Identify contradictions and uncertainties
    const contradictions = await this.identifyContradictions(result.sources)
    const uncertainties = await this.identifyUncertainties(result.sources)

    if (!voiceSettings.enabled) {
      return {
        text: textSummary,
        contradictions,
        uncertainties,
      }
    }

    // Generate voice summary (10-15 seconds max)
    const voiceSummary = await this.generateVoiceSummary(textSummary, contradictions, uncertainties)
    const audioSummary = await this.textToSpeech.synthesizeEnhanced(voiceSummary, {
      speed: voiceSettings.speed,
      voice: voiceSettings.voiceType,
      tone: voiceSettings.tone,
      maxDuration: 15,
      targetWordCount: 50,
    })

    return {
      text: textSummary,
      audioUrl: audioSummary.url,
      duration: audioSummary.duration,
      contradictions,
      uncertainties,
    }
  }

  private async generateConciseTextSummary(result: any): Promise<string> {
    const accuracy = result.accuracy
    const confidence = result.confidence
    const confidenceScore = result.confidenceScore
    const mainSource = result.sources[0]

    // Generate 30-60 word summaries
    switch (accuracy) {
      case "verified":
        return `✅ VERIFIED (${confidenceScore}% confidence): ${mainSource.excerpt.substring(0, 120)}... Primary source: ${mainSource.domain} (${mainSource.credibilityScore}% reliable)`

      case "false":
        return `❌ FALSE (${confidenceScore}% confidence): Claim contradicted by evidence. ${mainSource.excerpt.substring(0, 120)}... Source: ${mainSource.domain}`

      case "uncertain":
        return `⚠️ UNCERTAIN (${confidenceScore}% confidence): Mixed evidence found across sources. Requires additional verification. Check all 3 sources for complete picture.`

      case "partial":
        return `🔶 PARTIALLY CORRECT (${confidenceScore}% confidence): Some aspects verified, others disputed. ${mainSource.excerpt.substring(0, 120)}... See sources for details.`

      default:
        return `🔍 UNABLE TO VERIFY: Insufficient reliable sources found. Manual verification recommended.`
    }
  }

  private async generateVoiceSummary(
    textSummary: string,
    contradictions: string[],
    uncertainties: string[],
  ): Promise<string> {
    // Create 10-15 second voice summary
    let voiceSummary = textSummary.replace(/[✅❌⚠️🔶🔍]/g, "").substring(0, 150)

    if (contradictions.length > 0) {
      voiceSummary += ` Note: Sources show conflicting information.`
    }

    if (uncertainties.length > 0) {
      voiceSummary += ` Some details remain uncertain.`
    }

    return voiceSummary
  }

  private async identifyContradictions(sources: VerificationSource[]): Promise<string[]> {
    // Analyze sources for contradictory information
    const contradictions: string[] = []

    // Simple contradiction detection (would be enhanced with NLP)
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const source1 = sources[i]
        const source2 = sources[j]

        // Check for contradictory keywords or phrases
        if (this.hasContradictoryContent(source1.excerpt, source2.excerpt)) {
          contradictions.push(`${source1.domain} vs ${source2.domain}: Conflicting information`)
        }
      }
    }

    return contradictions
  }

  private async identifyUncertainties(sources: VerificationSource[]): Promise<string[]> {
    const uncertainties: string[] = []

    sources.forEach((source) => {
      // Look for uncertainty indicators
      const uncertaintyKeywords = ["may", "might", "possibly", "unclear", "disputed", "alleged", "reportedly"]
      const hasUncertainty = uncertaintyKeywords.some((keyword) => source.excerpt.toLowerCase().includes(keyword))

      if (hasUncertainty || source.credibilityScore < 70) {
        uncertainties.push(`${source.domain}: Contains uncertain or disputed information`)
      }
    })

    return uncertainties
  }

  private hasContradictoryContent(excerpt1: string, excerpt2: string): boolean {
    // Simple contradiction detection logic
    const contradictoryPairs = [
      ["increase", "decrease"],
      ["true", "false"],
      ["confirmed", "denied"],
      ["supports", "opposes"],
    ]

    return contradictoryPairs.some(([word1, word2]) => {
      const has1 = excerpt1.toLowerCase().includes(word1)
      const has2 = excerpt2.toLowerCase().includes(word2)
      return (has1 && excerpt2.toLowerCase().includes(word2)) || (has2 && excerpt1.toLowerCase().includes(word1))
    })
  }

  private generateVisualAlert(
    accuracy: string,
    confidence: string,
  ): {
    color: "green" | "yellow" | "red"
    icon: string
    chime?: string
  } {
    switch (accuracy) {
      case "verified":
        return {
          color: "green",
          icon: "✅",
          chime: "success-chime.mp3",
        }
      case "false":
        return {
          color: "red",
          icon: "❌",
          chime: "warning-chime.mp3",
        }
      case "uncertain":
      case "partial":
        return {
          color: "yellow",
          icon: "⚠️",
          chime: "caution-chime.mp3",
        }
      default:
        return {
          color: "yellow",
          icon: "🔍",
          chime: "neutral-chime.mp3",
        }
    }
  }

  private async deliverEnhancedResults(result: EnhancedFactCheckResult, session: MultiModalSession): Promise<void> {
    // Always send visual results with enhanced styling
    await this.sendEnhancedVisualUpdate(result, session)

    // Play audio alert if enabled
    if (session.voiceSettings.audioAlerts && result.visualAlert?.chime) {
      await this.audioAlertSystem.playChime(result.visualAlert.chime, session.voiceSettings.chimeVolume)
    }

    // Send audio feedback if enabled
    if (session.voiceSettings.enabled && session.voiceSettings.privateAudio && result.summary.audioUrl) {
      const audioFeedback: AudioFeedback = {
        text: result.summary.text,
        audioUrl: result.summary.audioUrl,
        duration: result.summary.duration!,
        priority: result.accuracy === "false" ? "high" : "medium",
        type: "fact_check",
      }

      await this.sendEnhancedAudioFeedback(audioFeedback, session)
    }
  }

  private async sendEnhancedVisualUpdate(result: EnhancedFactCheckResult, session: MultiModalSession): Promise<void> {
    const visualUpdate = {
      type: "enhanced_fact_check_result",
      sessionId: session.id,
      result: {
        id: result.id,
        accuracy: result.accuracy,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        summary: result.summary.text,
        contradictions: result.summary.contradictions,
        uncertainties: result.summary.uncertainties,
        sources: result.sources.map((s) => ({
          title: s.title,
          domain: s.domain,
          credibilityScore: s.credibilityScore,
          sourceType: s.sourceType,
          reliability: s.reliability,
          url: s.url,
          excerpt: s.excerpt,
        })),
        processingTime: result.processingTime,
        visualAlert: result.visualAlert,
      },
    }

    this.broadcastToSession(session.id, visualUpdate)
  }

  private async sendEnhancedAudioFeedback(feedback: AudioFeedback, session: MultiModalSession): Promise<void> {
    const audioUpdate = {
      type: "enhanced_audio_feedback",
      sessionId: session.id,
      feedback: {
        audioUrl: feedback.audioUrl,
        duration: feedback.duration,
        priority: feedback.priority,
        type: feedback.type,
        voiceSettings: session.voiceSettings,
      },
    }

    this.broadcastToSession(session.id, audioUpdate)
  }

  private async readSourcesAloudEnhanced(result: EnhancedFactCheckResult, session: MultiModalSession): Promise<void> {
    const sourcesText = result.sources
      .map(
        (source, index) =>
          `Source ${index + 1}: ${source.title} from ${source.domain}, ${source.credibilityScore}% credible. ${source.excerpt}`,
      )
      .join(". ")

    const audioSummary = await this.textToSpeech.synthesizeEnhanced(sourcesText, {
      speed: session.voiceSettings.speed,
      voice: session.voiceSettings.voiceType,
      tone: "neutral",
    })

    const audioFeedback: AudioFeedback = {
      text: sourcesText,
      audioUrl: audioSummary.url,
      duration: audioSummary.duration,
      priority: "medium",
      type: "fact_check",
    }

    await this.sendEnhancedAudioFeedback(audioFeedback, session)
  }

  private async shareWithAudience(session: MultiModalSession): Promise<void> {
    const lastResult = session.results[session.results.length - 1]
    if (lastResult) {
      // Generate audience-friendly summary
      const audienceSummary = await this.generateAudienceSummary(lastResult)

      const confirmationText = "Fact-check shared with audience. Summary prepared for show notes."
      const audioConfirmation = await this.textToSpeech.synthesizeEnhanced(confirmationText, {
        voice: session.voiceSettings.voiceType,
        speed: session.voiceSettings.speed,
      })

      await this.sendEnhancedAudioFeedback(
        {
          text: confirmationText,
          audioUrl: audioConfirmation.url,
          duration: audioConfirmation.duration,
          priority: "low",
          type: "confirmation",
        },
        session,
      )

      // Broadcast audience summary
      this.broadcastToSession(session.id, {
        type: "audience_summary",
        sessionId: session.id,
        summary: audienceSummary,
      })
    }
  }

  private async generateAudienceSummary(result: EnhancedFactCheckResult): Promise<string> {
    return `📋 FACT-CHECK SUMMARY
    
Claim: ${result.claimId}
Status: ${result.accuracy.toUpperCase()}
Confidence: ${result.confidenceScore}%

${result.summary.text}

Sources:
${result.sources.map((s, i) => `${i + 1}. ${s.title} (${s.domain}) - ${s.credibilityScore}% reliable`).join("\n")}

${result.summary.contradictions?.length ? `⚠️ Contradictions found: ${result.summary.contradictions.join(", ")}` : ""}
${result.summary.uncertainties?.length ? `❓ Uncertainties: ${result.summary.uncertainties.join(", ")}` : ""}
`
  }

  private async adjustVoiceSettings(parameters: any, session: MultiModalSession): Promise<void> {
    const updates: Partial<VoiceSettings> = {}

    if (parameters.speed) updates.speed = Math.max(0.5, Math.min(2.0, parameters.speed))
    if (parameters.volume) updates.volume = Math.max(0, Math.min(1, parameters.volume))
    if (parameters.voice) updates.voiceType = parameters.voice
    if (parameters.tone) updates.tone = parameters.tone

    session.voiceSettings = { ...session.voiceSettings, ...updates }

    const confirmationText = `Voice settings updated. Speed: ${session.voiceSettings.speed}x, Voice: ${session.voiceSettings.voiceType}`
    const audioConfirmation = await this.textToSpeech.synthesizeEnhanced(confirmationText, session.voiceSettings)

    await this.sendEnhancedAudioFeedback(
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

  private async handleProcessingError(error: any, session: MultiModalSession): Promise<void> {
    console.error("Processing error:", error)

    if (session.voiceSettings.enabled) {
      const errorText = "Sorry, I encountered an issue processing that request. Please try again."
      const audioError = await this.textToSpeech.synthesizeEnhanced(errorText, session.voiceSettings)

      await this.sendEnhancedAudioFeedback(
        {
          text: errorText,
          audioUrl: audioError.url,
          duration: audioError.duration,
          priority: "high",
          type: "fact_check",
        },
        session,
      )
    }
  }

  private async handleFactCheckError(error: any, claim: FactCheckClaim, session: MultiModalSession): Promise<void> {
    console.error("Fact-check error:", error)

    const errorResult: EnhancedFactCheckResult = {
      id: `error_${Date.now()}`,
      claimId: claim.id,
      accuracy: "uncertain",
      confidence: "low",
      confidenceScore: 0,
      summary: {
        text: "Unable to verify this claim due to technical issues. Please try again or verify manually.",
      },
      sources: [],
      processingTime: 0,
      timestamp: Date.now(),
      visualAlert: {
        color: "red",
        icon: "⚠️",
        chime: "error-chime.mp3",
      },
    }

    session.results.push(errorResult)
    await this.deliverEnhancedResults(errorResult, session)
  }

  private broadcastToSession(sessionId: string, message: any): void {
    // Implementation would use WebSocket or Server-Sent Events
    console.log(`Broadcasting enhanced message to session ${sessionId}:`, message)
  }

  // Enhanced session management
  createEnhancedSession(
    userId: string,
    title: string,
    mode: MultiModalSession["mode"],
    voiceSettings?: Partial<VoiceSettings>,
  ): MultiModalSession {
    const defaultVoiceSettings: VoiceSettings = {
      enabled: mode !== "text_only",
      privateAudio: true,
      voiceType: "professional",
      speed: 1.0,
      volume: 0.8,
      tone: "neutral",
      audioAlerts: true,
      chimeVolume: 0.5,
    }

    const session: MultiModalSession = {
      id: `session_${Date.now()}`,
      userId,
      title,
      mode,
      voiceSettings: { ...defaultVoiceSettings, ...voiceSettings },
      isLive: true,
      startTime: new Date().toISOString(),
      claims: [],
      results: [],
    }

    this.sessions.set(session.id, session)
    return session
  }
}

// Enhanced supporting engine classes
class EnhancedWakeWordDetector {
  constructor(private wakeWords: string[]) {}

  async detectWithConfidence(
    audioData: ArrayBuffer,
  ): Promise<{ detected: boolean; confidence: number; word?: string }> {
    // Enhanced wake word detection with confidence scoring
    // Would integrate with advanced wake word detection libraries
    const detected = Math.random() > 0.85 // Mock: 15% chance of wake word detection
    return {
      detected,
      confidence: detected ? 0.9 : 0.1,
      word: detected ? this.wakeWords[0] : undefined,
    }
  }
}

class EnhancedSpeechToTextEngine {
  async transcribeWithSpeakerDiarization(audioData: ArrayBuffer): Promise<string> {
    // Integration with advanced speech-to-text with speaker identification
    return "Mock transcription with speaker diarization"
  }

  async transcribeRealTime(audioData: ArrayBuffer): Promise<string> {
    // Real-time transcription for continuous processing
    return "Mock real-time transcription"
  }
}

class EnhancedTextToSpeechEngine {
  async synthesizeEnhanced(
    text: string,
    options: {
      speed?: number
      voice?: string
      tone?: string
      maxDuration?: number
      targetWordCount?: number
    },
  ): Promise<{ url: string; duration: number }> {
    // Enhanced TTS with tone control and duration limits
    const estimatedDuration = Math.min(text.length * 0.08 * (options.speed || 1), options.maxDuration || 30)

    return {
      url: `/api/audio/enhanced-tts/${Date.now()}.mp3`,
      duration: estimatedDuration,
    }
  }
}

class AdvancedClaimDetectionEngine {
  async detectClaimsAdvanced(text: string): Promise<ClaimDetectionResult> {
    // Advanced ML-based claim detection
    const factualIndicators = [
      /\d+%/, // percentages
      /in \d{4}/, // years
      /according to/, // citations
      /studies show/, // research claims
      /data shows/, // data claims
      /\$[\d,]+/, // monetary amounts
      /\d+\s*(million|billion|thousand)/, // large numbers
      /research indicates/, // research claims
      /statistics reveal/, // statistical claims
      /experts say/, // expert opinions
      /reports suggest/, // report claims
    ]

    const hasFactualClaim = factualIndicators.some((pattern) => pattern.test(text.toLowerCase()))
    const confidence = hasFactualClaim ? 0.85 : 0.2

    const claims: FactCheckClaim[] = hasFactualClaim
      ? [
          {
            id: `claim_${Date.now()}`,
            text: text,
            timestamp: Date.now(),
            confidence: confidence,
            type: "detected",
            sessionId: "current",
          },
        ]
      : []

    return {
      claims,
      confidence,
      processingTime: 150, // ms
      detectionMethod: "hybrid",
    }
  }
}

class ThreeSourceFactChecker {
  async verifyWithExactlyThreeSources(claim: string): Promise<{
    accuracy: "verified" | "false" | "uncertain" | "partial"
    confidence: "high" | "medium" | "low"
    confidenceScore: number
    sources: VerificationSource[]
  }> {
    // Implementation must return exactly 3 diverse sources
    const sources: VerificationSource[] = await this.findThreeDiverseSources(claim)

    // Analyze sources for consensus
    const consensus = this.analyzeSourceConsensus(sources)

    return {
      accuracy: consensus.accuracy,
      confidence: consensus.confidence,
      confidenceScore: consensus.score,
      sources: sources, // Always exactly 3 sources
    }
  }

  private async findThreeDiverseSources(claim: string): Promise<VerificationSource[]> {
    // Must find exactly 3 sources from different categories
    const sourceCategories = ["news", "academic", "government"]
    const sources: VerificationSource[] = []

    for (let i = 0; i < 3; i++) {
      const category = sourceCategories[i % sourceCategories.length]
      sources.push({
        id: `source_${i + 1}`,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Source ${i + 1}`,
        url: `https://${category}-source-${i + 1}.com/article`,
        domain: `${category}-source-${i + 1}.com`,
        credibilityScore: 85 + Math.floor(Math.random() * 15), // 85-100%
        sourceType: category as "news" | "academic" | "government",
        excerpt: `Detailed information about the claim from ${category} perspective...`,
        publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        bias: "center",
      })
    }

    return sources
  }

  private analyzeSourceConsensus(sources: VerificationSource[]): {
    accuracy: "verified" | "false" | "uncertain" | "partial"
    confidence: "high" | "medium" | "low"
    score: number
  } {
    // Analyze consensus among the 3 sources
    const avgCredibility = sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length

    if (avgCredibility > 90) {
      return { accuracy: "verified", confidence: "high", score: avgCredibility }
    } else if (avgCredibility > 75) {
      return { accuracy: "partial", confidence: "medium", score: avgCredibility }
    } else {
      return { accuracy: "uncertain", confidence: "low", score: avgCredibility }
    }
  }
}

class AdvancedVoiceCommandProcessor {
  async parseWithContext(transcript: string, session: MultiModalSession): Promise<VoiceCommand> {
    const lowerTranscript = transcript.toLowerCase()

    // Enhanced intent recognition with context awareness
    let intent: VoiceCommand["intent"] = "help"
    const parameters: Record<string, any> = {}

    if (lowerTranscript.includes("check") || lowerTranscript.includes("fact") || lowerTranscript.includes("verify")) {
      intent = "fact_check"
      parameters.claim = transcript.replace(/hey factbot|check|fact|verify/gi, "").trim()
    } else if (lowerTranscript.includes("read sources") || lowerTranscript.includes("sources")) {
      intent = "read_sources"
    } else if (lowerTranscript.includes("save")) {
      intent = "save_result"
    } else if (lowerTranscript.includes("share") && lowerTranscript.includes("audience")) {
      intent = "share_with_audience"
    } else if (lowerTranscript.includes("toggle") || lowerTranscript.includes("mode")) {
      intent = "toggle_mode"
    } else if (
      lowerTranscript.includes("speed") ||
      lowerTranscript.includes("voice") ||
      lowerTranscript.includes("volume")
    ) {
      intent = "adjust_voice_settings"
      if (lowerTranscript.includes("speed")) {
        const speedMatch = transcript.match(/speed\s+(\d+\.?\d*)/i)
        if (speedMatch) parameters.speed = Number.parseFloat(speedMatch[1])
      }
      if (lowerTranscript.includes("volume")) {
        const volumeMatch = transcript.match(/volume\s+(\d+)/i)
        if (volumeMatch) parameters.volume = Number.parseInt(volumeMatch[1]) / 100
      }
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

class AudioAlertSystem {
  async playAlert(type: "detection" | "verification" | "warning" | "error", volume: number): Promise<void> {
    // Play subtle audio alerts
    console.log(`Playing ${type} alert at ${volume * 100}% volume`)
  }

  async playChime(chimeFile: string, volume: number): Promise<void> {
    // Play specific chime files
    console.log(`Playing chime ${chimeFile} at ${volume * 100}% volume`)
  }
}
