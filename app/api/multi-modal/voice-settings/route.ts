import { type NextRequest, NextResponse } from "next/server"
import { EnhancedMultiModalProcessor } from "@/lib/engines/enhanced-multi-modal-processor"

const processor = new EnhancedMultiModalProcessor()

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, voiceSettings } = await request.json()

    if (!sessionId || !voiceSettings) {
      return NextResponse.json({ error: "Missing sessionId or voiceSettings" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Validate voice settings
    const validatedSettings = {
      enabled: voiceSettings.enabled ?? session.voiceSettings.enabled,
      privateAudio: voiceSettings.privateAudio ?? session.voiceSettings.privateAudio,
      voiceType: ["professional", "casual", "authoritative", "friendly"].includes(voiceSettings.voiceType)
        ? voiceSettings.voiceType
        : session.voiceSettings.voiceType,
      speed: Math.max(0.5, Math.min(2.0, voiceSettings.speed ?? session.voiceSettings.speed)),
      volume: Math.max(0, Math.min(1, voiceSettings.volume ?? session.voiceSettings.volume)),
      tone: ["neutral", "encouraging", "cautious", "confident"].includes(voiceSettings.tone)
        ? voiceSettings.tone
        : session.voiceSettings.tone,
      audioAlerts: voiceSettings.audioAlerts ?? session.voiceSettings.audioAlerts,
      chimeVolume: Math.max(0, Math.min(1, voiceSettings.chimeVolume ?? session.voiceSettings.chimeVolume)),
    }

    processor.updateSessionSettings(sessionId, validatedSettings)

    return NextResponse.json({
      success: true,
      message: "Voice settings updated successfully",
      settings: validatedSettings,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Voice settings update error:", error)
    return NextResponse.json({ error: "Failed to update voice settings" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const session = processor.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      voiceSettings: session.voiceSettings,
    })
  } catch (error) {
    console.error("Voice settings retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve voice settings" }, { status: 500 })
  }
}
