import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { redis } from "../database/connection"
import { verifyAccessToken } from "../auth/security" // Assuming this is your token verification function
import { factCheckingQueue } from "../queue/processor" // Assuming you have a fact checking queue
import type { Server as HTTPServer } from "http"
import { executeQuery } from "../database/executeQuery" // Assuming this is your database query function
import { AssemblyAIRealtimeProcessor } from '../services/assemblyai-realtime'; // Adjust import path if necessary
import { detectClaims } from '../engines/claim-detector'; // Adjust import path if necessary - Assuming this is your claim detection function

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
  "settings-updated": (settings: any) => void // Added for broadcasting settings updates
}

export interface InterServerEvents {
  "broadcast-to-session": (sessionId: string, event: string, data: any) => void
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

// Add Processor Map: Add the following line outside of any function or class to store active AssemblyAI processors:
const activeAssemblyAIProcessors = new Map<string, AssemblyAIRealtimeProcessor>();


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

      // Assuming verifyAccessToken decodes the token and returns user payload
      const payload = verifyAccessToken(token)
      if (!payload || !payload.userId) { // Ensure payload and userId exist
        return next(new Error("Invalid token payload"))
      }

      // Store user data in socket
      socket.data.userId = payload.userId

      next()
    } catch (error) {
      console.error("WebSocket Authentication Error:", error); // Log the error
      next(new Error("Authentication failed"))
    }
  })

  // Rate limiting middleware
  io.use(async (socket, next) => {
    const userId = socket.data.userId
    const rateLimitKey = `ws_rate_limit:${userId}`

    try {
      // Using Redis INCR to atomically increment and check
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
          // Set expiry for the first request in the window (e.g., 60 seconds)
          await redis.expire(rateLimitKey, 60); // Rate limit window: 60 seconds
      }

      const limit = 100; // 100 connections per 60 seconds
      if (count > limit) {
        return next(new Error("Rate limit exceeded"))
      }

      next()
    } catch (error) {
      console.error("WebSocket Rate Limiting Error:", error); // Log the error
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

        // **Initialize and connect AssemblyAI Realtime Processor for this session**
        const processor = new AssemblyAIRealtimeProcessor({
            sessionId,
            onTranscript: async (segment) => { // Make this async to await database operations and claim detection
                // Handle the final transcript segment received from AssemblyAI
                // Broadcast transcript to all session participants
                io.to(`session:${sessionId}`).emit("transcript-segment", segment);

                // **Trigger claim detection here**
                // You would call your claim detection logic with segment.text
                // and potentially queue a fact-checking job if a claim is detected.
                try {
                    const session = await getSession(sessionId); // Get session settings to check autoFactCheck
                    // Assuming detectClaims returns an array of detected claims
                    const detectedClaims = await detectClaims(segment.text, segment.id, sessionId);

                    if (session?.settings?.autoFactCheck && detectedClaims && detectedClaims.length > 0) {
                         for (const claim of detectedClaims) {
                             // Queue fact-checking job for each detected claim
                             const job = await factCheckingQueue.add("verify-claim", {
                               sessionId: sessionId,
                               segmentId: segment.id, // Link claim to segment
                               claim: claim.text,
                               timestamp: claim.timestamp,
                               settings: session.settings, // Pass session settings to the job
                               claimId: claim.id, // Pass claim ID to the job
                             });

                             io.to(`session:${sessionId}`).emit("fact-check-started", {
                               segmentId: segment.id,
                               jobId: job.id,
                               claimId: claim.id,
                               claimText: claim.text, // Include claim text for frontend display
                             });
                         }
                    }
                } catch (error) {
                    console.error("Error during claim detection trigger:", error);
                    // Handle error appropriately - maybe emit an error to the client
                     socket.emit("fact-check-error", {
                        segmentId: segment.id,
                        error: "Failed to process claim detection."
                     });
                }
            },
            onError: (error) => {
                // Handle errors from AssemblyAI
                 console.error(`AssemblyAI error for session ${sessionId}:`, error); // Log the error
                 socket.emit("error", `AssemblyAI error: ${error.message}`);
            },
            onClose: (code, reason) => {
                // Handle AssemblyAI connection closed
                console.log(`AssemblyAI connection closed for session ${sessionId}: ${code} - ${reason}`);
                activeAssemblyAIProcessors.delete(sessionId); // Clean up
            },
        });

        activeAssemblyAIProcessors.set(sessionId, processor);

        // Connect to AssemblyAI Realtime Service
        processor.connect();


      } catch (error) {
        console.error("Join session error:", error);
        socket.emit("error", "Failed to join session");
      }
    })

    // Leave session
    socket.on("leave-session", async (sessionId) => {
      try {
        // **Close the AssemblyAI Realtime Processor for this session**
        const processor = activeAssemblyAIProcessors.get(sessionId);
        if (processor) {
            processor.close();
            activeAssemblyAIProcessors.delete(sessionId);
        }

        await socket.leave(`session:${sessionId}`);
        socket.data.sessionId = undefined;
        console.log(`User ${socket.data.userId} left session ${sessionId}`);
      } catch (error) {
        console.error("Leave session error:", error);
      }
    })

    // Handle audio chunks
    socket.on("audio-chunk", async (data) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session");
          return;
        }

        // **Send the audio chunk to the AssemblyAI Realtime Processor**
        const processor = activeAssemblyAIProcessors.get(socket.data.sessionId);
        if (processor) {
            processor.sendAudioChunk(data);
        } else {
             socket.emit("error", "AssemblyAI processor not initialized for this session");
        }

        // **Remove or comment out the old mock audio processing call:**
        // const transcript = await processAudioChunk(data, socket.data.sessionId);
        // if (transcript) {
        //   io.to(`session:${socket.data.sessionId}`).emit("transcript-segment", transcript);
        //   // Check if auto fact-checking is enabled
        //   const session = await getSession(socket.data.sessionId);
        //   if (session?.settings?.autoFactCheck && containsFactualClaim(transcript.text)) {
        //     // Queue fact-checking job
        //     const job = await factCheckingQueue.add("verify-claim", {
        //       sessionId: socket.data.sessionId,
        //       segmentId: transcript.id,
        //       claim: transcript.text,
        //       timestamp: transcript.timestamp,
        //       settings: session.settings,
        //     });
        //     io.to(`session:${socket.data.sessionId}`).emit("fact-check-started", {
        //       segmentId: transcript.id,
        //       jobId: job.id,
        //     });
        //   }
        // }

      } catch (error) {
        console.error("Audio chunk handling error:", error); // More specific error log
        socket.emit("error", "Audio processing failed");
      }
    })

    // Manual fact-check
    socket.on("manual-fact-check", async (claim) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session");
          return;
        }

        const session = await getSession(socket.data.sessionId)
        if (!session) {
          socket.emit("error", "Session not found")
          return
        }

        // **TODO: Create a claim object for manual fact-check and save to DB**
        // Before queuing the job, you might want to create a FactCheckClaim object
        // for the manual claim and save it to your database, similar to auto-detected claims.
        const manualClaim = {
             id: `claim_${Date.now()}_manual_${Math.random().toString(36).substr(2, 9)}`,
             text: claim,
             timestamp: Date.now(),
             confidence: 1.0, // High confidence for manual claims
             type: "manual",
             sessionId: socket.data.sessionId,
             userId: socket.data.userId, // Associate manual claim with user
        };

        // Assuming you have a function to save a claim to the database
        await saveClaimToDatabase(manualClaim); // Implement this function

        // Queue fact-checking job
        const job = await factCheckingQueue.add(
          "verify-claim",
          {
            sessionId: socket.data.sessionId,
            claim: manualClaim.text,
            timestamp: manualClaim.timestamp,
            settings: session.settings,
            claimId: manualClaim.id, // Pass the new claim ID
            userId: manualClaim.userId, // Pass user ID for manual claims
          },
          {
            priority: 10, // Higher priority for manual requests
          },
        )

        socket.emit("fact-check-started", {
          claim: manualClaim.text,
          jobId: job.id,
          claimId: manualClaim.id, // Emit the claim ID
        })
      } catch (error) {
        console.error("Manual fact-check error:", error)
        socket.emit("error", "Fact-check failed")
      }
    })

    // Voice commands
    socket.on("voice-command", async (command) => {
      try {
        // **TODO: Implement voice command handling logic**
        // This will involve parsing the command text to identify intent (e.g., "fact check this", "read sources")
        // and parameters.
        console.log(`Received voice command: ${command}`);
        await handleVoiceCommand(socket, command); // Use your existing or enhanced handler

        // Example: If the command is a fact-check request:
        // const parsedCommand = parseVoiceCommand(command); // Implement this function
        // if (parsedCommand.intent === 'fact_check' && parsedCommand.text) {
        //     // Trigger a manual fact-check with the command text
        //     // You might want to call the manual-fact-check logic here or a shared function
        //     await socket.emit("manual-fact-check", parsedCommand.text);
        // }
        // Handle other intents (e.g., 'read_sources', 'save_result', 'toggle_mode')
      } catch (error) {
        console.error("Voice command error:", error)
        socket.emit("error", "Voice command failed")
      }
    })

    // Update settings
    socket.on("update-settings", async (settings) => {
      try {
        if (!socket.data.sessionId) {
          socket.emit("error", "No active session");
          return;
        }

        // **TODO: Validate and sanitize incoming settings**
        // Ensure the settings object conforms to your expected structure (SessionSettings)
        // and sanitize any user-provided values.

        await updateSessionSettings(socket.data.sessionId, settings);

        // Broadcast settings update to all session participants
        io.to(`session:${socket.data.sessionId}`).emit("settings-updated", settings);

        console.log(`Settings updated for session ${socket.data.sessionId}:`, settings);
      } catch (error) {
        console.error("Settings update error:", error);
        socket.emit("error", "Settings update failed");
      }
    })

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.data.userId} disconnected: ${reason}`)
      // **Clean up AssemblyAI processor if the user was in a session**
      if (socket.data.sessionId) {
           const processor = activeAssemblyAIProcessors.get(socket.data.sessionId);
           if (processor) {
              processor.close();
              activeAssemblyAIProcessors.delete(socket.data.sessionId);
           }
      }
    })

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  })

  // Queue event handlers for broadcasting results
  // Assuming the job result structure includes sessionId and the fact-check result data
  factCheckingQueue.on("completed", async (job, result) => {
    const { sessionId, claimId } = job.data; // Get sessionId and claimId from job data
    if (sessionId && result.success) {
      console.log(`Fact-check job ${job.id} completed for session ${sessionId}.`);
      // Assuming the result object from the job processor contains the fact-check data
      io.to(`session:${sessionId}`).emit("fact-check-result", {
        jobId: job.id,
        claimId: claimId, // Include claimId in the result
        result: result.data, // Assuming the actual result data is in result.data
      });
    } else if (sessionId && !result.success) {
         console.error(`Fact-check job ${job.id} failed for session ${sessionId}: ${result.error}`);
          io.to(`session:${sessionId}`).emit("fact-check-error", {
            jobId: job.id,
            claimId: claimId,
            error: result.error, // Assuming the error message is in result.error
          });
    }
  })

  factCheckingQueue.on("failed", async (job, error) => {
    const { sessionId, claimId } = job.data; // Get sessionId and claimId from job data
    if (sessionId) {
      console.error(`Fact-check job ${job.id} failed for session ${sessionId}:`, error);
      io.to(`session:${sessionId}`).emit("fact-check-error", {
        jobId: job.id,
        claimId: claimId,
        error: error.message,
      });
    }
  })

  return io
}

// Helper functions (assuming these are already implemented or will be)

// Assuming verifyAccessToken is implemented in ../auth/security
// export function verifyAccessToken(token: string): { userId: string } | null { ... }

// Assuming validateSessionAccess checks if a user has access to a session
async function validateSessionAccess(userId: string, sessionId: string): Promise<boolean> {
  try {
    // **TODO: Implement actual session access validation**
    // Query your database to check if the user is associated with the session.
    // Example (assuming 'live_sessions' table has 'user_id' and 'id'):
     const sessions = await executeQuery("SELECT id FROM live_sessions WHERE id = $1 AND user_id = $2", [
       sessionId,
       userId,
     ]);
     return sessions.length > 0;
  } catch (error) {
    console.error("Session access validation failed:", error);
    return false;
  }
}

// Assuming getSessionStats retrieves statistics for a session
async function getSessionStats(sessionId: string): Promise<any> {
   try {
    // **TODO: Implement actual session stats retrieval**
    // Query your database to get relevant statistics.
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
    );

    return stats[0] || {};
  } catch (error) {
    console.error("Get session stats failed:", error);
    return {};
  }
}


// Assuming getSession retrieves session details
async function getSession(sessionId: string): Promise<any> {
   try {
    // **TODO: Implement actual session retrieval**
    // Query your database to get session details, including settings.
     const sessions = await executeQuery("SELECT * FROM live_sessions WHERE id = $1", [sessionId]);
     return sessions[0] || null;
  } catch (error) {
    console.error("Get session failed:", error);
    return null;
  }
}

// Assuming updateSessionSettings updates session settings in the database
async function updateSessionSettings(sessionId: string, settings: any): Promise<void> {
   try {
    // **TODO: Implement actual session settings update**
    // Update the settings (JSONB column) in your database.
     await executeQuery("UPDATE live_sessions SET settings = $1 WHERE id = $2", [JSON.stringify(settings), sessionId]);
  } catch (error) {
    console.error("Update session settings failed:", error);
    throw error;
  }
}

// Assuming handleVoiceCommand handles voice commands
async function handleVoiceCommand(socket: any, command: string): Promise<void> {
  // **TODO: Implement voice command processing logic**
  // This is a placeholder. You'll need to parse the command and trigger actions.
  console.log(`Handling voice command: ${command}`);
  switch (command.toLowerCase().trim()) {
    case "pause":
      // Handle pause command
      console.log("Pause command received");
      // Trigger session pause logic
      break;
    case "resume":
      // Handle resume command
      console.log("Resume command received");
       // Trigger session resume logic
      break;
    // Add other voice commands based on your project brief
     case "fact check that":
     case "check that claim":
         console.log("Fact check command received");
         // **TODO: Extract the claim text from the command if possible**
         // For now, this is a basic trigger. You'll need NLP to get the actual claim.
         socket.emit("manual-fact-check", "the last spoken claim"); // Placeholder claim
         break;
    default:
      socket.emit("voice-alert", { type: "error", message: "Unknown voice command" }); // Use voice alert
  }
}

// Assuming saveClaimToDatabase saves a claim to the database
async function saveClaimToDatabase(claim: any): Promise<void> {
    // **TODO: Implement actual logic to save claim to database**
    // Use executeQuery to insert the claim into your 'claims' table.
     console.log("Saving claim to database (placeholder):", claim);
     // Example:
     // await executeQuery(
     //    "INSERT INTO claims (id, session_id, text, timestamp, confidence, type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
     //    [claim.id, claim.sessionId, claim.text, claim.timestamp, claim.confidence, claim.type, claim.userId]
     // );
}


// **Remove the old mock processAudioChunk function:**
// async function processAudioChunk(...) { ... }

// Remove the old basic containsFactualClaim function, as claim detection is now handled by detectClaims
// function containsFactualClaim(text: string): boolean { ... }


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
