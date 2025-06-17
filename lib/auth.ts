import type { NextRequest } from "next/server"
import { db } from "./database"
import type { User } from "./types"

// Simple JWT-like token simulation (in production, use proper JWT)
export function generateToken(user: User): string {
  return btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 24 * 60 * 60 * 1000 }))
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.exp < Date.now()) {
      return null
    }
    return { id: decoded.id, email: decoded.email }
  } catch {
    return null
  }
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  return await db.users.findById(decoded.id)
}

export function checkUsageLimit(user: User, additionalMinutes: number): boolean {
  const limits = {
    free: 30,
    creator: 600, // 10 hours
    professional: 3000, // 50 hours
  }

  return user.monthlyUsage + additionalMinutes <= limits[user.plan]
}
