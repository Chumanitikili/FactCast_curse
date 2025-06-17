import { type NextRequest, NextResponse } from "next/server"
import { MultiModalProcessor } from "@/lib/engines/multi-modal-processor"

const processor = new MultiModalProcessor()

export async function POST(request: NextRequest) {
  try {
    const { sessionId, command, userId } = await request.json()

    if (!sessionId || !command || !userId) {
      return NextResponse.json({ error: "Missing required fields: sessionId, command, userId" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Process voice command
    const textInput = {
      text: command,
      timestamp: Date.now(),
      sessionId,
      userId,
      type: "voice_command" as const,
    }

    await processor.processTextInput(textInput)

    return NextResponse.json({
      success: true,
      message: "Voice command processed",
      command: command,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Voice command processing error:", error)
    return NextResponse.json({ error: "Failed to process voice command" }, { status: 500 })
  }
}
