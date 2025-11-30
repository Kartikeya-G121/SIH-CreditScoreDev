-- ================================================================================
-- AUDIT LOGS
-- ================================================================================

CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    action_by BIGINT REFERENCES users(user_id),
    action_type VARCHAR(100),
    entity_id BIGINT,
    entity_type VARCHAR(50),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_action_by ON audit_logs(action_by);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE rescore_logs (
    rescore_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    old_score DECIMAL(5,2),
    new_score DECIMAL(5,2),
    triggered_by VARCHAR(50),   -- CRON / SYSTEM / MANUAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rescore_user ON rescore_logs(user_id);
CREATE INDEX idx_rescore_created ON rescore_logs(created_at);

