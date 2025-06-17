import { config } from "../config/environment"

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  meta?: any
  userId?: string
  requestId?: string
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = this.getLogLevel(config.LOG_LEVEL)
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR
      case "warn":
        return LogLevel.WARN
      case "info":
        return LogLevel.INFO
      case "debug":
        return LogLevel.DEBUG
      default:
        return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatLog(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    }
  }

  private output(logEntry: LogEntry): void {
    if (config.NODE_ENV === "production") {
      // In production, output structured JSON logs
      console.log(JSON.stringify(logEntry))
    } else {
      // In development, output human-readable logs
      const { timestamp, level, message, meta } = logEntry
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : ""
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`)
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLog("error", message, meta))
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog("warn", message, meta))
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog("info", message, meta))
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog("debug", message, meta))
    }
  }

  // Specialized logging methods
  apiRequest(method: string, path: string, userId?: string, duration?: number): void {
    this.info("API Request", {
      method,
      path,
      userId,
      duration,
      type: "api_request",
    })
  }

  apiError(method: string, path: string, error: Error, userId?: string): void {
    this.error("API Error", {
      method,
      path,
      error: error.message,
      stack: error.stack,
      userId,
      type: "api_error",
    })
  }

  databaseQuery(query: string, duration: number, error?: Error): void {
    if (error) {
      this.error("Database Query Failed", {
        query: query.substring(0, 100),
        duration,
        error: error.message,
        type: "database_error",
      })
    } else if (duration > 1000) {
      this.warn("Slow Database Query", {
        query: query.substring(0, 100),
        duration,
        type: "slow_query",
      })
    } else {
      this.debug("Database Query", {
        query: query.substring(0, 100),
        duration,
        type: "database_query",
      })
    }
  }

  security(event: string, details: any, userId?: string): void {
    this.warn("TruthCast Security Event", {
      event,
      details,
      userId,
      type: "security",
      application: "truthcast",
    })
  }

  performance(metric: string, value: number, unit = "ms"): void {
    this.info("Performance Metric", {
      metric,
      value,
      unit,
      type: "performance",
    })
  }
}

export const logger = new Logger()
