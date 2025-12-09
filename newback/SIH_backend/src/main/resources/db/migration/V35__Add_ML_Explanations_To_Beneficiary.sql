-- Add ML explanations JSON column to beneficiary_profiles table
-- This will store detailed explanations from ML models including risk factors, income predictions, and score breakdowns

ALTER TABLE beneficiary_profiles
ADD COLUMN IF NOT EXISTS ml_explanations JSONB;

-- Add comment to explain the column purpose
COMMENT ON COLUMN beneficiary_profiles.ml_explanations IS 'JSON object containing ML model explanations including risk factors, income predictions, feature importance, and score breakdowns';

-- Create index for faster JSON queries if needed
CREATE INDEX IF NOT EXISTS idx_beneficiary_ml_explanations ON beneficiary_profiles USING GIN (ml_explanations);
