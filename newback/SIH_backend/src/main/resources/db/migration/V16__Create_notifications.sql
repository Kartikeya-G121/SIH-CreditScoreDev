-- ================================================================================
-- NOTIFICATIONS
-- ================================================================================

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    channel VARCHAR(20),          -- SMS / EMAIL / WHATSAPP / PUSH
    template_key VARCHAR(100),    -- EMI_DUE, LOAN_APPROVED...
    payload JSONB,                -- dynamic data
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SENT, FAILED
    provider_response TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notify_user ON notifications(user_id);
CREATE INDEX idx_notify_status ON notifications(status);
CREATE INDEX idx_notify_read ON notifications(is_read);
CREATE INDEX idx_notify_channel ON notifications(channel);
CREATE INDEX idx_notify_created ON notifications(created_at);

