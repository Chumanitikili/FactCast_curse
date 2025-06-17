import { execSync } from "child_process"
import { writeFileSync, existsSync } from "fs"
import crypto from "crypto"

console.log("🚀 Setting up TruthCast for production...\n")

// Generate secure secrets
function generateSecret(length = 64): string {
  return crypto.randomBytes(length).toString("hex")
}

// Check if .env file exists
if (!existsSync(".env")) {
  console.log("📝 Creating .env file with secure defaults...")

  const envContent = `# TruthCast Production Environment Configuration
# Generated on ${new Date().toISOString()}

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=truthcast
DATABASE_USER=postgres
DATABASE_PASSWORD=${generateSecret(32)}
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${generateSecret(32)}
REDIS_DB=0
REDIS_CLUSTER_NODES=

# JWT Configuration (CRITICAL: Change these in production)
JWT_SECRET=${generateSecret(64)}
JWT_REFRESH_SECRET=${generateSecret(64)}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External API Keys (Add your actual keys)
OPENAI_API_KEY=sk-your-openai-api-key-here
NEWS_API_KEY=your-news-api-key-here
GUARDIAN_API_KEY=your-guardian-api-key-here

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com

# AWS Configuration (Add your actual credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET_NAME=truthcast-storage-${Date.now()}

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@your-domain.com

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=info

# Custom Configuration
CUSTOM_KEY=production-${generateSecret(16)}

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_RATE_LIMITING=true
`

  writeFileSync(".env", envContent)
  console.log("✅ .env file created with secure random secrets")
} else {
  console.log("⚠️  .env file already exists, skipping creation")
}

// Install production dependencies
console.log("\n📦 Installing production dependencies...")
try {
  execSync("npm install --production", { stdio: "inherit" })
  console.log("✅ Dependencies installed")
} catch (error) {
  console.error("❌ Failed to install dependencies:", error)
}

// Build the application
console.log("\n🔨 Building application for production...")
try {
  execSync("npm run build", { stdio: "inherit" })
  console.log("✅ Application built successfully")
} catch (error) {
  console.error("❌ Build failed:", error)
}

console.log("\n🎉 Production setup complete!")
console.log("\n📋 Next steps:")
console.log("1. Update the .env file with your actual API keys and credentials")
console.log("2. Set up your PostgreSQL database and run the database scripts")
console.log("3. Set up Redis for caching and session management")
console.log("4. Configure your AWS S3 bucket for file storage")
console.log("5. Set up your domain and SSL certificates")
console.log("6. Deploy using Docker Compose or your preferred method")
console.log("\n🔒 Security reminders:")
console.log("- Change all default passwords and secrets")
console.log("- Enable firewall rules for database and Redis")
console.log("- Set up monitoring and alerting")
console.log("- Configure backup strategies")
console.log("- Review and test all security configurations")
