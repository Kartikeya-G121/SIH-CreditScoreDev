UPDATE beneficiary_profiles 
SET risk_bucket = 'Low', income_bucket = 'Low' 
WHERE composite_score IS NOT NULL;
