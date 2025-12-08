# Quick Start Guide - Consumption Module

## Prerequisites

### 1. Install Python Dependencies
```bash
# Install Tesseract OCR (Windows)
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR

# Or use chocolatey
choco install tesseract

# Install Python packages
cd "d:\sih - Copy (6)\Generated_Documentation\ocr-service"
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**For Python OCR Service:**
```bash
cd ocr-service
copy .env.example .env
# Edit .env if needed (defaults should work)
```

**For Spring Boot:**
Add to your main `.env` file:
```properties
# OCR Service
OCR_SERVICE_URL=http://localhost:5000
OCR_SERVICE_ENABLED=true

# BBPS
BBPS_MOCK_ENABLED=true
```

---

## Running the Services

### Option 1: Run in Separate Terminals (Recommended)

**Terminal 1 - Python OCR Service:**
```bash
cd "d:\sih - Copy (6)\Generated_Documentation\ocr-service"
python app.py
```

**Expected Output:**
```
Starting OCR Bill Parser Service...
 * Running on http://0.0.0.0:5000
```

**Terminal 2 - Spring Boot Application:**
```bash
cd "d:\sih - Copy (6)\Generated_Documentation"
mvn spring-boot:run
```

**Expected Output:**
```
Started IncomeProcessingSystemApplication in X seconds
```

---

### Option 2: Run with PowerShell Script

Create `start-services.ps1`:
```powershell
# Start Python OCR Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sih - Copy (6)\Generated_Documentation\ocr-service'; python app.py"

# Wait 5 seconds for OCR service to start
Start-Sleep -Seconds 5

# Start Spring Boot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sih - Copy (6)\Generated_Documentation'; mvn spring-boot:run"

Write-Host "Services starting..."
Write-Host "OCR Service: http://localhost:5000"
Write-Host "Spring Boot: http://localhost:8080"
```

Run:
```bash
powershell -ExecutionPolicy Bypass -File start-services.ps1
```

---

## Verify Services are Running

### 1. Check Python OCR Service
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "OCR Bill Parser",
  "version": "1.0.0"
}
```

### 2. Check Spring Boot
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response:**
```json
{
  "status": "UP"
}
```

---

## Test the Complete Flow

### 1. Login and Get Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"1234567890\",\"password\":\"password\"}"
```

### 2. Upload a Bill
```bash
curl -X POST http://localhost:8080/api/v1/consumption/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/bill.pdf" \
  -F "dataSource=ELECTRICITY"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Entry uploaded successfully",
  "data": {
    "entryId": 1,
    "verificationStatus": "PENDING",
    "fileS3Url": "https://supabase.co/storage/..."
  }
}
```

### 3. Check Verification Status (after a few seconds)
```bash
curl http://localhost:8080/api/v1/consumption/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "entryId": 1,
    "billingAmount": 1234.56,
    "billerName": "ELECTRICITY BOARD",
    "billNumber": "BILL-12345",
    "consumerNumber": "CONS-67890",
    "verificationStatus": "VERIFIED",
    "ocrConfidence": 83.2,
    "isTamperedFlag": false
  }
}
```

---

## Troubleshooting

### Python OCR Service Won't Start

**Error: `ModuleNotFoundError: No module named 'flask'`**
```bash
pip install -r requirements.txt
```

**Error: `TesseractNotFoundError`**
- Install Tesseract OCR
- Add to PATH or set in `.env`: `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe`

### Spring Boot Can't Connect to OCR Service

**Error: `Connection refused`**
- Check if Python service is running: `curl http://localhost:5000/health`
- Verify `OCR_SERVICE_URL=http://localhost:5000` in `.env`
- Check firewall settings

### Low OCR Confidence

- Use high-quality bill images (300+ DPI)
- Ensure bill is clear and not blurry
- Try PDF format instead of images

---

## Stopping Services

### Stop Python OCR Service
Press `Ctrl+C` in the terminal running `python app.py`

### Stop Spring Boot
Press `Ctrl+C` in the terminal running `mvn spring-boot:run`

---

## Service URLs

- **Python OCR Service**: http://localhost:5000
- **OCR Health Check**: http://localhost:5000/health
- **Spring Boot API**: http://localhost:8080
- **Spring Boot Health**: http://localhost:8080/actuator/health
- **Consumption API**: http://localhost:8080/api/v1/consumption

---

## Next Steps

1. ✅ Both services running
2. ✅ Upload test bills
3. ✅ Verify OCR extraction
4. ✅ Check BBPS verification
5. 📝 Review extracted data in database
6. 🚀 Deploy to production
