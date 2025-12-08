-- Rollback script to revert DB to state before V30
-- Run this in your database to clean up the schema and flyway history

BEGIN;

-- 1. Drop tables created in V30-V36 (Reverse dependency order)
DROP TABLE IF EXISTS loan_officer_profiles CASCADE;
DROP TABLE IF EXISTS loan_officers CASCADE;
DROP TABLE IF EXISTS partner_account_requests CASCADE;
DROP TABLE IF EXISTS channel_partner_profiles CASCADE;
DROP TABLE IF EXISTS channel_partners CASCADE;

-- 2. Clean up Flyway Schema History
-- Removes entries for migrations V30 and above
DELETE FROM flyway_schema_history 
WHERE version IN ('30', '31', '32', '33', '34', '35', '36');

COMMIT;

-- Verification
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
