import { Pool, type PoolClient } from "pg"
import Redis from "ioredis"
import { config } from "../config/environment"

// Database connection pool configuration
const dbConfig = {
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  database: config.DATABASE_NAME,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,

  // Connection pool settings for high concurrency
  max: config.DATABASE_POOL_MAX,
  min: config.DATABASE_POOL_MIN,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,

  // Query timeout
  query_timeout: 30000,
  statement_timeout: 30000,
}

// Redis configuration for caching and sessions
const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,

  // Connection pool settings
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxLoadingTimeout: 5000,

  // Cluster support for production
  ...(config.REDIS_CLUSTER_NODES && {
    enableOfflineQueue: false,
    redisOptions: {
      password: config.REDIS_PASSWORD,
    },
  }),
}

// Create connection pools
export const db = new Pool(dbConfig)

// Only create Redis connection if not in build process
let redis: Redis | Redis.Cluster | null = null
if (!process.env.VERCEL_BUILD && process.env.NEXT_PHASE !== 'phase-production-build') {
  redis = config.REDIS_CLUSTER_NODES
    ? new Redis.Cluster(config.REDIS_CLUSTER_NODES.split(","), redisConfig)
    : new Redis(redisConfig)
}
export { redis }

// Health check functions
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await db.connect()
    await client.query("SELECT 1")
    client.release()
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis health check failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  try {
    await db.end()
    await redis.quit()
    console.log("Database connections closed gracefully")
  } catch (error) {
    console.error("Error closing connections:", error)
  }
}

// Connection monitoring
db.on("connect", () => {
  console.log("New database connection established")
})

db.on("error", (err) => {
  console.error("Database connection error:", err)
})

if (redis) {
  redis.on("connect", () => {
    console.log("Redis connection established")
  })

  redis.on("error", (err) => {
    console.error("Redis connection error:", err)
  })
}

// Query helper with automatic retries and logging
export async function executeQuery<T = unknown>(query: string, params: unknown[] = [], retries = 3): Promise<T[]> {
  let client: PoolClient | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      client = await db.connect()
      const start = Date.now()
      const result = await client.query(query, params)
      const duration = Date.now() - start

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, query.substring(0, 100))
      }

      return result.rows
    } catch (error) {
      console.error(`Query attempt ${attempt} failed:`, error)

      if (attempt === retries) {
        throw error
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100))
    } finally {
      if (client) {
        client.release()
      }
    }
  }

  throw new Error("All query attempts failed")
}

// Transaction helper
export async function executeTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Cache helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error("Cache get error:", error)
    return null
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error("Cache set error:", error)
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error("Cache delete error:", error)
  }
}
