import { type NextRequest, NextResponse } from "next/server"
import { EnhancedMultiModalProcessor } from "@/lib/engines/enhanced-multi-modal-processor"

const processor = new EnhancedMultiModalProcessor()

export async function POST(request: NextRequest) {
  try {
    const { sessionId, claim, userId, type = "manual", requireThreeSources = true } = await request.json()

    if (!sessionId || !claim || !userId) {
      return NextResponse.json({ error: "Missing required fields: sessionId, claim, userId" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const startTime = Date.now()

    // Enhanced text input processing with 3-second timeout
    const textInput = {
      text: claim,
      timestamp: Date.now(),
      sessionId,
      userId,
      type: type as "manual" | "voice_command" | "auto_detected",
    }

    // Process with timeout to ensure <3 second response
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Processing timeout")), 2800), // 2.8s to allow for response time
    )

    try {
      await Promise.race([processor.processTextInput(textInput), timeoutPromise])

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: "Enhanced fact-check request processed",
        processingTime,
        timestamp: Date.now(),
        requireThreeSources,
      })
    } catch (timeoutError) {
      return NextResponse.json(
        {
          error: "Fact-check processing timeout",
          message: "Request took longer than 3 seconds",
          processingTime: Date.now() - startTime,
        },
        { status: 408 },
      )
    }
  } catch (error) {
    console.error("Enhanced fact-check processing error:", error)
    return NextResponse.json({ error: "Failed to process enhanced fact-check request" }, { status: 500 })
  }
}
