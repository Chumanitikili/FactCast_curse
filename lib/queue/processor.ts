import Bull from "bull"
import { executeQuery, executeTransaction } from "../database/connection"
import type { PoolClient } from "pg"

// Queue configurations
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
}

// Create queues
export const audioProcessingQueue = new Bull("audio-processing", queueConfig)
export const factCheckingQueue = new Bull("fact-checking", queueConfig)
export const emailQueue = new Bull("email", queueConfig)
export const analyticsQueue = new Bull("analytics", queueConfig)

// Audio processing job types
interface AudioProcessingJob {
  podcastId: string
  userId: string
  audioUrl: string
  settings: {
    autoFactCheck: boolean
    confidenceThreshold: number
    sourceTypes: string[]
  }
}

interface FactCheckingJob {
  sessionId?: string
  podcastId?: string
  segmentId?: string
  claim: string
  timestamp: number
  settings: {
    maxSourcesPerCheck: number
    sourceTypes: string[]
    confidenceThreshold: number
  }
}

interface EmailJob {
  to: string
  template: string
  data: Record<string, any>
  priority?: number
}

interface AnalyticsJob {
  event: string
  userId?: string
  properties: Record<string, any>
  timestamp: number
}

// Audio processing worker
audioProcessingQueue.process("transcribe-audio", 5, async (job) => {
  const { podcastId, userId, audioUrl, settings } = job.data as AudioProcessingJob

  try {
    // Update status to processing
    await executeQuery("UPDATE podcasts SET status = $1, processing_started_at = CURRENT_TIMESTAMP WHERE id = $2", [
      "processing",
      podcastId,
    ])

    job.progress(10)

    // Step 1: Transcribe audio
    const transcript = await transcribeAudio(audioUrl)
    job.progress(40)

    // Step 2: Save transcript segments
    const segments = await saveTranscriptSegments(podcastId, transcript)
    job.progress(60)

    // Step 3: Auto fact-check if enabled
    if (settings.autoFactCheck) {
      for (const segment of segments) {
        if (containsFactualClaim(segment.text)) {
          await factCheckingQueue.add(
            "verify-claim",
            {
              podcastId,
              segmentId: segment.id,
              claim: segment.text,
              timestamp: segment.timestamp_ms,
              settings,
            },
            {
              priority: 5,
              delay: 1000, // Stagger fact-checking jobs
            },
          )
        }
      }
    }

    job.progress(90)

    // Update status to completed
    await executeQuery("UPDATE podcasts SET status = $1, processing_completed_at = CURRENT_TIMESTAMP WHERE id = $2", [
      "completed",
      podcastId,
    ])

    job.progress(100)

    // Send completion email
    await emailQueue.add("processing-complete", {
      to: await getUserEmail(userId),
      template: "processing-complete",
      data: { podcastId },
    })

    return { success: true, segmentCount: segments.length }
  } catch (error) {
    console.error("Audio processing failed:", error)

    await executeQuery("UPDATE podcasts SET status = $1, error_message = $2 WHERE id = $3", [
      "failed",
      error.message,
      podcastId,
    ])

    throw error
  }
})

// Fact-checking worker
factCheckingQueue.process("verify-claim", 10, async (job) => {
  const { sessionId, podcastId, segmentId, claim, timestamp, settings } = job.data as FactCheckingJob

  try {
    job.progress(10)

    // Step 1: Extract entities and keywords
    const entities = await extractEntities(claim)
    job.progress(20)

    // Step 2: Search multiple sources
    const sources = await searchMultipleSources(claim, entities, settings.sourceTypes)
    job.progress(50)

    // Step 3: Ensure source diversity
    const diverseSources = ensureSourceDiversity(sources, settings.maxSourcesPerCheck)
    job.progress(60)

    // Step 4: Generate perspectives
    const perspectives = await generatePerspectives(claim, diverseSources)
    job.progress(80)

    // Step 5: Calculate verdict and confidence
    const { verdict, confidence } = calculateVerdict(perspectives)
    job.progress(90)

    // Step 6: Generate AI summary
    const aiSummary = await generateAISummary(claim, perspectives)

    // Step 7: Save results
    const factCheckId = await saveFactCheckResult({
      sessionId,
      podcastId,
      segmentId,
      claim,
      verdict,
      confidence,
      aiSummary,
      isflagged: confidence < settings.confidenceThreshold,
      sources: diverseSources,
      perspectives,
    })

    job.progress(100)

    return { success: true, factCheckId, verdict, confidence }
  } catch (error) {
    console.error("Fact-checking failed:", error)
    throw error
  }
})

// Email worker
emailQueue.process("processing-complete", 3, async (job) => {
  const { to, template, data } = job.data as EmailJob

  try {
    await sendEmail(to, template, data)
    return { success: true }
  } catch (error) {
    console.error("Email sending failed:", error)
    throw error
  }
})

