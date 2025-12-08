-- ================================================================================
-- USERS & AUTH
-- ================================================================================

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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);

