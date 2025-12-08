-- Add partner_id column to loan_schemes table to link with ChannelPartner
-- This establishes the relationship defined in LoanScheme entity

ALTER TABLE loan_schemes
ADD COLUMN partner_id BIGINT;

ALTER TABLE loan_schemes
ADD CONSTRAINT fk_loan_schemes_partner
FOREIGN KEY (partner_id)
REFERENCES channel_partners (partner_id);
