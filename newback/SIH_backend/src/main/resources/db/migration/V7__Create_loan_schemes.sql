-- ================================================================================
-- LOAN SCHEMES
-- ================================================================================

CREATE TABLE loan_schemes (
    scheme_id SERIAL PRIMARY KEY,
    scheme_name VARCHAR(100) NOT NULL,
    min_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    base_interest_rate DECIMAL(5,2),
    min_tenure_months INT,
    max_tenure_months INT,
    
    is_tiered_interest BOOLEAN DEFAULT FALSE,
    tier_threshold DECIMAL(15,2),
    tier_interest_rate DECIMAL(5,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schemes_active ON loan_schemes(is_active);

