-- SQL Schema for CleanAir & Clear Streets
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Use SERIAL PRIMARY KEY for PostgreSQL
    reporter_name VARCHAR(100) NOT NULL,
    reporter_email VARCHAR(100) NOT NULL,
    pollution_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location_name VARCHAR(150),
    latitude REAL,
    longitude REAL,
    image_url TEXT,
    severity VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'Pending',
    assigned_team VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial test report
INSERT INTO reports (reporter_name, reporter_email, pollution_type, description, location_name, severity, assigned_team)
VALUES 
('Aarav Sharma', 'aarav@example.com', 'Garbage Burning', 'Open rubbish combustion near park area.', 'Sector 14 Green Park', 'High', 'Rapid Response Team Alpha');