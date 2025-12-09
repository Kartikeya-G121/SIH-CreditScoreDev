-- ================================================================================
-- Add Aadhar Number to Beneficiary Profiles
-- ================================================================================

ALTER TABLE beneficiary_profiles
ADD COLUMN aadhar_number VARCHAR(12);

COMMENT ON COLUMN beneficiary_profiles.aadhar_number IS '12-digit Aadhar card number';
