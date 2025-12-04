-- Add status column to repayments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='repayments' AND column_name='status') THEN
        ALTER TABLE repayments ADD COLUMN status VARCHAR(20) DEFAULT 'COMPLETED';
    END IF;
END $$;

-- Fix is_on_time column (convert from generated to normal)
DO $$
BEGIN
    -- We want is_on_time to be a normal writable column.
    -- If it exists, we drop it to remove any generated property and re-add it.
    -- This is safe because we can recalculate the value.
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='repayments' AND column_name='is_on_time') THEN
        ALTER TABLE repayments DROP COLUMN is_on_time;
    END IF;
    
    ALTER TABLE repayments ADD COLUMN is_on_time BOOLEAN;
END $$;

-- Update existing records to set is_on_time based on paid_date and due_date
UPDATE repayments 
SET is_on_time = (paid_date <= due_date) 
WHERE paid_date IS NOT NULL AND due_date IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN repayments.status IS 'Payment status: PENDING, COMPLETED, FAILED';
COMMENT ON COLUMN repayments.is_on_time IS 'Whether payment was made on or before due date';
