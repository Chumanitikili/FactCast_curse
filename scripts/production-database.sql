-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table with proper indexing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'professional', 'enterprise')),
    monthly_usage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Podcasts table with partitioning by date
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    audio_url VARCHAR(1000),
    audio_size BIGINT,
    duration INTEGER NOT NULL, -- in seconds
    status VARCHAR(20) DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for podcasts (2024-2025)
CREATE TABLE IF NOT EXISTS podcasts_2024_01 PARTITION OF podcasts FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_02 PARTITION OF podcasts FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_03 PARTITION OF podcasts FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_04 PARTITION OF podcasts FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_05 PARTITION OF podcasts FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_06 PARTITION OF podcasts FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_07 PARTITION OF podcasts FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_08 PARTITION OF podcasts FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_09 PARTITION OF podcasts FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_10 PARTITION OF podcasts FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_11 PARTITION OF podcasts FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS podcasts_2024_12 PARTITION OF podcasts FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_01 PARTITION OF podcasts FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_02 PARTITION OF podcasts FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_03 PARTITION OF podcasts FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_04 PARTITION OF podcasts FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_05 PARTITION OF podcasts FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_06 PARTITION OF podcasts FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_07 PARTITION OF podcasts FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_08 PARTITION OF podcasts FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_09 PARTITION OF podcasts FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_10 PARTITION OF podcasts FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_11 PARTITION OF podcasts FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE IF NOT EXISTS podcasts_2025_12 PARTITION OF podcasts FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    settings JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    total_duration INTEGER DEFAULT 0,
    total_fact_checks INTEGER DEFAULT 0
);

-- Transcript segments table with partitioning
CREATE TABLE IF NOT EXISTS transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    speaker VARCHAR(100),
    text TEXT NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for transcript segments
CREATE TABLE IF NOT EXISTS transcript_segments_2024_q4 PARTITION OF transcript_segments FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS transcript_segments_2025_q1 PARTITION OF transcript_segments FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS transcript_segments_2025_q2 PARTITION OF transcript_segments FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS transcript_segments_2025_q3 PARTITION OF transcript_segments FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS transcript_segments_2025_q4 PARTITION OF transcript_segments FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Sources table with full-text search
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(1000) NOT NULL,
    url VARCHAR(2000) UNIQUE NOT NULL,
    domain VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('news', 'academic', 'government', 'blog', 'social', 'other')),
    political_lean VARCHAR(20) DEFAULT 'unknown' CHECK (political_lean IN ('left', 'center', 'right', 'unknown')),
    reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact check results table with partitioning
CREATE TABLE IF NOT EXISTS fact_check_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
    podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES transcript_segments(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    verdict VARCHAR(20) CHECK (verdict IN ('verified', 'disputed', 'unverified', 'mixed')),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    ai_summary TEXT,
    processing_time_ms INTEGER,
    is_flagged BOOLEAN DEFAULT false,
    user_correction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for fact check results
CREATE TABLE IF NOT EXISTS fact_check_results_2024_q4 PARTITION OF fact_check_results FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS fact_check_results_2025_q1 PARTITION OF fact_check_results FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS fact_check_results_2025_q2 PARTITION OF fact_check_results FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS fact_check_results_2025_q3 PARTITION OF fact_check_results FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS fact_check_results_2025_q4 PARTITION OF fact_check_results FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Perspectives table
CREATE TABLE IF NOT EXISTS perspectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_check_id UUID REFERENCES fact_check_results(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    stance VARCHAR(20) CHECK (stance IN ('supports', 'disputes', 'neutral')),
    explanation TEXT NOT NULL,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    excerpt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP or user ID
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint, window_start)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create audit log partitions
CREATE TABLE IF NOT EXISTS audit_logs_2024_q4 PARTITION OF audit_logs FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_q1 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_q2 PARTITION OF audit_logs FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_q3 PARTITION OF audit_logs FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS audit_logs_2025_q4 PARTITION OF audit_logs FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create performance metrics partitions
CREATE TABLE IF NOT EXISTS performance_metrics_2024_q4 PARTITION OF performance_metrics FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS performance_metrics_2025_q1 PARTITION OF performance_metrics FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS performance_metrics_2025_q2 PARTITION OF performance_metrics FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS performance_metrics_2025_q3 PARTITION OF performance_metrics FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS performance_metrics_2025_q4 PARTITION OF performance_metrics FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create analytics partitions
CREATE TABLE IF NOT EXISTS analytics_events_2024_q4 PARTITION OF analytics_events FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q1 PARTITION OF analytics_events FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q2 PARTITION OF analytics_events FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q3 PARTITION OF analytics_events FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q4 PARTITION OF analytics_events FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_live_sessions_user_id ON live_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_segments_session_id ON transcript_segments(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_segments_podcast_id ON transcript_segments(podcast_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_segments_timestamp ON transcript_segments(timestamp_ms);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_domain ON sources(domain);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_active ON sources(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_check_results_session_id ON fact_check_results(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_check_results_podcast_id ON fact_check_results(podcast_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_check_results_verdict ON fact_check_results(verdict);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_check_results_flagged ON fact_check_results(is_flagged) WHERE is_flagged = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perspectives_fact_check_id ON perspectives(fact_check_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perspectives_source_id ON perspectives(source_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_identifier_endpoint ON rate_limits(identifier, endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sources_title_fts ON sources USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_segments_text_fts ON transcript_segments USING gin(to_tsvector('english', text));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_podcasts_user_status_created ON podcasts(user_id, status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fact_check_results_session_created ON fact_check_results(session_id, created_at);

-- Functions for automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_podcasts_updated_at ON podcasts;
CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON podcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean rate limits older than 1 hour
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Clean performance metrics older than 30 days
    DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Archive audit logs older than 1 year
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Clean expired email verification tokens
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();
    
    -- Clean expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO users (email, password_hash, name, plan, email_verified) VALUES 
('demo@truthcast.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', 'Demo User', 'creator', true),
('test@truthcast.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', 'Test User', 'free', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO sources (title, url, domain, source_type, political_lean, reliability_score) VALUES
('NASA Official Website', 'https://www.nasa.gov', 'nasa.gov', 'government', 'center', 95),
('BBC News', 'https://www.bbc.com/news', 'bbc.com', 'news', 'center', 90),
('Reuters', 'https://www.reuters.com', 'reuters.com', 'news', 'center', 92),
('Associated Press', 'https://apnews.com', 'apnews.com', 'news', 'center', 94),
('Nature Journal', 'https://www.nature.com', 'nature.com', 'academic', 'center', 96),
('Science Magazine', 'https://www.science.org', 'science.org', 'academic', 'center', 95),
('World Health Organization', 'https://www.who.int', 'who.int', 'government', 'center', 93),
('Centers for Disease Control', 'https://www.cdc.gov', 'cdc.gov', 'government', 'center', 94)
ON CONFLICT (url) DO NOTHING;

-- Performance optimization settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Analyze tables for query optimization
ANALYZE;

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE 'TruthCast production database setup completed successfully!';
    RAISE NOTICE 'Tables created: %, Indexes: %, Partitions: %', 
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public'),
        (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%_202%');
END $$;
