import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

const defaultVoiceSettings = {
  voice: "alloy",
  speed: 1.0,
  pitch: 1.0,
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, mode } = body

    if (!title || !mode) {
      return NextResponse.json({ error: "Title and mode are required" }, { status: 400 })
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session = {
      id: sessionId,
      userId,
      title,
      mode,
      application: "TruthCast",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      voiceSettings: defaultVoiceSettings,
      isLive: false,
      claims: [],
      results: [],
    }

    // Save session to database
    // await prisma.session.create({
    //   data: {
    //     id: session.id,
    //     userId: session.userId,
    //     title: session.title,
    //     mode: session.mode,
    //     application: session.application,
    //     version: session.version,
    //     voiceSettings: session.voiceSettings,
    //     isLive: session.isLive,
    //     createdAt: new Date(session.createdAt),
    //   },
    // })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // const sessions = await prisma.session.findMany({
    //   where: { userId },
    //   orderBy: { createdAt: "desc" },
    // })
    // Mock sessions response
    const sessions = [
      {
        id: "mock_session_1",
        userId,
        title: "Sample Session",
        mode: "hybrid",
        application: "TruthCast",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        voiceSettings: defaultVoiceSettings,
        isLive: false,
        claims: [],
        results: [],
      },
    ];
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
