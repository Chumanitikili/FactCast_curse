export interface VoiceInput {
  audioData: ArrayBuffer
  timestamp: number
  sessionId: string
  speakerId?: string
}

export interface TextInput {
  text: string
  timestamp: number
  sessionId: string
  userId: string
  type: "manual" | "voice_command" | "auto_detected"
}

export interface FactCheckClaim {
  id: string
  text: string
  timestamp: number
  confidence: number
  type: "detected" | "manual" | "voice_command"
  sessionId: string
}

export interface FactCheckResult {
  id: string
  claimId: string
  accuracy: "verified" | "false" | "uncertain" | "partial"
  confidence: "high" | "medium" | "low"
  summary: {
    text: string
    audioUrl?: string
    duration?: number
  }
  sources: VerificationSource[]
  processingTime: number
  timestamp: number
}

export interface EnhancedFactCheckResult {
  id: string
  claimId: string
  accuracy: "verified" | "false" | "uncertain" | "partial"
  confidence: "high" | "medium" | "low"
  confidenceScore: number // 0-100
  summary: {
    text: string // 30-60 words max
    audioUrl?: string
    duration?: number // 10-15 seconds max
    contradictions?: string[]
    uncertainties?: string[]
  }
  sources: VerificationSource[] // Exactly 3 sources required
  processingTime: number
  timestamp: number
  visualAlert?: {
    color: "green" | "yellow" | "red"
    icon: string
    chime?: string
  }
}

export interface VerificationSource {
  id: string
  title: string
  url: string
  domain: string
  credibilityScore: number // 0-100
  sourceType: "news" | "academic" | "government" | "expert" | "database"
  excerpt: string
  publishDate?: string
  reliability: "high" | "medium" | "low"
  bias?: "left" | "center" | "right" | "unknown"
}

export interface VoiceCommand {
  command: string
  intent: "fact_check" | "read_sources" | "save_result" | "toggle_mode" | "help"
  parameters: Record<string, any>
  confidence: number
  timestamp: number
}

export interface VoiceSettings {
  enabled: boolean
  privateAudio: boolean
  voiceType: "professional" | "casual" | "authoritative" | "friendly"
  speed: number // 0.5-2.0
  volume: number // 0-1
  tone: "neutral" | "encouraging" | "cautious" | "confident"
  audioAlerts: boolean
  chimeVolume: number
}

export interface MultiModalSession {
  id: string
  userId: string
  title: string
  mode: "voice_only" | "text_only" | "hybrid" | "passive"
  voiceSettings: VoiceSettings
  isLive: boolean
  startTime: string
  claims: FactCheckClaim[]
  results: FactCheckResult[]
}

export interface AudioFeedback {
  text: string
  audioUrl: string
  duration: number
  priority: "low" | "medium" | "high"
  type: "fact_check" | "alert" | "confirmation"
}

export interface ClaimDetectionResult {
  claims: FactCheckClaim[]
  confidence: number
  processingTime: number
  detectionMethod: "keyword" | "nlp" | "ml" | "hybrid"
}

export interface AudioAlert {
  type: "verification" | "warning" | "error" | "success"
  sound: "chime" | "beep" | "tone" | "voice"
  volume: number
  duration: number
}
