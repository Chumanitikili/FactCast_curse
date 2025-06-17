import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { redis } from "../database/connection"
import { verifyAccessToken } from "../auth/security"
import { factCheckingQueue } from "../queue/processor"
import type { Server as HTTPServer } from "http"
import { executeQuery } from "../database/executeQuery"

export interface SocketData {
  userId: string
  sessionId?: string
}

export interface ClientToServerEvents {
  "join-session": (sessionId: string) => void
  "leave-session": (sessionId: string) => void
  "audio-chunk": (data: ArrayBuffer) => void
  "manual-fact-check": (claim: string) => void
  "voice-command": (command: string) => void
  "update-settings": (settings: any) => void
}

export interface ServerToClientEvents {
  "session-joined": (sessionId: string) => void
  "transcript-segment": (segment: any) => void
  "fact-check-started": (data: any) => void
  "fact-check-result": (result: any) => void
  "fact-check-error": (error: any) => void
  "voice-alert": (alert: any) => void
  "session-stats": (stats: any) => void
  error: (message: string) => void
}

export interface InterServerEvents {
  "broadcast-to-session": (sessionId: string, event: string, data: any) => void
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export function initializeWebSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true,
  })

  // Redis adapter for horizontal scaling
  const pubClient = redis.duplicate()
  const subClient = redis.duplicate()
  io.adapter(createAdapter(pubClient, subClient))

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

      if (!token) {
        return next(new Error("Authentication required"))
      }

      const payload = verifyAccessToken(token)
      if (!payload) {
        return next(new Error("Invalid token"))
      }

      // Store user data in socket
      socket.data.userId = payload.userId

      next()
    } catch (error) {
      next(new Error("Authentication failed"))
    }
  })

  // Rate limiting middleware
  io.use(async (socket, next) => {
    const userId = socket.data.userId
    const rateLimitKey = `ws_rate_limit:${userId}`

    try {
      const current = (await redis.get(rateLimitKey)) || "0"
      const count = Number.parseInt(current)

      if (count > 100) {
        // 100 connections per minute
        return next(new Error("Rate limit exceeded"))
      }

      await redis.setex(rateLimitKey, 60, count + 1)
      next()
    } catch (error) {
      next(new Error("Rate limiting failed"))
    }
  })

  // Connection handling
  io.on("connection", (socket) => {
    console.log(`User ${socket.data.userId} connected`)

    // Join session
    socket.on("join-session", async (sessionId) => {
      try {
        // Validate session ownership
        const hasAccess = await validateSessionAccess(socket.data.userId, sessionId)
        if (!hasAccess) {
          socket.emit("error", "Access denied to session")
          return
        }

        socket.data.sessionId = sessionId
        await socket.join(`session:${sessionId}`)

        socket.emit("session-joined", sessionId)

        // Send current session stats
        const stats = await getSessionStats(sessionId)
        socket.emit("session-stats", stats)

        console.log(`User ${socket.data.userId} joined session ${sessionId}`)
      } catch (error) {
        console.error("Join session error:", error)
        socket.emit("error", "Failed to join session")
      }
    })

    // Leave session
    socket.on("leave-session", async (sessionId) => {
      try {
        await socket.leave(`session:${sessionId}`)
        socket.data.sessionId = undefined
        console.log(`User ${socket.data.userId} left session ${sessionId}`)
      } catch (error) {
        console.error("Leave session error:", error)
      }
    })

    // Handle audio chunks
    socket.on("audio-chunk", async (data) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session")
          return
        }

        // Process audio chunk
        const transcript = await processAudioChunk(data, socket.data.sessionId)

        if (transcript) {
          // Broadcast transcript to all session participants
          io.to(`session:${socket.data.sessionId}`).emit("transcript-segment", transcript)

          // Check if auto fact-checking is enabled
          const session = await getSession(socket.data.sessionId)
          if (session?.settings?.autoFactCheck && containsFactualClaim(transcript.text)) {
            // Queue fact-checking job
            const job = await factCheckingQueue.add("verify-claim", {
              sessionId: socket.data.sessionId,
              segmentId: transcript.id,
              claim: transcript.text,
              timestamp: transcript.timestamp,
              settings: session.settings,
            })

            io.to(`session:${socket.data.sessionId}`).emit("fact-check-started", {
              segmentId: transcript.id,
              jobId: job.id,
            })
          }
        }
      } catch (error) {
        console.error("Audio processing error:", error)
        socket.emit("error", "Audio processing failed")
      }
    })

    // Manual fact-check
    socket.on("manual-fact-check", async (claim) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session")
          return
        }

        const session = await getSession(socket.data.sessionId)
        if (!session) {
          socket.emit("error", "Session not found")
          return
        }

        // Queue fact-checking job
        const job = await factCheckingQueue.add(
          "verify-claim",
          {
            sessionId: socket.data.sessionId,
            claim,
            timestamp: Date.now(),
            settings: session.settings,
          },
          {
            priority: 10, // Higher priority for manual requests
          },
        )

        socket.emit("fact-check-started", {
          claim,
          jobId: job.id,
        })
      } catch (error) {
        console.error("Manual fact-check error:", error)
        socket.emit("error", "Fact-check failed")
      }
    })

    // Voice commands
    socket.on("voice-command", async (command) => {
      try {
        await handleVoiceCommand(socket, command)
      } catch (error) {
        console.error("Voice command error:", error)
        socket.emit("error", "Voice command failed")
      }
    })

    // Update settings
    socket.on("update-settings", async (settings) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session")
          return
        }

        await updateSessionSettings(socket.data.sessionId, settings)

        // Broadcast settings update to all session participants
        io.to(`session:${socket.data.sessionId}`).emit("settings-updated", settings)
      } catch (error) {
        console.error("Settings update error:", error)
        socket.emit("error", "Settings update failed")
      }
    })

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.data.userId} disconnected: ${reason}`)
    })

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  })

  // Queue event handlers for broadcasting results
  factCheckingQueue.on("completed", async (job, result) => {
    const { sessionId } = job.data
    if (sessionId && result.success) {
      io.to(`session:${sessionId}`).emit("fact-check-result", {
        jobId: job.id,
        result: result,
      })
    }
  })

  factCheckingQueue.on("failed", async (job, error) => {
    const { sessionId } = job.data
    if (sessionId) {
      io.to(`session:${sessionId}`).emit("fact-check-error", {
        jobId: job.id,
        error: error.message,
      })
    }
  })

  return io
}

// Helper functions
async function validateSessionAccess(userId: string, sessionId: string): Promise<boolean> {
  try {
    const sessions = await executeQuery("SELECT id FROM live_sessions WHERE id = $1 AND user_id = $2", [
      sessionId,
      userId,
    ])
    return sessions.length > 0
  } catch (error) {
    console.error("Session access validation failed:", error)
    return false
  }
}

async function getSessionStats(sessionId: string): Promise<any> {
  try {
    const stats = await executeQuery(
      `
      SELECT 
        ls.total_duration,
        ls.total_fact_checks,
        COUNT(ts.id) as segment_count,
        COUNT(fcr.id) as fact_check_count
      FROM live_sessions ls
      LEFT JOIN transcript_segments ts ON ts.session_id = ls.id
      LEFT JOIN fact_check_results fcr ON fcr.session_id = ls.id
      WHERE ls.id = $1
      GROUP BY ls.id, ls.total_duration, ls.total_fact_checks
    `,
      [sessionId],
    )

    return stats[0] || {}
  } catch (error) {
    console.error("Get session stats failed:", error)
    return {}
  }
}

async function processAudioChunk(audioData: ArrayBuffer, sessionId: string): Promise<any> {
  // Mock audio processing - integrate with real speech-to-text service
  const mockTranscript = {
    id: `segment_${Date.now()}`,
    sessionId,
    timestamp: Date.now(),
    text: "Sample transcribed text from audio chunk",
    confidence: 0.95,
  }

  // Save to database
  await executeQuery(
    "INSERT INTO transcript_segments (id, session_id, timestamp_ms, text, confidence) VALUES ($1, $2, $3, $4, $5)",
    [mockTranscript.id, sessionId, mockTranscript.timestamp, mockTranscript.text, mockTranscript.confidence],
  )

  return mockTranscript
}

async function getSession(sessionId: string): Promise<any> {
  try {
    const sessions = await executeQuery("SELECT * FROM live_sessions WHERE id = $1", [sessionId])
    return sessions[0] || null
  } catch (error) {
    console.error("Get session failed:", error)
    return null
  }
}

async function updateSessionSettings(sessionId: string, settings: any): Promise<void> {
  try {
    await executeQuery("UPDATE live_sessions SET settings = $1 WHERE id = $2", [JSON.stringify(settings), sessionId])
  } catch (error) {
    console.error("Update session settings failed:", error)
    throw error
  }
}

async function handleVoiceCommand(socket: any, command: string): Promise<void> {
  // Process voice commands
  switch (command.toLowerCase()) {
    case "pause":
      // Handle pause command
      break
    case "resume":
      // Handle resume command
      break
    case "fact check":
      // Trigger manual fact check
      break
    default:
      socket.emit("error", "Unknown voice command")
  }
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

export function getIO() {
  if (!io) {
    throw new Error("WebSocket server not initialized")
  }
  return io
}

// Graceful shutdown
export async function closeWebSocketServer(): Promise<void> {
  if (io) {
    io.close()
  }
}
