import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const podcast = await db.podcasts.findById(params.id)
    if (!podcast || podcast.userId !== user.id) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 })
    }

    if (podcast.status !== "completed") {
      return NextResponse.json({
        podcast,
        results: [],
        status: podcast.status,
      })
    }

    const results = await db.factChecks.findByPodcastId(params.id)

    return NextResponse.json({
      podcast,
      results,
      status: podcast.status,
    })
  } catch (error) {
    console.error("Get results error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
