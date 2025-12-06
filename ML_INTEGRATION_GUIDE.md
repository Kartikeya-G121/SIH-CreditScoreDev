# ML Model Integration Guide

## Overview
This guide explains how to connect the ML models (Risk Classification & Income Category) to the backend scoring service.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Java Backend  │────────▶│  Flask ML APIs   │────────▶│  ML Models      │
│  (Spring Boot)  │  HTTP   │  (Python)        │         │  (.joblib)      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
     │                            │                              │
     │                            │                              │
     ▼                            ▼                              ▼
ScoringService            risk_api.py (5001)          risk_model_v1.joblib
MLModelService            income_api.py (5002)        risk_model_v2.joblib
                                                       income_model_artifacts.joblib
```

## ML Models

### 1. Risk Classification Model
- **Location**: `ml models/Risk Bank Classification/`
- **Versions**: 
  - **v1**: Rich features (18 features) - More accurate, requires more data
  - **v2**: Lean features (fewer features) - More generalizable
- **API Port**: 5001
- **Artifacts**: 
  - `risk_model_artifacts_v1.joblib`
  - `risk_model_artifacts_v2.joblib`

### 2. Income Category Classification Model
- **Location**: `ml models/Income category classification/`
- **API Port**: 5002
- **Artifact**: `income_model_artifacts.joblib`

## Setup Instructions

### Step 1: Train Models (if not already done)

#### Risk Classification (Two Versions)
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Risk Bank Classification"
python train_two_versions.py
```

This creates:
- `risk_model_artifacts_v1.joblib` (Rich features)
- `risk_model_artifacts_v2.joblib` (Lean features)

#### Income Category Classification
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Income category classification"
python train_income_model.py
```

This creates:
- `income_model_artifacts.joblib`

### Step 2: Start Flask APIs

#### Terminal 1: Risk Classification API
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Risk Bank Classification"
python risk_api.py
```

API will start on `http://localhost:5001`

#### Terminal 2: Income Category API
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\ml models\Income category classification"
python income_api.py
```

API will start on `http://localhost:5002`

### Step 3: Configure Backend

Add to `application.properties`:
```properties
# ML Service Configuration
ml.risk.api.url=http://localhost:5001
ml.income.api.url=http://localhost:5002
ml.risk.model.version=v1
```

### Step 4: Start Backend
```bash
cd "f:\SIH-CreditScoreDev-soham - Copy\newback\SIH_backend"
mvn spring-boot:run
```

## API Endpoints

### Risk Classification API (Port 5001)

#### Health Check
```bash
GET http://localhost:5001/health
```

#### Get Model Info
```bash
GET http://localhost:5001/models/info
```

#### Predict Risk Score
```bash
POST http://localhost:5001/predict
Content-Type: application/json

{
  "annual_family_income": 250000,
  "family_size": 4,
  "dependents_count": 2,
  "loan_amount": 100000,
  "tenure_months": 24,
  "model_version": "v1"  // Optional: v1 or v2
}
```

Response:
```json
[{
  "risk_score": 45.67,
  "risk_category": "Medium",
  "explanation": "Risk Score: 45.67 (Medium)\n...",
  "top_factors": [...],
  "model_version": "v1",
  "num_features": 18
}]
```

#### Switch Model Version
```bash
POST http://localhost:5001/models/switch/v2
```

### Income Category API (Port 5002)

#### Health Check
```bash
GET http://localhost:5002/health
```

#### Get Model Info
```bash
GET http://localhost:5002/model/info
```

#### Predict Income Category
```bash
POST http://localhost:5002/predict
Content-Type: application/json

{
  "gas_refill_subsidy_amt_mean": 450,
  "units_consumed_mean": 250,
  "electricitybilling_amount_mean": 1200,
  "average_recharge_value": 350,
  ...
}
```

Response:
```json
[{
  "predicted_category": "Middle Income",
  "confidence": 0.87,
  "probabilities": {
    "Low Income": 0.05,
    "Middle Income": 0.87,
    "High Income": 0.08
  }
}]
```

