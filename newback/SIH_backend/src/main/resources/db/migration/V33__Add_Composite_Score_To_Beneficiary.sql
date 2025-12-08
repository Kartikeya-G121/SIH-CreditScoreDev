-- Add composite_score to beneficiary_profiles
ALTER TABLE beneficiary_profiles ADD COLUMN composite_score DECIMAL(5,2);
ALTER TABLE beneficiary_profiles ADD COLUMN score_timestamp TIMESTAMP WITH TIME ZONE;
