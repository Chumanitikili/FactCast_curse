import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const podcasts = await db.podcasts.findByUserId(user.id)

    return NextResponse.json({ podcasts })
  } catch (error) {
    console.error("Get podcasts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
