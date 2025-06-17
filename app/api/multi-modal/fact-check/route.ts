import { type NextRequest, NextResponse } from "next/server"
import { MultiModalProcessor } from "@/lib/engines/multi-modal-processor"

const processor = new MultiModalProcessor()

export async function POST(request: NextRequest) {
  try {
    const { sessionId, claim, userId, type = "manual" } = await request.json()

    if (!sessionId || !claim || !userId) {
      return NextResponse.json({ error: "Missing required fields: sessionId, claim, userId" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Process text input for fact-checking
    const textInput = {
      text: claim,
      timestamp: Date.now(),
      sessionId,
      userId,
      type: type as "manual" | "voice_command" | "auto_detected",
    }

    await processor.processTextInput(textInput)

    return NextResponse.json({
      success: true,
      message: "Fact-check request processed",
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Fact-check processing error:", error)
    return NextResponse.json({ error: "Failed to process fact-check request" }, { status: 500 })
  }
}