// Analytics worker
analyticsQueue.process("track-event", 20, async (job) => {
  const { event, userId, properties, timestamp } = job.data as AnalyticsJob

  try {
    await executeQuery(
      "INSERT INTO analytics_events (event_name, user_id, properties, timestamp) VALUES ($1, $2, $3, $4)",
      [event, userId, JSON.stringify(properties), new Date(timestamp)],
    )

    return { success: true }
  } catch (error) {
    console.error("Analytics tracking failed:", error)
    throw error
  }
})

// Helper functions
async function transcribeAudio(audioUrl: string): Promise<any[]> {
  // Integration with speech-to-text service (e.g., OpenAI Whisper, Google Speech-to-Text)
  // This is a mock implementation

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    body: new FormData(), // Add audio file here
  })

  if (!response.ok) {
    throw new Error("Transcription failed")
  }

  const result = await response.json()

  // Parse transcript into segments with timestamps
  return parseTranscriptSegments(result.text)
}

async function saveTranscriptSegments(podcastId: string, transcript: any[]): Promise<any[]> {
  return executeTransaction(async (client: PoolClient) => {
    const segments = []

    for (const segment of transcript) {
      const result = await client.query(
        "INSERT INTO transcript_segments (podcast_id, timestamp_ms, text, confidence) VALUES ($1, $2, $3, $4) RETURNING *",
        [podcastId, segment.timestamp, segment.text, segment.confidence],
      )
      segments.push(result.rows[0])
    }

    return segments
  })
}

function containsFactualClaim(text: string): boolean {
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

async function extractEntities(text: string): Promise<string[]> {
  // Use NLP service to extract entities
  // Mock implementation
  return []
}

async function searchMultipleSources(claim: string, entities: string[], sourceTypes: string[]): Promise<any[]> {
  // Search across multiple source types
  // Mock implementation
  return []
}

function ensureSourceDiversity(sources: any[], maxSources: number): any[] {
  // Ensure political and source type diversity
  // Mock implementation
  return sources.slice(0, maxSources)
}

async function generatePerspectives(claim: string, sources: any[]): Promise<any[]> {
  // Generate perspectives from sources
  // Mock implementation
  return []
}

function calculateVerdict(perspectives: any[]): { verdict: string; confidence: number } {
  // Calculate verdict based on perspectives
  // Mock implementation
  return { verdict: "verified", confidence: 85 }
}

async function generateAISummary(claim: string, perspectives: any[]): Promise<string> {
  // Generate AI summary using LLM
  // Mock implementation
  return "AI-generated summary"
}

async function saveFactCheckResult(data: any): Promise<string> {
  return executeTransaction(async (client: PoolClient) => {
    // Save fact check result
    const factCheckResult = await client.query(
      "INSERT INTO fact_check_results (session_id, podcast_id, segment_id, claim, verdict, confidence, ai_summary, is_flagged) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        data.sessionId,
        data.podcastId,
        data.segmentId,
        data.claim,
        data.verdict,
        data.confidence,
        data.aiSummary,
        data.isFragged,
      ],
    )

    const factCheckId = factCheckResult.rows[0].id

    // Save sources and perspectives
    for (const source of data.sources) {
      await client.query(
        "INSERT INTO sources (title, url, domain, source_type, political_lean, reliability_score) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (url) DO NOTHING",
        [source.title, source.url, source.domain, source.sourceType, source.politicalLean, source.reliability],
      )
    }

    for (const perspective of data.perspectives) {
      await client.query(
        "INSERT INTO perspectives (fact_check_id, source_id, stance, explanation, relevance_score, excerpt) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          factCheckId,
          perspective.sourceId,
          perspective.stance,
          perspective.explanation,
          perspective.relevanceScore,
          perspective.excerpt,
        ],
      )
    }

    return factCheckId
  })
}

async function sendEmail(to: string, template: string, data: any): Promise<void> {
  // Integration with email service (e.g., SendGrid, AWS SES)
  // Mock implementation
  console.log(`Sending email to ${to} with template ${template}`)
}

async function getUserEmail(userId: string): Promise<string> {
  const users = await executeQuery("SELECT email FROM users WHERE id = $1", [userId])
  return users[0]?.email || ""
}

function parseTranscriptSegments(text: string): any[] {
  // Parse transcript text into segments with timestamps
  // Mock implementation
  return [
    { timestamp: 0, text: text.substring(0, 100), confidence: 0.95 },
    { timestamp: 5000, text: text.substring(100, 200), confidence: 0.92 },
  ]
}

// Queue monitoring and health checks
export async function getQueueStats() {
  const stats = await Promise.all([
    audioProcessingQueue.getJobCounts(),
    factCheckingQueue.getJobCounts(),
    emailQueue.getJobCounts(),
    analyticsQueue.getJobCounts(),
  ])

  return {
    audioProcessing: stats[0],
    factChecking: stats[1],
    email: stats[2],
    analytics: stats[3],
  }
}

// Graceful shutdown
export async function closeQueues(): Promise<void> {
  await Promise.all([
    audioProcessingQueue.close(),
    factCheckingQueue.close(),
    emailQueue.close(),
    analyticsQueue.close(),
  ])
}
