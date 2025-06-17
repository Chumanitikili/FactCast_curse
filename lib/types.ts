export interface User {
  id: string
  email: string
  name: string
  plan: "free" | "creator" | "professional"
  createdAt: string
  monthlyUsage: number // in minutes
}

export interface Podcast {
  id: string
  userId: string
  title: string
  description?: string
  audioUrl: string
  duration: number // in seconds
  status: "uploading" | "processing" | "completed" | "failed"
  createdAt: string
  updatedAt: string
}

export interface FactCheckResult {
  id: string
  podcastId: string
  timestamp: number // in seconds
  claim: string
  verdict: "true" | "false" | "unverified" | "misleading"
  confidence: number // 0-100
  sources: Source[]
  explanation: string
}

export interface Source {
  id: string
  title: string
  url: string
  domain: string
  reliability: number // 0-100
}

export interface ProcessingStatus {
  podcastId: string
  status: "uploading" | "transcribing" | "analyzing" | "fact-checking" | "completed" | "failed"
  progress: number // 0-100
  currentStep: string
  error?: string
}
