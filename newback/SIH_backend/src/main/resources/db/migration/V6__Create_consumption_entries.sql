-- ================================================================================
-- CONSUMPTION ENTRIES
-- ================================================================================

CREATE TABLE consumption_entries (
    entry_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    
    data_source VARCHAR(50) NOT NULL, -- 'ELECTRICITY', 'WATER', 'MOBILE'
    
    -- Extracted Data
    billing_amount DECIMAL(12, 2),
    billing_date DATE,
    units_consumed DECIMAL(10, 2),
    
    -- Metadata & Fraud
    upload_metadata JSONB DEFAULT '{}'::jsonb,
    document_hash VARCHAR(128),
    is_tampered_flag BOOLEAN DEFAULT FALSE,
    tamper_reason TEXT,
    is_imputed BOOLEAN DEFAULT FALSE,
    
    -- Verification
    verification_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    verification_source VARCHAR(50) DEFAULT 'NONE',
    verification_confidence DECIMAL(5,2) DEFAULT 0.0,
    verified_by BIGINT REFERENCES users(user_id),
    
    -- Storage
    storage_type VARCHAR(20) DEFAULT 'S3',
    file_s3_url TEXT,
    file_blob BYTEA,
    file_mime_type VARCHAR(100),
    file_size BIGINT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consumption_user_date ON consumption_entries(user_id, billing_date);
CREATE INDEX idx_consumption_status ON consumption_entries(verification_status);
CREATE INDEX idx_consumption_source ON consumption_entries(data_source);
CREATE INDEX idx_consumption_tampered ON consumption_entries(is_tampered_flag);

