-- ================================================================================
-- REGIONAL COST PARAMETERS
-- ================================================================================

CREATE TABLE regional_parameters (
    region_id SERIAL PRIMARY KEY,
    state VARCHAR(100),
    region_type VARCHAR(20), -- 'RURAL', 'URBAN'
    cost_adjustment_factor DECIMAL(5,4), -- e.g., 1.10 for +10%
    last_updated DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_regional_state_type ON regional_parameters(state, region_type);

