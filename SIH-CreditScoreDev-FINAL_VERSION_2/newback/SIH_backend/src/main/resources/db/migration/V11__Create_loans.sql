-- ================================================================================
-- LOANS
-- ================================================================================

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
CREATE INDEX idx_loans_application ON loans(application_id);
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date);

