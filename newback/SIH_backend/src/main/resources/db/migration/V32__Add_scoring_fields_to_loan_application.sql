ALTER TABLE loan_applications
ADD COLUMN risk_score DECIMAL(5, 2),
ADD COLUMN risk_bucket VARCHAR(20),
ADD COLUMN income_bucket VARCHAR(20),
ADD COLUMN income_confidence DECIMAL(5, 2),
ADD COLUMN credit_score_composite VARCHAR(20),
ADD COLUMN auto_sanction_reason TEXT;
