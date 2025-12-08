-- ================================================================================
-- REPAYMENTS
-- ================================================================================

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
CREATE INDEX idx_repay_due_date ON repayments(due_date);
CREATE INDEX idx_repay_paid_date ON repayments(paid_date);
CREATE INDEX idx_repay_on_time ON repayments(is_on_time);

