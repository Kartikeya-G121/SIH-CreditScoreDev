-- ================================================================================
-- MASTER DATABASE SCHEMA (FINAL & EXHAUSTIVE)
-- ================================================================================

-- 0. FEATURE FLAGS (Fail-safe global toggles)
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

-- 1. USERS & AUTH
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    keycloak_user_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Fallback
    role VARCHAR(50) DEFAULT 'BENEFICIARY', -- ENUM: 'BENEFICIARY', 'LOAN_OFFICER', 'ADMIN', 'AUDITOR'
    is_active BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    
    -- Password Reset
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_keycloak ON users(keycloak_user_id);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);

-- 2. BENEFICIARY PROFILES
CREATE TABLE beneficiary_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    
    full_name VARCHAR(255) NOT NULL,
    caste_category VARCHAR(50), -- 'SC', 'ST', 'OBC', 'GEN'
    caste_certificate_url TEXT,
    dob DATE,
    gender VARCHAR(20),
    
    -- Location
    address_line TEXT,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    region_type VARCHAR(20), -- 'RURAL', 'URBAN'
    geo_lat DECIMAL(10, 8),
    geo_long DECIMAL(11, 8),
    
    -- Financial Metrics
    literacy_score INT DEFAULT 0,
    verified_annual_income DECIMAL(15,2) DEFAULT 0.00,
    is_profile_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT REFERENCES users(user_id),
    
    -- Storage
    certificate_storage_type VARCHAR(20) DEFAULT 'S3',
    certificate_blob BYTEA,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_benef_user ON beneficiary_profiles(user_id);
CREATE INDEX idx_benef_geo ON beneficiary_profiles(state, district, pincode);

-- 3. GROUP LOAN MODULE
CREATE TABLE borrower_groups (
    group_id BIGSERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    formation_date DATE,
    project_description TEXT,
    created_by_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    group_score DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_creator ON borrower_groups(created_by_user_id);

CREATE TABLE group_members (
    member_id BIGSERIAL PRIMARY KEY,
    group_id BIGINT REFERENCES borrower_groups(group_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    role VARCHAR(50) DEFAULT 'MEMBER', -- 'LEADER', 'MEMBER'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    joined_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);

-- 4. REGIONAL COST PARAMETERS
CREATE TABLE regional_parameters (
    region_id SERIAL PRIMARY KEY,
    state VARCHAR(100),
    region_type VARCHAR(20), -- 'RURAL', 'URBAN'
    cost_adjustment_factor DECIMAL(5,4), -- e.g., 1.10 for +10%
    last_updated DATE
);

-- 5. CONSUMPTION ENTRIES
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

-- 6. LOAN SCHEMES
CREATE TABLE loan_schemes (
    scheme_id SERIAL PRIMARY KEY,
    scheme_name VARCHAR(100) NOT NULL,
    min_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    base_interest_rate DECIMAL(5,2),
    tenure_months INT,
    
    is_tiered_interest BOOLEAN DEFAULT FALSE,
    tier_threshold DECIMAL(15,2),
    tier_interest_rate DECIMAL(5,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. LOAN APPLICATIONS
CREATE TABLE loan_applications (
    application_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    group_id BIGINT REFERENCES borrower_groups(group_id) ON DELETE SET NULL,
    scheme_id INT REFERENCES loan_schemes(scheme_id),
    
    requested_amount DECIMAL(15,2) NOT NULL,
    purpose TEXT,
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'SCORING', 'APPROVED', 'REJECTED', 'SANCTIONED', 'WITHDRAWN'
    rejection_reason TEXT,
    stage_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    sanctioned_amount DECIMAL(15,2),
    final_interest_rate DECIMAL(5,2),
    sanctioned_by BIGINT REFERENCES users(user_id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_user ON loan_applications(user_id);
CREATE INDEX idx_app_status ON loan_applications(status);

-- 8. ML MODELS
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

-- 9. SCORING & ASSESSMENT
CREATE TABLE credit_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES loan_applications(application_id) ON DELETE CASCADE,
    
    raw_income_score DECIMAL(5,2),
    adjusted_income_score DECIMAL(5,2),
    credit_risk_score DECIMAL(5,2),
    composite_score DECIMAL(5,2),
    
    risk_band VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
    eligibility_status VARCHAR(20),
    
    explainability_data JSONB DEFAULT '{}'::jsonb,
    explainability_summary TEXT,
    
    model_id BIGINT REFERENCES ml_models(model_id),
    
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_app ON credit_assessments(application_id);

-- 10. LOANS
CREATE TABLE loans (
    loan_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES loan_applications(application_id) ON DELETE RESTRICT,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    
    total_principal DECIMAL(15,2) NOT NULL,
    total_interest DECIMAL(15,2) NOT NULL,
    monthly_emi DECIMAL(10,2),
    
    outstanding_principal DECIMAL(15,2),
    outstanding_interest DECIMAL(15,2),
    
    start_date DATE,
    end_date DATE,
    loan_status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'CLOSED', 'DEFAULTED', 'FORECLOSED', 'WAIVED_OFF'
    next_payment_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(loan_status);

-- 11. REPAYMENTS
CREATE TABLE repayments (
    repayment_id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT REFERENCES loans(loan_id) ON DELETE CASCADE,
    
    due_date DATE,
    paid_date DATE,
    
    amount_due DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    
    payment_mode VARCHAR(50),
    transaction_ref VARCHAR(100),
    delay_days INT DEFAULT 0,
    
    is_on_time BOOLEAN GENERATED ALWAYS AS (delay_days <= 0) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repay_loan ON repayments(loan_id);

-- 12. VOICE INTERACTIONS
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

-- 13. FRAUD ALERTS
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

-- 14. AUDIT LOGS
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

CREATE TABLE rescore_logs (
    rescore_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    old_score DECIMAL(5,2),
    new_score DECIMAL(5,2),
    triggered_by VARCHAR(50),   -- CRON / SYSTEM / MANUAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
