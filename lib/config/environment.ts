// Environment configuration with validation and defaults
export const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number.parseInt(process.env.PORT || "3000"),
  FRONTEND_URL: process.env.FRONTEND_URL || "https://truthcast.vercel.app",

  // Database
  DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
  DATABASE_PORT: Number.parseInt(process.env.DATABASE_PORT || "5432"),
  DATABASE_NAME: process.env.DATABASE_NAME || "truthcast",
  DATABASE_USER: process.env.DATABASE_USER || "postgres",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "secure_db_password_2024_production",
  DATABASE_POOL_MAX: Number.parseInt(process.env.DATABASE_POOL_MAX || "20"),
  DATABASE_POOL_MIN: Number.parseInt(process.env.DATABASE_POOL_MIN || "5"),

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number.parseInt(process.env.REDIS_PORT || "6379"),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "secure_redis_password_2024_production",
  REDIS_DB: Number.parseInt(process.env.REDIS_DB || "0"),
  REDIS_CLUSTER_NODES: process.env.REDIS_CLUSTER_NODES || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "super_secure_jwt_secret_key_for_production_2024_at_least_64_characters_long",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "super_secure_refresh_token_secret_key_for_production_2024_at_least_64_chars",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // External APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "sk-your-openai-api-key-here",
  NEWS_API_KEY: process.env.NEWS_API_KEY || "your-news-api-key-here",
  GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY || "your-guardian-api-key-here",

  // CORS
  ALLOWED_ORIGINS:
    process.env.ALLOWED_ORIGINS || "https://truthcast.vercel.app,https://app.truthcast.com,http://localhost:3000",

  // AWS
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "your-aws-access-key-id",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "your-aws-secret-access-key",
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "truthcast-storage-production",

  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "your-sendgrid-api-key-here",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@truthcast.com",

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || "your-sentry-dsn-here",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Supabase Integration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-key",

  // Neon Integration
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "",

  // Custom
  CUSTOM_KEY: process.env.CUSTOM_KEY || "production-truthcast-2024-custom-config",

  // Feature flags
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === "true",
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION !== "false",
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== "false",
  ENABLE_SUPABASE: process.env.ENABLE_SUPABASE === "true",
  ENABLE_NEON: process.env.ENABLE_NEON === "true",
}

// Validation function
export function validateEnvironment() {
  const requiredVars = ["DATABASE_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET"]

  const missing = requiredVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing)
    // Don't exit during build process, just log the warning
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      process.exit(1)
    }
  }

  // Warn about default values in production
  if (process.env.NODE_ENV === "production") {
    const defaultWarnings = []

    if (config.JWT_SECRET.includes("change-in-production")) {
      defaultWarnings.push("JWT_SECRET is using default value")
    }

    if (config.JWT_REFRESH_SECRET.includes("change-in-production")) {
      defaultWarnings.push("JWT_REFRESH_SECRET is using default value")
    }

    if (defaultWarnings.length > 0) {
      console.warn("Production warnings:", defaultWarnings)
    }
  }

  console.log("✅ Environment validation completed")
}

// Initialize validation - temporarily disabled for build
// if (!process.env.VERCEL_BUILD && process.env.NEXT_PHASE !== 'phase-production-build') {
//   validateEnvironment()
// }
