# Admin ML Model Management - Testing Guide

## Prerequisites

Before testing, ensure the following are running:

### 1. Start Flask ML Services
```bash
# Option 1: Use the batch script
f:\SIH-CreditScoreDev-soham - Copy\start-ml-services.bat

# Option 2: Manual start
# Terminal 1 - Risk API
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Risk Bank Classification"
python risk_api.py

# Terminal 2 - Income API
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Income category classification"
python income_api.py
```

**Expected Output:**
- Risk API running on `http://localhost:5001`
- Income API running on `http://localhost:5002`

### 2. Start Spring Boot Backend
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\newback\SIH_backend"
mvn spring-boot:run
```

**Expected Output:**
- Backend running on `http://localhost:8080`

### 3. Start Frontend
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\front\SIH-CreditScore"
npm run dev
```

**Expected Output:**
- Frontend running on `http://localhost:3000`

---

## Testing Steps

### Step 1: Login as Admin

1. Navigate to `http://localhost:3000`
2. Login with admin credentials
3. Navigate to **Admin Dashboard** → **System Metrics** or **ML Models**

### Step 2: Verify Flask API Health Status

**What to Check:**
- ✅ **Risk Classification API** card shows:
  - Green "Online" badge with checkmark
  - "Port 5001" label
- ✅ **Income Category API** card shows:
  - Green "Online" badge with checkmark
  - "Port 5002" label
- ✅ **Active Version** card shows:
  - Current version (V1 or V2)
  - Description (Rich Features / Lean Features)

**If APIs are Offline:**
- Cards will show red "Offline" badge
- Make sure Flask services are running

### Step 3: View Model Version Comparison

**What to Check:**
- ✅ Table shows two rows: **V1 (Rich)** and **V2 (Lean)**
- ✅ Each row displays:
  - Number of features
  - Number of models (should be 5 for risk models)
  - R² Score (accuracy percentage)
  - RMSE (error metric)
  - Status badge (Active/Inactive)

**Example Data:**
| Version | Features | Models | R² Score | RMSE | Status |
|---------|----------|--------|----------|------|--------|
| V1 (Rich) | 18 | 5 | 95.23% | 0.0234 | Active |
| V2 (Lean) | 13 | 5 | 93.45% | 0.0289 | Inactive |

### Step 4: Switch Model Version

**Test Switching to V2:**
1. Click **"Switch"** button next to V2 (Lean)
2. ✅ Should see success toast: "Switched to version V2"
3. ✅ V2 row now shows green "Active" badge
4. ✅ V1 row shows "Inactive" badge
5. ✅ Active Version card updates to "V2"

**Test Switching Back to V1:**
1. Click **"Switch"** button next to V1 (Rich)
2. ✅ Should see success toast: "Switched to version V1"
3. ✅ V1 row now shows green "Active" badge
4. ✅ Active Version card updates to "V1"

### Step 5: View Income Model Information

**What to Check:**
- ✅ **Income Category Model** card displays:
  - Number of features (should be 14)
  - Number of classes (should be 3 or 4)
  - Category badges (e.g., "Low Income", "Middle Income", "High Income")

### Step 6: Test Auto-Refresh

**What to Check:**
1. Wait 30 seconds
2. ✅ Data should automatically refresh
3. ✅ Health indicators update if APIs go down/up

**Manual Refresh:**
1. Click **"Refresh Data"** button at bottom
2. ✅ Loading spinner appears
3. ✅ All data updates

### Step 7: Test with APIs Down

**Simulate API Failure:**
1. Stop both Flask services (Ctrl+C in terminals)
2. Click "Refresh Data" or wait for auto-refresh
3. ✅ Health cards show red "Offline" badges
4. ✅ Error toast appears: "Failed to fetch Flask API data"
5. ✅ Table shows "N/A" for metrics
6. ✅ Switch buttons are disabled

**Restart APIs:**
1. Restart Flask services
2. Click "Refresh Data"
3. ✅ Health cards turn green
4. ✅ Data populates correctly

### Step 8: Test Backend API Directly

**Test Flask Model Info Endpoint:**
```bash
curl -X GET http://localhost:8080/api/v1/scoring/models/flask/info \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "risk_api": {
      "active_version": "v1",
      "versions": {
        "v1": {
          "num_models": 5,
          "num_features": 18,
          "metrics": {
            "r2": 0.9523,
            "rmse": 0.0234
          }
        },
        "v2": {
          "num_models": 5,
          "num_features": 13,
          "metrics": {
            "r2": 0.9345,
            "rmse": 0.0289
          }
        }
      }
    },
    "income_api": {
      "num_features": 14,
      "num_classes": 3,
      "classes": ["Low Income", "Middle Income", "High Income"]
    }
  }
}
```

**Test Health Endpoint:**
```bash
curl -X GET http://localhost:8080/api/v1/scoring/models/flask/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "data": {
    "risk_api": true,
    "income_api": true
  }
}
```

**Test Version Switch:**
```bash
curl -X POST http://localhost:8080/api/v1/scoring/models/flask/switch/v2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Switched to version v2"
}
```

---

## Troubleshooting

### Issue: "Failed to fetch Flask API data"

**Solutions:**
1. Check if Flask services are running:
   ```bash
   curl http://localhost:5001/health
   curl http://localhost:5002/health
   ```
2. Check backend logs for connection errors
3. Verify ports 5001 and 5002 are not blocked by firewall

### Issue: Table shows "N/A" for all values

**Solutions:**
1. Ensure model artifacts exist:
   - `risk_model_artifacts_v1.joblib`
   - `risk_model_artifacts_v2.joblib`
   - `income_model_artifacts.joblib`
2. Check Flask API logs for errors
3. Restart Flask services

### Issue: Switch button doesn't work

**Solutions:**
1. Check if Risk API is online (green badge)
2. Check browser console for errors
3. Verify admin role/permissions
4. Check backend logs for authorization errors

### Issue: Auto-refresh not working

**Solutions:**
1. Check browser console for errors
2. Verify component is mounted (not navigated away)
3. Clear browser cache and reload

---

## Success Criteria

✅ All health indicators show green when APIs are running  
✅ Model version comparison table displays accurate data  
✅ Version switching works and updates UI immediately  
✅ Income model info displays correctly  
✅ Auto-refresh updates data every 30 seconds  
✅ Manual refresh button works  
✅ System gracefully handles API downtime  
✅ Error messages are clear and helpful  

---

## Next Steps

After successful testing:
1. Document any issues found
2. Test with real loan application assessments
3. Verify that switching versions affects actual predictions
4. Monitor performance with both versions
5. Set up production deployment
