-- Add new socio-economic fields to beneficiary_profiles table

ALTER TABLE beneficiary_profiles
ADD COLUMN IF NOT EXISTS education VARCHAR(100),
ADD COLUMN IF NOT EXISTS family_size INTEGER,
ADD COLUMN IF NOT EXISTS dependency_count INTEGER,
ADD COLUMN IF NOT EXISTS land_owned NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS income_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_graduate BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN beneficiary_profiles.education IS 'Education level: Primary, Secondary, Higher Secondary, Graduate, Post-Graduate';
COMMENT ON COLUMN beneficiary_profiles.family_size IS 'Total number of family members';
COMMENT ON COLUMN beneficiary_profiles.dependency_count IS 'Number of dependents';
COMMENT ON COLUMN beneficiary_profiles.land_owned IS 'Land owned in acres';
COMMENT ON COLUMN beneficiary_profiles.income_source IS 'Primary income source: Agriculture, Business, Salaried, Daily Wage';
COMMENT ON COLUMN beneficiary_profiles.is_graduate IS 'Whether the beneficiary is a graduate';
