import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import r2_score, mean_squared_error
import os
import xgboost as xgb

# Load artifacts
print("Loading artifacts...")
try:
    artifacts = joblib.load('risk_model_artifacts.joblib')
    models = artifacts['models']
    encoders = artifacts['encoders']
    feature_names = artifacts['feature_names']
    cols_to_drop = artifacts['cols_to_drop']
    print(f"✓ Loaded {len(models)} models")
except Exception as e:
    print(f"❌ Failed to load artifacts: {e}")
    exit(1)

# Load data for quick eval
print("Loading data for evaluation...")
df = pd.read_csv('corrected_repayment_dataset.csv')
df['dependency_ratio'] = df['family_size'] / (df['dependents_count'] + 1e-5)
df_model = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

# Encode
for col, le in encoders.items():
    if col in df_model.columns:
        df_model[col] = df_model[col].astype(str)
        df_model[col] = df_model[col].apply(lambda x: le.transform([x])[0] if x in le.classes_ else 0)

# Align columns
for col in feature_names:
    if col not in df_model.columns:
        df_model[col] = 0
X = df_model[feature_names]
y = df_model['risk_score']

# Evaluate Ensemble
print("Evaluating ensemble...")
preds = []
for model in models:
    preds.append(model.predict(X))

ensemble_pred = np.mean(preds, axis=0)
r2 = r2_score(y, ensemble_pred)
rmse = np.sqrt(mean_squared_error(y, ensemble_pred))

print(f"Ensemble R²: {r2:.4f}")
print(f"Ensemble RMSE: {rmse:.4f}")

# Test Inference Logic (Mock)
print("\nTesting Inference Logic (Mock)...")
sample = X.iloc[[0]]
print(f"Sample input shape: {sample.shape}")
p = np.mean([m.predict(sample)[0] for m in models])
print(f"Prediction: {p}")
