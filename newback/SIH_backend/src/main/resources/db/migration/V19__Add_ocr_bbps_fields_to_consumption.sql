-- Add OCR and BBPS fields to consumption_entries table
-- Migration for Consumption Module Enhancement

ALTER TABLE consumption_entries
ADD COLUMN IF NOT EXISTS biller_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS consumer_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS biller_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS ocr_raw_data JSONB,
ADD COLUMN IF NOT EXISTS bbps_response JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consumption_biller_category ON consumption_entries(biller_category);
CREATE INDEX IF NOT EXISTS idx_consumption_bill_number ON consumption_entries(bill_number);
CREATE INDEX IF NOT EXISTS idx_consumption_consumer_number ON consumption_entries(consumer_number);
CREATE INDEX IF NOT EXISTS idx_consumption_due_date ON consumption_entries(due_date);

-- Add comments for documentation
COMMENT ON COLUMN consumption_entries.biller_name IS 'Biller name extracted from OCR';
COMMENT ON COLUMN consumption_entries.bill_number IS 'Bill number extracted from OCR';
COMMENT ON COLUMN consumption_entries.consumer_number IS 'Consumer/Account number extracted from OCR';
COMMENT ON COLUMN consumption_entries.biller_category IS 'Category: ELECTRICITY, WATER, MOBILE, GAS';
COMMENT ON COLUMN consumption_entries.due_date IS 'Payment due date extracted from OCR';
COMMENT ON COLUMN consumption_entries.ocr_confidence IS 'Overall OCR extraction confidence (0-100)';
COMMENT ON COLUMN consumption_entries.ocr_raw_data IS 'Raw OCR extraction results in JSON format';
COMMENT ON COLUMN consumption_entries.bbps_response IS 'BBPS verification response in JSON format';
