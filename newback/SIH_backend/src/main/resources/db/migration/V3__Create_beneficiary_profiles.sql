-- ================================================================================
-- BENEFICIARY PROFILES
-- ================================================================================

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
CREATE INDEX idx_benef_verified ON beneficiary_profiles(is_profile_verified);

