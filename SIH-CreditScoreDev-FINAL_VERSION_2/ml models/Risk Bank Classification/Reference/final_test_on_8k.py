"""
Train on full 8k dataset and test on test.csv
Uses production-ready pipeline methodology
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import cross_val_score
import shap
from lime import lime_tabular
import warnings
warnings.filterwarnings('ignore')

print("="*100)
print("TRAINING ON FULL DATASET & TESTING ON test.csv")
print("="*100)

# ============================================================================
# 1. LOAD AND PREPARE TRAINING DATA (FULL 8K DATASET)
# ============================================================================
print("\n[1/5] Loading full training dataset...")
df_train = pd.read_csv('c:/sriyansh/SIH/corrected_repayment_dataset.csv')

print(f"Full dataset size: {len(df_train)} rows")

# Feature Engineering
df_train['dependency_ratio'] = df_train['family_size'] / (df_train['dependents_count'] + 1e-5)

# Feature Exclusions
cols_to_drop = [
    'beneficiary_id', 'partner_id', 'loan_id', 'repayment_id',
    'gender', 'age', 'category', 'education_level', 'marital_status',
    'state', 'district', 'annual_family_income', 'default_status',
    'bank_account_status', 'bank_name', 'account_type', 'loan_scheme',
    'interest_rate', 'guarantor_present', 'loan_purpose', 'business_age',
    'sector', 'last_payment_date', 'income_source', 'land_owned_acres',
    'collateral_required', 'loan_start_date', 'loan_end_date', 'Unnamed: 0'
]

df_model = df_train.drop(columns=[c for c in cols_to_drop if c in df_train.columns])
target = 'risk_score'

X_train_raw = df_model.drop(columns=[target])
y_train = df_model[target]

# Encode categoricals (fit on train)
cat_cols = X_train_raw.select_dtypes(include=['object', 'category']).columns
label_encoders = {}
X_train = X_train_raw.copy()

for col in cat_cols:
    le = LabelEncoder()
    X_train[col] = le.fit_transform(X_train[col].astype(str))
    label_encoders[col] = le

print(f"Training features: {X_train.shape[1]}")
print(f"Features: {list(X_train.columns)}")

# ============================================================================
# 2. TRAIN 5 MODELS ON FULL DATASET
# ============================================================================
print("\n[2/5] Training 5 XGBoost models on full dataset...")

configs = [
    {'max_depth': 3, 'learning_rate': 0.1, 'n_estimators': 100, 'subsample': 0.8, 
     'colsample_bytree': 0.8, 'name': 'Model_1_Shallow'},
    {'max_depth': 6, 'learning_rate': 0.1, 'n_estimators': 100, 'subsample': 0.9, 
     'colsample_bytree': 0.9, 'name': 'Model_2_Medium'},
    {'max_depth': 9, 'learning_rate': 0.05, 'n_estimators': 150, 'subsample': 0.7, 
     'colsample_bytree': 0.7, 'name': 'Model_3_Deep'},
    {'max_depth': 6, 'learning_rate': 0.2, 'n_estimators': 80, 'subsample': 0.85, 
     'colsample_bytree': 0.85, 'name': 'Model_4_FastLR'},
    {'max_depth': 5, 'learning_rate': 0.08, 'n_estimators': 120, 'subsample': 0.75, 
     'colsample_bytree': 0.75, 'name': 'Model_5_Balanced'}
]

models = []
for config in configs:
    model = xgb.XGBRegressor(
        max_depth=config['max_depth'],
        learning_rate=config['learning_rate'],
        n_estimators=config['n_estimators'],
        subsample=config['subsample'],
        colsample_bytree=config['colsample_bytree'],
        objective='reg:squarederror',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    models.append({'model': model, 'name': config['name']})
    print(f"  ✓ Trained {config['name']}")

# Cross-validation on full dataset
print("\n  Running 5-fold cross-validation...")
cv_model = xgb.XGBRegressor(max_depth=6, learning_rate=0.1, n_estimators=100, 
                            random_state=42, n_jobs=-1)
cv_scores = cross_val_score(cv_model, X_train, y_train, cv=5, scoring='r2', n_jobs=-1)
print(f"  CV R² Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

# ============================================================================
# 3. LOAD TEST DATA
# ============================================================================
print("\n[3/5] Loading test.csv...")
df_test = pd.read_csv('c:/sriyansh/SIH/test.csv')

print(f"Test samples: {len(df_test)}")

# Feature Engineering
df_test['dependency_ratio'] = df_test['family_size'] / (df_test['dependents_count'] + 1e-5)

# Drop excluded columns
df_test_model = df_test.drop(columns=[c for c in cols_to_drop if c in df_test.columns])

# Separate features and target
X_test_raw = df_test_model.drop(columns=[target])
y_test_actual = df_test_model[target]

# Encode categoricals (transform using fitted encoders)
X_test = X_test_raw.copy()
for col in cat_cols:
    if col in X_test.columns:
        try:
            X_test[col] = label_encoders[col].transform(X_test[col].astype(str))
        except ValueError:
            # Handle unseen categories by using mode
            X_test[col] = 0

print(f"Test data prepared: {X_test.shape[0]} samples")

# ============================================================================
# 4. GENERATE PREDICTIONS AND EXPLANATIONS
# ============================================================================
print("\n[4/5] Generating predictions and detailed explanations...")

report_lines = []
report_lines.append("="*100)
report_lines.append("DETAILED TEST ANALYSIS - test.csv")
report_lines.append("Trained on: Full 8k dataset | Tested on: 3 samples from test.csv")
report_lines.append("="*100)

for idx in range(len(X_test)):
    sample_data = df_test.iloc[idx]
    actual_risk = y_test_actual.iloc[idx]
    
    report_lines.append(f"\n{'='*100}")
    report_lines.append(f"TEST SAMPLE {idx + 1}")
    report_lines.append(f"{'='*100}")
    
    report_lines.append(f"\nBeneficiary ID: {sample_data['beneficiary_id']}")
    report_lines.append(f"Actual Risk Score: {actual_risk:.2f}")
    
    # Risk category
    if actual_risk >= 60:
        risk_category = "⚠️ HIGH RISK"
    elif actual_risk >= 40:
        risk_category = "⚡ MEDIUM RISK"
    else:
        risk_category = "✅ LOW RISK"
    report_lines.append(f"Risk Category: {risk_category}")
    
    # Predictions from all 5 models
    report_lines.append(f"\n{'─'*100}")
    report_lines.append("ENSEMBLE PREDICTIONS (5 Models)")
    report_lines.append(f"{'─'*100}")
    
    predictions = []
    for model_info in models:
        pred = model_info['model'].predict(X_test.iloc[[idx]])[0]
        predictions.append(pred)
        report_lines.append(f"  {model_info['name']:<25} {pred:>8.2f}")
    
    ensemble_pred = np.mean(predictions)
    pred_std = np.std(predictions)
    pred_error = abs(actual_risk - ensemble_pred)
    
    report_lines.append(f"\n  {'Ensemble Average':<25} {ensemble_pred:>8.2f}")
    report_lines.append(f"  {'Prediction Std Dev':<25} {pred_std:>8.2f}")
    report_lines.append(f"  {'Prediction Error':<25} {pred_error:>8.2f}")
    
    # SHAP Explanations
    report_lines.append(f"\n{'─'*100}")
    report_lines.append("SHAP FEATURE CONTRIBUTIONS (Averaged across 5 models)")
    report_lines.append(f"{'─'*100}")
    
    all_shap_values = []
    for model_info in models:
        explainer = shap.TreeExplainer(model_info['model'])
        shap_vals = explainer.shap_values(X_test.iloc[[idx]])
        all_shap_values.append(shap_vals[0])
    
    avg_shap = np.mean(all_shap_values, axis=0)
    
    # Sort by absolute contribution
    feature_contributions = list(zip(X_test.columns, avg_shap, X_test.iloc[idx].values))
    feature_contributions.sort(key=lambda x: abs(x[1]), reverse=True)
    
    report_lines.append(f"\n{'Feature':<30} {'Value':<12} {'SHAP Impact':<15} {'Effect'}")
    report_lines.append(f"{'-'*30} {'-'*12} {'-'*15} {'-'*30}")
    
    for feat, contrib, value in feature_contributions:
        direction = "↑ Increases" if contrib > 0 else "↓ Decreases"
        report_lines.append(f"{feat:<30} {value:<12.2f} {contrib:+15.4f} {direction} risk")
    
    # LIME Explanation
    report_lines.append(f"\n{'─'*100}")
    report_lines.append("LIME EXPLANATION (Top 10 Features)")
    report_lines.append(f"{'─'*100}")
    
    lime_explainer = lime_tabular.LimeTabularExplainer(
        X_train.values,
        feature_names=X_train.columns.tolist(),
        mode='regression',
        random_state=42
    )
    
    lime_exp = lime_explainer.explain_instance(
        X_test.iloc[idx].values,
        models[1]['model'].predict,
        num_features=10
    )
    
    report_lines.append(f"\n{'Feature':<30} {'LIME Weight':<15} {'Interpretation'}")
    report_lines.append(f"{'-'*30} {'-'*15} {'-'*40}")
    
    for feat, weight in lime_exp.as_list():
        direction = "Pushes risk higher" if weight > 0 else "Pushes risk lower"
        report_lines.append(f"{feat:<30} {weight:+15.4f} {direction}")
    
    # Plain English Explanation
    report_lines.append(f"\n{'─'*100}")
    report_lines.append("PLAIN ENGLISH EXPLANATION")
    report_lines.append(f"{'─'*100}")
    
    top_positive = [f for f in feature_contributions if f[1] > 0][:3]
    top_negative = [f for f in feature_contributions if f[1] < 0][:3]
    
    explanation = f"\nBeneficiary {sample_data['beneficiary_id']} has an actual risk score of {actual_risk:.2f}.\n"
    explanation += f"Our ensemble predicts: {ensemble_pred:.2f} (error: {pred_error:.2f})\n"
    
    if top_positive:
        explanation += "\n🔴 FACTORS INCREASING RISK:\n"
        for feat, contrib, value in top_positive:
            if 'outstanding' in feat.lower():
                explanation += f"  • Outstanding amount of ₹{value:.0f} adds {contrib:.2f} points\n"
            elif 'delay' in feat.lower():
                explanation += f"  • Average delay of {value:.1f} days adds {contrib:.2f} points\n"
            elif 'late' in feat.lower() or 'missed' in feat.lower():
                explanation += f"  • {int(value)} late/missed payments adds {contrib:.2f} points\n"
            elif 'pending' in feat.lower():
                explanation += f"  • {int(value)} pending EMIs adds {contrib:.2f} points\n"
            else:
                explanation += f"  • {feat} = {value:.2f} adds {contrib:.2f} points\n"
    
    if top_negative:
        explanation += "\n🟢 FACTORS DECREASING RISK:\n"
        for feat, contrib, value in top_negative:
            if 'paid' in feat.lower() or 'on_time' in feat.lower():
                explanation += f"  • {int(value)} on-time payments reduces risk by {abs(contrib):.2f} points\n"
            else:
                explanation += f"  • {feat} = {value:.2f} reduces risk by {abs(contrib):.2f} points\n"
    
    # Recommendation
    if actual_risk >= 60:
        explanation += "\n⚠️ RECOMMENDATION: High risk - Immediate intervention required\n"
        explanation += "   → Restructure loan, financial counseling, close monitoring\n"
    elif actual_risk >= 40:
        explanation += "\n⚡ RECOMMENDATION: Medium risk - Monitor and support\n"
        explanation += "   → Payment reminders, financial literacy, regular check-ins\n"
    else:
        explanation += "\n✅ RECOMMENDATION: Low risk - Maintain current behavior\n"
        explanation += "   → Continue monitoring, no immediate action needed\n"
    
    report_lines.append(explanation)
    
    # Key Metrics
    report_lines.append(f"\n{'─'*100}")
    report_lines.append("KEY METRICS")
    report_lines.append(f"{'─'*100}")
    report_lines.append(f"Loan Amount: ₹{sample_data['loan_amount']:,.0f}")
    report_lines.append(f"Current Outstanding: ₹{sample_data['current_outstanding']:,.0f}")
    report_lines.append(f"Total EMIs: {sample_data['total_emis']}")
    report_lines.append(f"EMIs Paid: {sample_data['emis_paid']} | Pending: {sample_data['emis_pending']}")
    report_lines.append(f"On-time EMIs: {sample_data['on_time_emis']}")
    report_lines.append(f"Late Payments: {sample_data['late_payments']} | Missed: {sample_data['missed_payments']}")
    report_lines.append(f"Average Delay: {sample_data['average_delay_days']} days | Max Delay: {sample_data['max_delay_days']} days")

# ============================================================================
# 5. SUMMARY
# ============================================================================
print("\n[5/5] Generating summary...")

report_lines.append(f"\n{'='*100}")
report_lines.append("SUMMARY")
report_lines.append(f"{'='*100}")
report_lines.append(f"\nTraining Dataset: {len(df_train)} samples")
report_lines.append(f"Test Dataset: {len(df_test)} samples")
report_lines.append(f"Cross-Validation R²: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
report_lines.append(f"\nTest Results:")

for idx in range(len(df_test)):
    actual = y_test_actual.iloc[idx]
    preds = [m['model'].predict(X_test.iloc[[idx]])[0] for m in models]
    ensemble = np.mean(preds)
    error = abs(actual - ensemble)
    report_lines.append(f"  Sample {idx+1}: Actual={actual:.2f}, Predicted={ensemble:.2f}, Error={error:.2f}")

report_lines.append(f"\n{'='*100}")
report_lines.append("END OF REPORT")
report_lines.append(f"{'='*100}")

# Save report
report_text = '\n'.join(report_lines)
with open('final_test_results.txt', 'w', encoding='utf-8') as f:
    f.write(report_text)

print("\n" + report_text)
print("\n✓ Final test results saved to 'final_test_results.txt'")
print("\n" + "="*100)
print("TESTING COMPLETE!")
print("="*100)
