-- ================================================================================
-- VOICE INTERACTIONS
-- ================================================================================

CREATE TABLE voice_interactions (
    interaction_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    
    audio_url TEXT,
    transcribed_text TEXT,
    intent_detected VARCHAR(100),
    action_taken JSONB,
    
    storage_type VARCHAR(20) DEFAULT 'S3',
    audio_blob BYTEA,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_user ON voice_interactions(user_id);
CREATE INDEX idx_voice_intent ON voice_interactions(intent_detected);
CREATE INDEX idx_voice_created ON voice_interactions(created_at);

