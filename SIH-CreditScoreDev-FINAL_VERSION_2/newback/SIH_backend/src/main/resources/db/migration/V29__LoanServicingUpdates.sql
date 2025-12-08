-- Update loans table
ALTER TABLE loans 
    ADD COLUMN disbursed_amount DECIMAL(15,2),
    ADD COLUMN disbursement_date DATE,
    ADD COLUMN original_tenure_months INTEGER,
    ADD COLUMN dpd INTEGER DEFAULT 0,
    ADD COLUMN risk_bucket VARCHAR(20) DEFAULT 'CURRENT',
    ADD COLUMN penal_interest_rate DECIMAL(5,2),
    ADD COLUMN outstanding_penalty DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN prepayment_penalty_rate DECIMAL(5,2),
    ADD COLUMN foreclosure_allowed BOOLEAN DEFAULT TRUE,
    ADD COLUMN foreclosure_penalty_rate DECIMAL(5,2),
    ADD COLUMN last_accrual_date DATE;

-- Update repayments table
ALTER TABLE repayments
    ADD COLUMN penalty_component DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN other_charges DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN schedule_version INTEGER DEFAULT 1,
    ADD COLUMN is_projected BOOLEAN DEFAULT TRUE;

-- Create loan_transactions table
CREATE TABLE loan_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    txn_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_component DECIMAL(15,2) DEFAULT 0,
    interest_component DECIMAL(15,2) DEFAULT 0,
    penalty_component DECIMAL(15,2) DEFAULT 0,
    charges_component DECIMAL(15,2) DEFAULT 0,
    applied_installments_json TEXT,
    payment_mode VARCHAR(50),
    external_ref VARCHAR(100),
    value_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_transaction_loan FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

CREATE INDEX idx_txn_loan ON loan_transactions(loan_id);
CREATE INDEX idx_txn_date ON loan_transactions(value_date);
CREATE INDEX idx_txn_type ON loan_transactions(txn_type);
