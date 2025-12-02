-- Add new columns to loans table
ALTER TABLE loans 
ADD COLUMN interest_rate DECIMAL(5,2),
ADD COLUMN remaining_tenure INTEGER,
ADD COLUMN last_payment_date DATE,
ADD COLUMN accumulated_interest DECIMAL(15,2) DEFAULT 0.00;

-- Add new columns to repayments table
ALTER TABLE repayments
ADD COLUMN principal_component DECIMAL(10,2),
ADD COLUMN interest_component DECIMAL(10,2);
