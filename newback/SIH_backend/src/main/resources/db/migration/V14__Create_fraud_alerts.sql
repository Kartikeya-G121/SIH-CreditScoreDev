-- ================================================================================
-- FRAUD ALERTS
-- ================================================================================

CREATE TABLE fraud_alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    
    source_table VARCHAR(50),      -- consumption_entries
    source_id BIGINT,
    
    alert_type VARCHAR(100),       -- PATTERN_DEVIATION
    severity VARCHAR(20),          -- HIGH, MEDIUM, LOW
    description TEXT,
    
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_comments TEXT,
    resolver_id BIGINT REFERENCES users(user_id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_user ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_status ON fraud_alerts(is_resolved);
CREATE INDEX idx_fraud_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_source ON fraud_alerts(source_table, source_id);

