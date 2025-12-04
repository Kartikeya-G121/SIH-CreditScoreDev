-- Add provider_name and loan_category columns to loan_schemes table
-- Migration for Scheme Module Enhancement

ALTER TABLE loan_schemes
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS loan_category VARCHAR(100);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schemes_provider ON loan_schemes(provider_name);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON loan_schemes(loan_category);

-- Add comments for documentation
COMMENT ON COLUMN loan_schemes.provider_name IS 'Name of the loan provider/institution offering this scheme';
COMMENT ON COLUMN loan_schemes.loan_category IS 'Category of the loan (e.g., Agriculture, Education, Business, Housing)';
