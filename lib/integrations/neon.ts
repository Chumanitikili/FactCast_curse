import { neon } from "@neondatabase/serverless"

// Neon database configuration
const databaseUrl =
  process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://user:password@host/database"

// Create Neon SQL client
export const sql = neon(databaseUrl)

// Neon database operations
export const neonDb = {
  // User operations
  users: {
    async create(userData: {
      email: string
      password_hash: string
      name: string
      plan: string
    }) {
      const result = await sql`
        INSERT INTO users (email, password_hash, name, plan, monthly_usage, is_active, email_verified)
        VALUES (${userData.email}, ${userData.password_hash}, ${userData.name}, ${userData.plan}, 0, true, false)
        RETURNING id, email, name, plan, is_active, email_verified, created_at
      `
      return result[0]
    },

    async findByEmail(email: string) {
      const result = await sql`
        SELECT id, email, password_hash, name, plan, monthly_usage, is_active, email_verified, last_login, created_at
        FROM users 
        WHERE email = ${email} AND is_active = true
      `
      return result[0] || null
    },

    async findById(id: string) {
      const result = await sql`
        SELECT id, email, name, plan, monthly_usage, is_active, email_verified, last_login, created_at
        FROM users 
        WHERE id = ${id} AND is_active = true
      `
      return result[0] || null
    },

    async updateUsage(userId: string, additionalMinutes: number) {
      await sql`
        UPDATE users 
        SET monthly_usage = monthly_usage + ${additionalMinutes}
        WHERE id = ${userId}
      `
    },

    async updateLastLogin(userId: string) {
      await sql`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `
    },
  },

  // Podcast operations
  podcasts: {
    async create(podcastData: {
      user_id: string
      title: string
      description?: string
      audio_url: string
      audio_size?: number
      duration: number
    }) {
      const result = await sql`
        INSERT INTO podcasts (user_id, title, description, audio_url, audio_size, duration, status)
        VALUES (${podcastData.user_id}, ${podcastData.title}, ${podcastData.description || null}, 
                ${podcastData.audio_url}, ${podcastData.audio_size || null}, ${podcastData.duration}, 'uploading')
        RETURNING id, title, status, created_at
      `
      return result[0]
    },

    async findById(id: string) {
      const result = await sql`
        SELECT * FROM podcasts WHERE id = ${id}
      `
      return result[0] || null
    },

    async findByUserId(userId: string) {
      const result = await sql`
        SELECT id, title, description, duration, status, created_at, updated_at
        FROM podcasts 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
      return result
    },

    async updateStatus(id: string, status: string, errorMessage?: string) {
      if (errorMessage) {
        await sql`
          UPDATE podcasts 
          SET status = ${status}, error_message = ${errorMessage}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      } else {
        await sql`
          UPDATE podcasts 
          SET status = ${status}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      }
    },

    async setProcessingStarted(id: string) {
      await sql`
        UPDATE podcasts 
        SET status = 'processing', processing_started_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    },

    async setProcessingCompleted(id: string) {
      await sql`
        UPDATE podcasts 
        SET status = 'completed', processing_completed_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    },
  },

  // Live sessions
  liveSessions: {
    async create(sessionData: {
      user_id: string
      title: string
      settings: any
    }) {
      const result = await sql`
        INSERT INTO live_sessions (user_id, title, settings, status)
        VALUES (${sessionData.user_id}, ${sessionData.title}, ${JSON.stringify(sessionData.settings)}, 'active')
        RETURNING *
      `
      return result[0]
    },

    async findById(id: string) {
      const result = await sql`
        SELECT * FROM live_sessions WHERE id = ${id}
      `
      return result[0] || null
    },

    async updateStatus(id: string, status: string) {
      await sql`
        UPDATE live_sessions 
        SET status = ${status}
        WHERE id = ${id}
      `
    },

    async updateSettings(id: string, settings: any) {
      await sql`
        UPDATE live_sessions 
        SET settings = ${JSON.stringify(settings)}
        WHERE id = ${id}
      `
    },
  },

  // Transcript segments
  transcriptSegments: {
    async create(segmentData: {
      session_id?: string
      podcast_id?: string
      timestamp_ms: number
      text: string
      confidence: number
      speaker?: string
    }) {
      const result = await sql`
        INSERT INTO transcript_segments (session_id, podcast_id, timestamp_ms, text, confidence, speaker)
        VALUES (${segmentData.session_id || null}, ${segmentData.podcast_id || null}, 
                ${segmentData.timestamp_ms}, ${segmentData.text}, ${segmentData.confidence}, 
                ${segmentData.speaker || null})
        RETURNING *
      `
      return result[0]
    },

    async findBySessionId(sessionId: string) {
      const result = await sql`
        SELECT * FROM transcript_segments 
        WHERE session_id = ${sessionId}
        ORDER BY timestamp_ms ASC
      `
      return result
    },

    async findByPodcastId(podcastId: string) {
      const result = await sql`
        SELECT * FROM transcript_segments 
        WHERE podcast_id = ${podcastId}
        ORDER BY timestamp_ms ASC
      `
      return result
    },
  },

  // Fact check results
  factCheckResults: {
    async create(resultData: {
      session_id?: string
      podcast_id?: string
      segment_id?: string
      claim: string
      verdict: string
      confidence: number
      ai_summary?: string
      processing_time_ms?: number
      is_flagged?: boolean
    }) {
      const result = await sql`
        INSERT INTO fact_check_results (session_id, podcast_id, segment_id, claim, verdict, 
                                      confidence, ai_summary, processing_time_ms, is_flagged)
        VALUES (${resultData.session_id || null}, ${resultData.podcast_id || null}, 
                ${resultData.segment_id || null}, ${resultData.claim}, ${resultData.verdict},
                ${resultData.confidence}, ${resultData.ai_summary || null}, 
                ${resultData.processing_time_ms || null}, ${resultData.is_flagged || false})
        RETURNING *
      `
      return result[0]
    },

    async findByPodcastId(podcastId: string) {
      const result = await sql`
        SELECT fcr.*, 
               array_agg(
                 json_build_object(
                   'id', p.id,
                   'stance', p.stance,
                   'explanation', p.explanation,
                   'relevance_score', p.relevance_score,
                   'source', json_build_object(
                     'id', s.id,
                     'title', s.title,
                     'url', s.url,
                     'domain', s.domain,
                     'reliability_score', s.reliability_score
                   )
                 )
               ) as perspectives
        FROM fact_check_results fcr
        LEFT JOIN perspectives p ON p.fact_check_id = fcr.id
        LEFT JOIN sources s ON s.id = p.source_id
        WHERE fcr.podcast_id = ${podcastId}
        GROUP BY fcr.id
        ORDER BY fcr.created_at DESC
      `
      return result
    },

    async findBySessionId(sessionId: string) {
      const result = await sql`
        SELECT * FROM fact_check_results 
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
      `
      return result
    },
  },

  // Sources
  sources: {
    async create(sourceData: {
      title: string
      url: string
      domain: string
      source_type: string
      political_lean?: string
      reliability_score?: number
    }) {
      const result = await sql`
        INSERT INTO sources (title, url, domain, source_type, political_lean, reliability_score)
        VALUES (${sourceData.title}, ${sourceData.url}, ${sourceData.domain}, 
                ${sourceData.source_type}, ${sourceData.political_lean || "unknown"}, 
                ${sourceData.reliability_score || 50})
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          reliability_score = EXCLUDED.reliability_score,
          last_verified = CURRENT_TIMESTAMP
        RETURNING *
      `
      return result[0]
    },

    async findByDomain(domain: string) {
      const result = await sql`
        SELECT * FROM sources 
        WHERE domain = ${domain} AND is_active = true
        ORDER BY reliability_score DESC
      `
      return result
    },
  },

  // Analytics and monitoring
  analytics: {
    async trackEvent(eventData: {
      event_name: string
      user_id?: string
      properties: any
    }) {
      await sql`
        INSERT INTO analytics_events (event_name, user_id, properties)
        VALUES (${eventData.event_name}, ${eventData.user_id || null}, ${JSON.stringify(eventData.properties)})
      `
    },

    async getUsageStats(userId: string, startDate: string, endDate: string) {
      const result = await sql`
        SELECT 
          COUNT(DISTINCT p.id) as total_podcasts,
          COUNT(DISTINCT fcr.id) as total_fact_checks,
          SUM(p.duration) as total_duration_seconds,
          AVG(fcr.confidence) as avg_confidence
        FROM podcasts p
        LEFT JOIN fact_check_results fcr ON fcr.podcast_id = p.id
        WHERE p.user_id = ${userId}
          AND p.created_at >= ${startDate}
          AND p.created_at <= ${endDate}
      `
      return result[0]
    },
  },

  // Health checks
  async healthCheck() {
    try {
      const result = await sql`SELECT 1 as health`
      return result[0]?.health === 1
    } catch (error) {
      console.error("Neon health check failed:", error)
      return false
    }
  },

  // Performance monitoring
  async getPerformanceMetrics(hours = 24) {
    const result = await sql`
      SELECT 
        endpoint,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        COUNT(*) as request_count,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
      FROM performance_metrics
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY endpoint
      ORDER BY avg_response_time DESC
    `
    return result
  },
}

console.log("✅ Neon integration installed and configured")
