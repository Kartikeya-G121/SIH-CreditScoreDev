ALTER TABLE loan_schemes
ADD COLUMN min_age INTEGER,
ADD COLUMN max_age INTEGER,
ADD COLUMN gender_allowed VARCHAR(20),
ADD COLUMN caste_category VARCHAR(50),
ADD COLUMN income_max DECIMAL(15, 2),
ADD COLUMN max_existing_loans INTEGER DEFAULT 1,

ADD COLUMN is_subsidy BOOLEAN DEFAULT FALSE,
ADD COLUMN subsidy_type VARCHAR(20),
ADD COLUMN subsidy_percentage DECIMAL(5, 2),

ADD COLUMN grace_period_days INTEGER DEFAULT 0,
ADD COLUMN penalty_rate DECIMAL(5, 2),
ADD COLUMN emi_bounce_charges DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN allow_prepayment BOOLEAN DEFAULT TRUE,
ADD COLUMN prepayment_penalty DECIMAL(5, 2) DEFAULT 0,

ADD COLUMN is_group_loan_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN created_by VARCHAR(100);
