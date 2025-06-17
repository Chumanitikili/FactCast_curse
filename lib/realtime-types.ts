export interface LiveSession {
  id: string
  userId: string
  title: string
  status: "active" | "paused" | "stopped"
  startTime: string
  transcript: TranscriptSegment[]
  factChecks: LiveFactCheck[]
  settings: SessionSettings
}

export interface TranscriptSegment {
  id: string
  timestamp: number
  speaker?: string
  text: string
  confidence: number
  isProcessed: boolean
}

export interface LiveFactCheck {
  id: string
  segmentId: string
  claim: string
  timestamp: number
  status: "processing" | "completed" | "failed"
  confidence: number
  verdict: "verified" | "disputed" | "unverified" | "mixed"
  sources: VerificationSource[]
  perspectives: Perspective[]
  aiSummary?: string
  flagged: boolean
  userCorrection?: string
}

export interface VerificationSource {
  id: string
  title: string
  url: string
  domain: string
  publishDate?: string
  reliability: number
  politicalLean: "left" | "center" | "right" | "unknown"
  sourceType: "news" | "academic" | "government" | "blog" | "social" | "other"
  excerpt: string
}

export interface Perspective {
  id: string
  sourceId: string
  stance: "supports" | "disputes" | "neutral"
  explanation: string
  relevanceScore: number
}

export interface SessionSettings {
  autoFactCheck: boolean
  voiceActivation: boolean
  hotkey: string
  confidenceThreshold: number
  sourceTypes: string[]
  maxSourcesPerCheck: number
  voiceOutput: boolean
  realTimeTranscript: boolean
}

export interface VoiceCommand {
  type: "fact_check" | "pause" | "resume" | "correct" | "skip"
  text?: string
  timestamp: number
}
