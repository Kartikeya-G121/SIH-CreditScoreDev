# Consumption Module Enhancement - Setup Guide

## Quick Start

### 1. Start Python OCR Service

```bash
cd ocr-service
pip install -r requirements.txt
python app.py
```

The OCR service will run on `http://localhost:5000`

### 2. Configure Spring Boot

Add to `.env`:
```properties
# Python OCR Service
OCR_SERVICE_URL=http://localhost:5000
OCR_SERVICE_ENABLED=true

# BBPS Configuration
BBPS_MOCK_ENABLED=true
```

### 3. Run Spring Boot Application

```bash
mvn spring-boot:run
```

## Testing the Flow

### Upload a Bill

```bash
curl -X POST http://localhost:8080/api/v1/consumption/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@bill.pdf" \
  -F "dataSource=ELECTRICITY" \
  -F "billingAmount=1500" \
  -F "billingDate=2024-01-15"
```

### Check Verification Status

```bash
curl http://localhost:8080/api/v1/consumption/{entryId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture Flow

1. **Upload** → File saved to Supabase
2. **Async Processing** → Python OCR extracts bill data
3. **BBPS Verification** → Validates bill authenticity
4. **Database Update** → Stores OCR data and verification results

## Troubleshooting

- **OCR Service Not Running**: Check `http://localhost:5000/health`
- **Tesseract Not Found**: Install Tesseract OCR and add to PATH
- **Low OCR Confidence**: Improve bill image quality (300+ DPI recommended)
