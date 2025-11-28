# Database Migration Guide

## Migration Created: V19__Add_ocr_bbps_fields_to_consumption.sql

This migration adds OCR and BBPS fields to the `consumption_entries` table.

### New Fields Added:
- `biller_name` - Biller name extracted from OCR
- `bill_number` - Bill number extracted from OCR
- `consumer_number` - Consumer/Account number extracted from OCR
- `biller_category` - Category (ELECTRICITY, WATER, MOBILE, GAS)
- `due_date` - Payment due date
- `ocr_confidence` - OCR confidence score (0-100)
- `ocr_raw_data` - Raw OCR results (JSONB)
- `bbps_response` - BBPS verification response (JSONB)

### Indexes Added:
- `idx_consumption_biller_category`
- `idx_consumption_bill_number`
- `idx_consumption_consumer_number`
- `idx_consumption_due_date`

## How to Run Migration

### Option 1: Automatic (When Starting Spring Boot)
The migration will run automatically when you start Spring Boot:
```bash
mvn spring-boot:run
```

Flyway will detect the new migration and apply it.

### Option 2: Manual (Using Flyway Maven Plugin)
```bash
# Check migration status
mvn flyway:info

# Run migrations
mvn flyway:migrate

# Verify
mvn flyway:info
```

### Option 3: Direct SQL (If needed)
```bash
psql -U postgres -d income_processing_db -f src/main/resources/db/migration/V19__Add_ocr_bbps_fields_to_consumption.sql
```

## Verification

After migration, verify the new columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consumption_entries' 
  AND column_name IN ('biller_name', 'bill_number', 'consumer_number', 'biller_category', 'due_date', 'ocr_confidence', 'ocr_raw_data', 'bbps_response');
```

## Rollback (If Needed)

If you need to rollback:
```sql
ALTER TABLE consumption_entries
DROP COLUMN IF EXISTS biller_name,
DROP COLUMN IF EXISTS bill_number,
DROP COLUMN IF EXISTS consumer_number,
DROP COLUMN IF EXISTS biller_category,
DROP COLUMN IF EXISTS due_date,
DROP COLUMN IF EXISTS ocr_confidence,
DROP COLUMN IF EXISTS ocr_raw_data,
DROP COLUMN IF EXISTS bbps_response;

DROP INDEX IF EXISTS idx_consumption_biller_category;
DROP INDEX IF EXISTS idx_consumption_bill_number;
DROP INDEX IF EXISTS idx_consumption_consumer_number;
DROP INDEX IF EXISTS idx_consumption_due_date;
```

## Important Notes

⚠️ **The migration uses `ADD COLUMN IF NOT EXISTS`** so it's safe to run multiple times.

✅ **Existing data is preserved** - all new columns are nullable.

🔒 **Indexes improve query performance** for searching by bill number, consumer number, etc.
