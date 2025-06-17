-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'professional')),
    monthly_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Podcasts table
CREATE TABLE podcasts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500) NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    status VARCHAR(20) DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sources table
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    reliability INTEGER CHECK (reliability >= 0 AND reliability <= 100)
);

-- Fact check results table
CREATE TABLE fact_check_results (
    id SERIAL PRIMARY KEY,
    podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL, -- in seconds
    claim TEXT NOT NULL,
    verdict VARCHAR(20) CHECK (verdict IN ('true', 'false', 'unverified', 'misleading')),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for fact check results and sources (many-to-many)
CREATE TABLE fact_check_sources (
    fact_check_id INTEGER REFERENCES fact_check_results(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
    PRIMARY KEY (fact_check_id, source_id)
);

-- Indexes for better performance
CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_fact_check_results_podcast_id ON fact_check_results(podcast_id);
CREATE INDEX idx_users_email ON users(email);

-- Sample data
INSERT INTO users (email, name, plan) VALUES 
('demo@example.com', 'Demo User', 'creator'),
('test@example.com', 'Test User', 'free');

INSERT INTO sources (title, url, domain, reliability) VALUES
('NASA: Great Wall of China Not Visible from Space', 'https://www.nasa.gov/vision/space/workinginspace/great_wall.html', 'nasa.gov', 95),
('IEA Global Energy Review 2024', 'https://www.iea.org/reports/global-energy-review-2024', 'iea.org', 92),
('Scientific American Climate Data', 'https://www.scientificamerican.com/climate-change', 'scientificamerican.com', 88);
