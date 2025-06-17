import { checkDatabaseHealth, checkRedisHealth } from "../database/connection"
import { getQueueStats } from "../queue/processor"
import { logger } from "./logger"

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    queues: ServiceHealth
    external: ServiceHealth
  }
  metrics: {
    responseTime: number
    memoryUsage: NodeJS.MemoryUsage
    uptime: number
  }
}

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy"
  responseTime?: number
  error?: string
  details?: any
}

export class HealthMonitor {
  private lastHealthCheck: HealthStatus | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startPeriodicHealthChecks()
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now()

    try {
      // Check all services in parallel
      const [dbHealth, redisHealth, queueStats] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkQueuesHealth(),
      ])

      const externalHealth = await this.checkExternalServices()

      const responseTime = Date.now() - startTime
      const memoryUsage = process.memoryUsage()
      const uptime = process.uptime()

      const services = {
        database:
          dbHealth.status === "fulfilled" ? dbHealth.value : { status: "unhealthy" as const, error: "Check failed" },
        redis:
          redisHealth.status === "fulfilled"
            ? redisHealth.value
            : { status: "unhealthy" as const, error: "Check failed" },
        queues:
          queueStats.status === "fulfilled"
            ? queueStats.value
            : { status: "unhealthy" as const, error: "Check failed" },
        external: externalHealth,
      }

      // Determine overall status
      const serviceStatuses = Object.values(services).map((s) => s.status)
      const overallStatus = serviceStatuses.includes("unhealthy")
        ? "unhealthy"
        : serviceStatuses.includes("degraded")
          ? "degraded"
          : "healthy"

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services,
        metrics: {
          responseTime,
          memoryUsage,
          uptime,
        },
      }

      this.lastHealthCheck = healthStatus

      // Log health status changes
      if (this.lastHealthCheck?.status !== overallStatus) {
        logger.info("Health status changed", {
          from: this.lastHealthCheck?.status,
          to: overallStatus,
          services: Object.entries(services).filter(([_, service]) => service.status !== "healthy"),
        })
      }

      return healthStatus
    } catch (error) {
      logger.error("Health check failed", { error: error.message })

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: { status: "unhealthy", error: "Health check failed" },
          redis: { status: "unhealthy", error: "Health check failed" },
          queues: { status: "unhealthy", error: "Health check failed" },
          external: { status: "unhealthy", error: "Health check failed" },
        },
        metrics: {
          responseTime: Date.now() - startTime,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        },
      }
    }
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      const isHealthy = await checkDatabaseHealth()
      const responseTime = Date.now() - startTime

      return {
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        ...(responseTime > 1000 && { status: "degraded" }),
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  private async checkRedisHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      const isHealthy = await checkRedisHealth()
      const responseTime = Date.now() - startTime

      return {
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        ...(responseTime > 500 && { status: "degraded" }),
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  private async checkQueuesHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()

    try {
      const stats = await getQueueStats()
      const responseTime = Date.now() - startTime

      // Check for queue backlogs
      const hasBacklog = Object.values(stats).some(
        (queueStats: any) => queueStats.waiting > 100 || queueStats.failed > 10,
      )

      return {
        status: hasBacklog ? "degraded" : "healthy",
        responseTime,
        details: stats,
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  private async checkExternalServices(): Promise<ServiceHealth> {
    // Check external API availability
    const checks = [
      this.checkOpenAI(),
      this.checkNewsAPI(),
      // Add more external service checks as needed
    ]

    const results = await Promise.allSettled(checks)
    const failures = results.filter((r) => r.status === "rejected").length

    if (failures === 0) {
      return { status: "healthy" }
    } else if (failures < checks.length) {
      return { status: "degraded", details: { failures, total: checks.length } }
    } else {
      return { status: "unhealthy", details: { failures, total: checks.length } }
    }
  }

  private async checkOpenAI(): Promise<void> {
    // Simple connectivity check to OpenAI API
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`OpenAI API check failed: ${response.status}`)
    }
  }

  private async checkNewsAPI(): Promise<void> {
    // Simple connectivity check to News API
    if (!process.env.NEWS_API_KEY) return // Skip if not configured

    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`News API check failed: ${response.status}`)
    }
  }

  private startPeriodicHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth()
      } catch (error) {
        logger.error("Periodic health check failed", { error: error.message })
      }
    }, 30000)
  }

  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
}

export const healthMonitor = new HealthMonitor()
