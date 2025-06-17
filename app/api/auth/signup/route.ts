import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database/connection"
import { hashPassword, validateEmail, validatePassword, sanitizeInput, getSecurityHeaders } from "@/lib/auth/security"
import { checkRateLimit } from "@/lib/auth/security"
import { emailQueue } from "@/lib/queue/processor"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | null = null

  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = await checkRateLimit(clientIP, "signup", 5, 15 * 60 * 1000) // 5 per 15 minutes

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
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
    const { email, password, name, plan = "free" } = body

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400, headers: getSecurityHeaders() },
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers: getSecurityHeaders() })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "Password validation failed", details: passwordValidation.errors },
        { status: 400, headers: getSecurityHeaders() },
      )
    }

    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeInput(email.toLowerCase())

    // Check if user already exists
    const existingUsers = await executeQuery("SELECT id FROM users WHERE email = $1", [sanitizedEmail])

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409, headers: getSecurityHeaders() },
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex")

    // Create user
    const users = await executeQuery(
      `INSERT INTO users (email, password_hash, name, plan, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP) 
       RETURNING id, email, name, plan, is_active, email_verified`,
      [sanitizedEmail, passwordHash, sanitizedName, plan],
    )

    userId = users[0].id

    // Store verification token
    await executeQuery(
      "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [userId, emailVerificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000)], // 24 hours
    )

    // Send verification email
    await emailQueue.add("email-verification", {
      to: sanitizedEmail,
      template: "email-verification",
      data: {
        name: sanitizedName,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
      },
    })

    // Log audit event
    await executeQuery(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, "user_signup", "user", userId, clientIP, request.headers.get("user-agent")],
    )

    // Track performance
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["/api/auth/signup", "POST", responseTime, 201, userId],
    )

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email for verification.",
        user: {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          plan: users[0].plan,
          emailVerified: users[0].email_verified,
        },
      },
      { status: 201, headers: getSecurityHeaders() },
    )
  } catch (error) {
    console.error("Signup error:", error)

    // Log error
    if (userId) {
      await executeQuery(
        "INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)",
        [userId, "signup_error", "user", JSON.stringify({ error: error.message }), request.ip],
      ).catch(console.error)
    }

    // Track performance for failed requests
    const responseTime = Date.now() - startTime
    await executeQuery(
      "INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code) VALUES ($1, $2, $3, $4)",
      ["/api/auth/signup", "POST", responseTime, 500],
    ).catch(console.error)

    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: getSecurityHeaders() })
  }
}
