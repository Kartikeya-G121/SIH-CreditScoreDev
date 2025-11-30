-- ================================================================================
-- GROUP LOAN MODULE
-- ================================================================================

CREATE TABLE borrower_groups (
    group_id BIGSERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    formation_date DATE,
    project_description TEXT,
    created_by_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    group_score DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_creator ON borrower_groups(created_by_user_id);
CREATE INDEX idx_groups_active ON borrower_groups(is_active);

CREATE TABLE group_members (
    member_id BIGSERIAL PRIMARY KEY,
    group_id BIGINT REFERENCES borrower_groups(group_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE RESTRICT,
    role VARCHAR(50) DEFAULT 'MEMBER', -- 'LEADER', 'MEMBER'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    joined_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_status ON group_members(status);

