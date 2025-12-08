# Quick Fix Summary

## Problem
Flask APIs are online but frontend shows them as offline.

## Root Cause
ML service URLs were not configured in `application.yml`.

## Solution Applied
✅ Added ML configuration to `application.yml`:
```yaml
ml:
  risk:
    api:
      url: http://localhost:5001
    model:
      version: v1
  income:
    api:
      url: http://localhost:5002
```

## Next Step
**Restart the Spring Boot backend** to load the new configuration:

1. Stop the current backend (Ctrl+C in the terminal running `mvn spring-boot:run`)
2. Restart it:
   ```bash
   cd "f:\SIH-CreditScoreDev-soham - Copy\newback\SIH_backend"
   mvn spring-boot:run
   ```
3. Refresh the browser

After restart, the Flask API health indicators should turn green! 🟢
