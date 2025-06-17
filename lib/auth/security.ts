import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { rateLimit } from "express-rate-limit"
import { executeQuery, getCached, setCached } from "../database/connection"
import type { NextRequest } from "next/server"

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex")
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString("hex")
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m"
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d"

export interface User {
  id: string
  email: string
  name: string
  plan: string
  isActive: boolean
  emailVerified: boolean
}

export interface TokenPayload {
  userId: string
  email: string
  plan: string
  type: "access" | "refresh"
  iat: number
  exp: number
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT token generation
export function generateAccessToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    type: "access" as const,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "truthcast",
    audience: "truthcast-api",
  })
}

export function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    type: "refresh" as const,
  }

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: "truthcast",
    audience: "truthcast-api",
  })
}

// Token verification
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "truthcast",
      audience: "truthcast-api",
    }) as TokenPayload

    if (decoded.type !== "access") {
      throw new Error("Invalid token type")
    }

    return decoded
  } catch (error) {
    console.error("Access token verification failed:", error)
    return null
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "truthcast",
      audience: "truthcast-api",
    }) as TokenPayload

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type")
    }

    return decoded
  } catch (error) {
    console.error("Refresh token verification failed:", error)
    return null
  }
}

// Token blacklisting for logout
export async function blacklistToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000)
      if (ttl > 0) {
        await setCached(`blacklist:${token}`, true, ttl)
      }
    }
  } catch (error) {
    console.error("Token blacklisting failed:", error)
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const blacklisted = await getCached(`blacklist:${token}`)
    return blacklisted === true
  } catch (error) {
    console.error("Token blacklist check failed:", error)
    return false
  }
}

// Rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: "Upload limit exceeded, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
})

// Advanced rate limiting with Redis
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}:${endpoint}`
  const window = Math.floor(Date.now() / windowMs)
  const windowKey = `${key}:${window}`

  try {
    const current = (await getCached(windowKey)) || 0
    const remaining = Math.max(0, maxRequests - (current as number) - 1)
    const resetTime = (window + 1) * windowMs

    if (current >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime }
    }

    await setCached(windowKey, (current as number) + 1, Math.ceil(windowMs / 1000))

    return { allowed: true, remaining, resetTime }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs }
  }
}

// User authentication
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const users = await executeQuery(
      "SELECT id, email, password_hash, name, plan, is_active, email_verified FROM users WHERE email = $1 AND is_active = true",
      [email],
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return null
    }

    // Update last login
    await executeQuery("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id])

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      isActive: user.is_active,
      emailVerified: user.email_verified,
    }
  } catch (error) {
    console.error("User authentication failed:", error)
    return null
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return null
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return null
    }

    // Check cache first
    const cacheKey = `user:${payload.userId}`
    let user = await getCached<User>(cacheKey)

    if (!user) {
      const users = await executeQuery(
        "SELECT id, email, name, plan, is_active, email_verified FROM users WHERE id = $1 AND is_active = true",
        [payload.userId],
      )

      if (users.length === 0) {
        return null
      }

      user = {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        plan: users[0].plan,
        isActive: users[0].is_active,
        emailVerified: users[0].email_verified,
      }

      // Cache user for 5 minutes
      await setCached(cacheKey, user, 300)
    }

    return user
  } catch (error) {
    console.error("Get current user failed:", error)
    return null
  }
}

// Input validation and sanitization
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return { valid: errors.length === 0, errors }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS characters
    .substring(0, 1000) // Limit length
}

// API key management
export async function generateApiKey(userId: string, name: string, permissions: string[]): Promise<string> {
  const apiKey = crypto.randomBytes(32).toString("hex")
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  await executeQuery("INSERT INTO api_keys (user_id, key_hash, name, permissions) VALUES ($1, $2, $3, $4)", [
    userId,
    keyHash,
    name,
    JSON.stringify(permissions),
  ])

  return `tc_${apiKey}`
}

export async function verifyApiKey(apiKey: string): Promise<{ userId: string; permissions: string[] } | null> {
  if (!apiKey.startsWith("tc_")) {
    return null
  }

  const key = apiKey.substring(3)
  const keyHash = crypto.createHash("sha256").update(key).digest("hex")

  try {
    const results = await executeQuery(
      "SELECT user_id, permissions FROM api_keys WHERE key_hash = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)",
      [keyHash],
    )

    if (results.length === 0) {
      return null
    }

    // Update last used
    await executeQuery("UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE key_hash = $1", [keyHash])

    return {
      userId: results[0].user_id,
      permissions: results[0].permissions,
    }
  } catch (error) {
    console.error("API key verification failed:", error)
    return null
  }
}

// Security headers
export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:; media-src 'self' blob:;",
  }
}
