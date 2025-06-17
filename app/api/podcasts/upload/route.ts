import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getSecurityHeaders, checkRateLimit } from "@/lib/auth/security"
import { executeQuery } from "@/lib/database/connection"
import { audioProcessingQueue } from "@/lib/queue/processor"
import { uploadToS3 } from "@/lib/storage/s3"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | null = null

  try {
    // Authentication
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: getSecurityHeaders() })
    }

    userId = user.id

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, "upload", 10, 60 * 60 * 1000) // 10 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded" },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const formData = await request.formData()
    const file = formData.get("audio") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file || !title) {
      return NextResponse.json(
        { error: "Audio file and title are required" },
        { status: 400, headers: getSecurityHeaders() },
      )
    }

    // Validate file
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 413, headers: getSecurityHeaders() },
      )
    }

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: MP3, WAV, MP4, WebM" },
        { status: 400, headers: getSecurityHeaders() },
      )
    }

    // Check usage limits
    const usageLimits = {
      free: 30 * 60, // 30 minutes
      creator: 10 * 60 * 60, // 10 hours
      professional: 50 * 60 * 60, // 50 hours
      enterprise: Number.POSITIVE_INFINITY,
    }

    const estimatedDuration = Math.floor(file.size / 32000) // Rough estimate
    const currentUsage = await executeQuery("SELECT monthly_usage FROM users WHERE id = $1", [user.id])

    const totalUsage = (currentUsage[0]?.monthly_usage || 0) + Math.ceil(estimatedDuration / 60)
    if (totalUsage > usageLimits[user.plan]) {
      return NextResponse.json(
        { error: "Monthly usage limit exceeded for your plan" },
        { status: 403, headers: getSecurityHeaders() },
      )
    }

    // Upload file to S3
    const audioUrl = await uploadToS3(file, `podcasts/${user.id}/${Date.now()}-${file.name}`)

    // Create podcast record
    const podcasts = await executeQuery(
      `INSERT INTO podcasts (user_id, title, description, audio_url, audio_size, duration, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'uploading') 
       RETURNING id, title, status, created_at`,
      [user.id, title, description || null, audioUrl, file.size, estimatedDuration],
    )

    const podcast = podcasts[0]

    // Queue audio processing
    await audioProcessingQueue.add(
      "transcribe-audio",
      {
        podcastId: podcast.id,
        userId: user.id,
        audioUrl,
        settings: {
          autoFactCheck: true,
          confidenceThreshold: 70,
          sourceTypes: ["news", "academic", "government"],
        },
      },
      {
        priority: user.plan === "enterprise" ? 10 : user.plan === "professional" ? 5 : 1,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    )

    // Update user usage
    await executeQuery("UPDATE users SET monthly_usage = monthly_usage + $1 WHERE id = $2", [
      Math.ceil(estimatedDuration / 60),
      user.id,
    ])

    // Log audit event
    await executeQuery(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)",
      [user.id, "podcast_upload", "podcast", podcast.id, JSON.stringify({ title, fileSize: file.size })],
    )

    // Track performance
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["/api/podcasts/upload", "POST", responseTime, 201, user.id],
    )

    return NextResponse.json(
      {
        podcast: {
          id: podcast.id,
          title: podcast.title,
          status: podcast.status,
          createdAt: podcast.created_at,
        },
        message: "Upload successful. Processing will begin shortly.",
      },
      { status: 201, headers: getSecurityHeaders() },
    )
  } catch (error) {
    console.error("Upload error:", error)

    // Log error
    if (userId) {
      await executeQuery("INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)", [
        userId,
        "upload_error",
        "podcast",
        JSON.stringify({ error: error.message }),
      ]).catch(console.error)
    }

    // Track performance for failed requests
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["/api/podcasts/upload", "POST", responseTime, 500, userId],
    ).catch(console.error)

    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500, headers: getSecurityHeaders() },
    )
  }
}
