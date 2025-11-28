-- ================================================================================
-- SCORING & ASSESSMENT
-- ================================================================================

CREATE TABLE credit_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES loan_applications(application_id) ON DELETE CASCADE,
    
    raw_income_score DECIMAL(5,2),
    adjusted_income_score DECIMAL(5,2),
    credit_risk_score DECIMAL(5,2),
    composite_score DECIMAL(5,2),
    
    risk_band VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
    eligibility_status VARCHAR(20),
    
    explainability_data JSONB DEFAULT '{}'::jsonb,
    explainability_summary TEXT,
    
    model_id BIGINT REFERENCES ml_models(model_id),
    
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_app ON credit_assessments(application_id);
CREATE INDEX idx_assessment_risk ON credit_assessments(risk_band);
CREATE INDEX idx_assessment_model ON credit_assessments(model_id);

