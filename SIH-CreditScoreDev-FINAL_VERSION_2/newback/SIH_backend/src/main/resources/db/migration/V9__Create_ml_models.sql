-- ================================================================================
-- ML MODELS
-- ================================================================================

CREATE TABLE ml_models (
    model_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200),
    version VARCHAR(50),
    type VARCHAR(50),
    trained_on DATE,
    metrics JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_models_active ON ml_models(is_active);
CREATE INDEX idx_models_type ON ml_models(type);

