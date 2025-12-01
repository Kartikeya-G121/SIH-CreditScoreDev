-- Add group_status to borrower_groups table
ALTER TABLE borrower_groups
ADD COLUMN group_status VARCHAR(50) DEFAULT 'ACTIVE';

-- Create index for group status
CREATE INDEX idx_groups_status ON borrower_groups(group_status);
