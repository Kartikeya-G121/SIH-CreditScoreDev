-- Add group fields to loans table
ALTER TABLE loans 
ADD COLUMN group_id BIGINT,
ADD COLUMN is_group_loan BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint
ALTER TABLE loans
ADD CONSTRAINT fk_loans_group
FOREIGN KEY (group_id)
REFERENCES borrower_groups (group_id);

-- Add index for group loans
CREATE INDEX idx_loans_group ON loans(group_id);
