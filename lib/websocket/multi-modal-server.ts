import { Server as SocketIOServer } from "socket.io"
import { MultiModalProcessor } from "../engines/multi-modal-processor"
import type { VoiceInput, TextInput } from "../types/multi-modal"

export class MultiModalWebSocketServer {
  private io: SocketIOServer
  private processor: MultiModalProcessor
  private activeSessions = new Map<string, Set<string>>() // sessionId -> socketIds

  constructor(httpServer: any) {
    this.processor = new MultiModalProcessor()

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Session management
      socket.on("join-session", async (data: { sessionId: string; userId: string }) => {
        const { sessionId, userId } = data

        await socket.join(`session:${sessionId}`)

        if (!this.activeSessions.has(sessionId)) {
          this.activeSessions.set(sessionId, new Set())
        }
        this.activeSessions.get(sessionId)!.add(socket.id)

        socket.emit("session-joined", { sessionId, status: "connected" })
      })

      // Create new session
      socket.on(
        "create-session",
        (data: {
          userId: string
          title: string
          mode: "voice_only" | "text_only" | "hybrid" | "passive"
        }) => {
          const session = this.processor.createSession(data.userId, data.title, data.mode)
          socket.emit("session-created", session)
        },
      )

      // Voice input processing
      socket.on(
        "voice-input",
        async (data: {
          audioData: ArrayBuffer
          sessionId: string
          speakerId?: string
        }) => {
          const voiceInput: VoiceInput = {
            audioData: data.audioData,
            timestamp: Date.now(),
            sessionId: data.sessionId,
            speakerId: data.speakerId,
          }

          await this.processor.processVoiceInput(voiceInput)
        },
      )

      // Text input processing
      socket.on(
        "text-input",
        async (data: {
          text: string
          sessionId: string
          userId: string
          type: "manual" | "voice_command" | "auto_detected"
        }) => {
          const textInput: TextInput = {
            text: data.text,
            timestamp: Date.now(),
            sessionId: data.sessionId,
            userId: data.userId,
            type: data.type,
          }

          await this.processor.processTextInput(textInput)
        },
      )

      // Voice command processing
      socket.on(
        "voice-command",
        async (data: {
          command: string
          sessionId: string
        }) => {
          const textInput: TextInput = {
            text: data.command,
            timestamp: Date.now(),
            sessionId: data.sessionId,
            userId: socket.id,
            type: "voice_command",
          }

          await this.processor.processTextInput(textInput)
        },
      )

      // Session settings update
      socket.on(
        "update-session-settings",
        (data: {
          sessionId: string
          settings: {
            voiceEnabled?: boolean
            privateAudio?: boolean
            voiceType?: string
            speed?: number
            volume?: number
          }
        }) => {
          this.processor.updateSessionSettings(data.sessionId, data.settings)

          // Broadcast settings update to all session participants
          this.io.to(`session:${data.sessionId}`).emit("settings-updated", data.settings)
        },
      )

      // Manual fact-check request
      socket.on(
        "manual-fact-check",
        async (data: {
          claim: string
          sessionId: string
          userId: string
        }) => {
          const textInput: TextInput = {
            text: data.claim,
            timestamp: Date.now(),
            sessionId: data.sessionId,
            userId: data.userId,
            type: "manual",
          }

          await this.processor.processTextInput(textInput)
        },
      )

      // Get session status
      socket.on("get-session-status", (data: { sessionId: string }) => {
        const session = this.processor.getSession(data.sessionId)
        if (session) {
          socket.emit("session-status", {
            session: {
              id: session.id,
              title: session.title,
              mode: session.mode,
              voiceSettings: session.voiceSettings,
              isLive: session.isLive,
              claimsCount: session.claims.length,
              resultsCount: session.results.length,
            },
          })
        }
      })

      // Audio stream handling for real-time processing
      socket.on("audio-stream-start", (data: { sessionId: string }) => {
        socket.join(`audio:${data.sessionId}`)
        socket.emit("audio-stream-ready")
      })

      socket.on(
        "audio-chunk",
        async (data: {
          chunk: ArrayBuffer
          sessionId: string
          sequence: number
        }) => {
          // Process audio chunk in real-time
          const voiceInput: VoiceInput = {
            audioData: data.chunk,
            timestamp: Date.now(),
            sessionId: data.sessionId,
          }

          await this.processor.processVoiceInput(voiceInput)
        },
      )

      socket.on("audio-stream-end", (data: { sessionId: string }) => {
        socket.leave(`audio:${data.sessionId}`)
      })

      // Disconnect handling
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`)

        // Remove from active sessions
        for (const [sessionId, socketIds] of this.activeSessions.entries()) {
          if (socketIds.has(socket.id)) {
            socketIds.delete(socket.id)
            if (socketIds.size === 0) {
              this.activeSessions.delete(sessionId)
            }
          }
        }
      })
    })
  }

  // Method to broadcast fact-check results
  broadcastFactCheckResult(sessionId: string, result: any): void {
    this.io.to(`session:${sessionId}`).emit("fact-check-result", result)
  }

  // Method to send audio feedback
  sendAudioFeedback(sessionId: string, feedback: any): void {
    this.io.to(`session:${sessionId}`).emit("audio-feedback", feedback)
  }

  // Method to send visual updates
  sendVisualUpdate(sessionId: string, update: any): void {
    this.io.to(`session:${sessionId}`).emit("visual-update", update)
  }

  // Get active session count
  getActiveSessionCount(): number {
    return this.activeSessions.size
  }

  // Get session participants
  getSessionParticipants(sessionId: string): number {
    return this.activeSessions.get(sessionId)?.size || 0
  }
}
