import { type NextRequest, NextResponse } from "next/server"
import { MultiModalProcessor } from "@/lib/engines/multi-modal-processor"

const processor = new MultiModalProcessor()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const sessionId = formData.get("sessionId") as string
    const speakerId = formData.get("speakerId") as string

    if (!audioFile || !sessionId) {
      return NextResponse.json({ error: "Missing audio file or session ID" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Convert file to ArrayBuffer
    const audioData = await audioFile.arrayBuffer()

    // Process voice input
    const voiceInput = {
      audioData,
      timestamp: Date.now(),
      sessionId,
      speakerId,
    }

    await processor.processVoiceInput(voiceInput)

    return NextResponse.json({
      success: true,
      message: "Audio processed successfully",
      fileSize: audioData.byteLength,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Audio processing error:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