## Backend Integration

### ScoringService Flow

1. **Application Assessment Request** → `ScoringService.assessApplication()`
2. **Build Input Data** → `buildRiskInputData()` prepares data from application & profile
3. **Call ML API** → `MLModelService.predictRiskScore()` calls Flask API
4. **Combine Scores**:
   - If ML available: 50% ML + 30% Income + 20% Rule-based
   - If ML unavailable: 40% Raw Income + 30% Adjusted Income + 30% Rule-based
5. **Save Assessment** → Store in database with explainability data

### MLModelService Methods

```java
// Predict risk score (uses default version)
Map<String, Object> result = mlModelService.predictRiskScore(inputData);

// Predict risk score with specific version
Map<String, Object> result = mlModelService.predictRiskScore(inputData, "v2");

// Predict income category
Map<String, Object> result = mlModelService.predictIncomeCategory(inputData);

// Check API health
boolean isHealthy = mlModelService.checkRiskApiHealth();

// Switch model version
boolean switched = mlModelService.switchRiskModelVersion("v2");
```

## Model Versions Comparison

| Feature | V1 (Rich Features) | V2 (Lean Features) |
|---------|-------------------|-------------------|
| **Features** | 18 | ~13 |
| **Accuracy** | Higher | Moderate |
| **Data Required** | More complete data | Less data needed |
| **Use Case** | Detailed assessments | Quick assessments |
| **Excluded Fields** | Basic IDs, default_status | V1 + income, interest_rate, loan_purpose, sector, income_source |

## Troubleshooting

### ML API Not Responding
1. Check if Flask servers are running
2. Verify ports 5001 and 5002 are not in use
3. Check firewall settings

### Model Not Found Error
1. Ensure artifact files exist in correct directories
2. Run training scripts to generate artifacts
3. Check file paths in API code

### Backend Connection Error
1. Verify `ml.risk.api.url` and `ml.income.api.url` in properties
2. Check network connectivity
3. Review backend logs for detailed errors

### Fallback to Rule-Based
- If ML API fails, system automatically falls back to rule-based scoring
- Check logs for ML API errors
- Verify ML services are healthy using `/health` endpoints

## Production Deployment

### Docker Setup (Recommended)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  risk-ml-api:
    build: ./ml models/Risk Bank Classification
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
  
  income-ml-api:
    build: ./ml models/Income category classification
    ports:
      - "5002:5002"
    environment:
      - PORT=5002
  
  backend:
    build: ./newback/SIH_backend
    ports:
      - "8080:8080"
    environment:
      - ML_RISK_API_URL=http://risk-ml-api:5001
      - ML_INCOME_API_URL=http://income-ml-api:5002
    depends_on:
      - risk-ml-api
      - income-ml-api
```

## Testing

### Test Risk Classification
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"annual_family_income": 250000, "family_size": 4, "dependents_count": 2}'
```

### Test Backend Integration
```bash
curl -X POST http://localhost:8080/api/v1/scoring/assess/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Files Created

### ML Models
- `ml models/Risk Bank Classification/train_two_versions.py` - Trains both versions
- `ml models/Risk Bank Classification/risk_api.py` - Flask API for risk classification
- `ml models/Income category classification/train_income_model.py` - Trains income model
- `ml models/Income category classification/income_api.py` - Flask API for income classification

### Backend
- `src/main/java/com/sih/module/scoring/service/MLModelService.java` - ML integration service
- `src/main/java/com/sih/module/scoring/service/ScoringService.java` - Updated with ML calls
- `ml-config.properties` - ML service configuration

## Next Steps

1. ✅ Train both model versions
2. ✅ Create Flask APIs
3. ✅ Integrate with backend
4. ⏳ Test end-to-end flow
5. ⏳ Deploy to production
6. ⏳ Monitor model performance
7. ⏳ Implement model retraining pipeline
