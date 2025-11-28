-- ================================================================================
-- LOAN APPLICATIONS
-- ================================================================================

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
CREATE INDEX idx_app_group ON loan_applications(group_id);
CREATE INDEX idx_app_scheme ON loan_applications(scheme_id);

