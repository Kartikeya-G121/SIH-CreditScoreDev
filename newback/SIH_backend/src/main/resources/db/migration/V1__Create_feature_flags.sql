-- ================================================================================
-- FEATURE FLAGS (Fail-safe global toggles)
-- ================================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_name VARCHAR(100) PRIMARY KEY,
    flag_value BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO feature_flags(flag_name, flag_value, description) VALUES
('verification_engine_enabled', FALSE, 'Bill verification ML'),
('autosanction_enabled', FALSE, 'Auto digital sanctioning'),
('voice_interaction_enabled', FALSE, 'Voice interaction'),
('rescore_cron_enabled', FALSE, 'Auto periodic re-scoring'),
('s3_enabled', FALSE, 'Document storage via S3')
ON CONFLICT(flag_name) DO NOTHING;

