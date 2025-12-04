ALTER TABLE beneficiary_profiles
ADD COLUMN identity_proof_type VARCHAR(50),
ADD COLUMN identity_proof_url TEXT,
ADD COLUMN identity_storage_type VARCHAR(20) DEFAULT 'S3',
ADD COLUMN identity_proof_blob BYTEA;
