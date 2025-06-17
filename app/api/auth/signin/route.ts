import { type NextRequest, NextResponse } from "next/server"
import {
  authenticateUser,
  generateAccessToken,
  generateRefreshToken,
  getSecurityHeaders,
  checkRateLimit,
} from "@/lib/auth/security"
import { executeQuery } from "@/lib/database/connection"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | null = null

  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = await checkRateLimit(clientIP, "signin", 10, 15 * 60 * 1000) // 10 per 15 minutes

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signin attempts. Please try again later." },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: getSecurityHeaders() },
      )
    }

    // Authenticate user
    const user = await authenticateUser(email, password)
    if (!user) {
      // Log failed attempt
      await executeQuery(
        "INSERT INTO audit_logs (action, resource_type, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
        ["signin_failed", "user", JSON.stringify({ email }), clientIP, request.headers.get("user-agent")],
      )

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: getSecurityHeaders() })
    }

    userId = user.id

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in" },
        { status: 403, headers: getSecurityHeaders() },
      )
    }

    // Generate tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Store refresh token
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 7 days
    )

    // Log successful signin
    await executeQuery(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [user.id, "signin_success", "user", user.id, clientIP, request.headers.get("user-agent")],
    )

    // Track performance
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["/api/auth/signin", "POST", responseTime, 200, user.id],
    )

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        accessToken,
      },
      { status: 200, headers: getSecurityHeaders() },
    )

    // Set refresh token as httpOnly cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Signin error:", error)

    // Log error
    if (userId) {
      await executeQuery(
        "INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)",
        [userId, "signin_error", "user", JSON.stringify({ error: error.message }), request.ip],
      ).catch(console.error)
    }

    // Track performance for failed requests
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code) VALUES ($1, $2, $3, $4)",
      ["/api/auth/signin", "POST", responseTime, 500],
    ).catch(console.error)

    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: getSecurityHeaders() })
  }
}
