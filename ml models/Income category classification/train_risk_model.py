import pandas as pd
import numpy as np
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder, MinMaxScaler

# Specified Feature Subset
SELECTED_FEATURES = [
    'mobilerechargeamount_median', 
    'mobilerechargeamount_max', 
    'units_consumed_mean', 
    'units_consumed_max', 
    'mobile_bill_per_capita', 
    'electricitybilling_amount_mean', 
    'electricitybilling_amount_median', 
    'units_per_capita', 
    'electricity_bill_per_capita', 
    'gas_refill_subsidy_amt_std', 
    'gas_refill_subsidy_amt_mode', 
    'subsidy_ratio', 
    'missing_gas', 
    'missing_electricity', 
    'gas_refill_amt_mean'
]

def train_risk_model():
    print("Loading data for Risk Model...")
    df = pd.read_csv('primary_dataset.csv')
    
    # Preprocessing
    X = df[SELECTED_FEATURES]
    y = df['income_category']
    
    print(f"Selected {len(SELECTED_FEATURES)} features.")
    
    # Encode Target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    class_names = list(le.classes_)
    print(f"Classes: {class_names}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.20, random_state=42)
    
    # XGBoost
    print("Training XGBoost (Risk Model)...")
    model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=len(class_names),
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        random_state=42,
        eval_metric='mlogloss'
    )
    model.fit(X_train, y_train)
    
    # Save Model
    model.save_model("model_risk.json")
    print("Model saved to model_risk.json")
    
    # Predictions
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    
    # --- Explainability ---
    print("Generating Explanations...")
    
    # 1. Combined Global Importance
    xgb_imp = model.feature_importances_
    
    # SHAP - Subset for speed
    X_shap_subset = X_test.sample(n=min(1000, len(X_test)), random_state=42)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_shap_subset)
    
    # Handle SHAP output structure
    if isinstance(shap_values, list):
        shap_arr = np.array(shap_values)
        shap_imp = np.mean(np.abs(shap_arr), axis=(0, 1))
    else:
        if len(shap_values.shape) == 3:
             shap_imp = np.mean(np.abs(shap_values), axis=(0, 2))
        else:
             shap_imp = np.mean(np.abs(shap_values), axis=0)
             
    # Normalize
    scaler = MinMaxScaler()
    norm_xgb = scaler.fit_transform(xgb_imp.reshape(-1, 1)).flatten()
    norm_shap = scaler.fit_transform(shap_imp.reshape(-1, 1)).flatten()
    avg_imp = (norm_xgb + norm_shap) / 2
    
    imp_df = pd.DataFrame({
        'Feature': SELECTED_FEATURES,
        'XGB_Importance': norm_xgb,
        'SHAP_Importance': norm_shap,
        'Combined_Importance': avg_imp
    }).sort_values(by='Combined_Importance', ascending=False)
    
    # 2. Local Explanations (10 Rows)
    test_indices = np.random.choice(X_test.index, 10, replace=False)
    local_explanations = []
    
    for idx_val in test_indices:
        iloc_idx = X_test.index.get_loc(idx_val)
        row_values = X_test.iloc[[iloc_idx]]
        pred_class_idx = y_pred[iloc_idx]
        actual_class = class_names[y_test[iloc_idx]]
        pred_class = class_names[pred_class_idx]
        
        shap_values_single = explainer.shap_values(row_values)
        
        if isinstance(shap_values_single, list):
            shap_vals_row = shap_values_single[pred_class_idx][0]
        else:
            if len(shap_values_single.shape) == 3:
                shap_vals_row = shap_values_single[0, :, pred_class_idx]
            else:
                shap_vals_row = shap_values_single[0]
        
        contribs = dict(zip(SELECTED_FEATURES, shap_vals_row))
        sorted_attribs = sorted(contribs.items(), key=lambda x: x[1], reverse=True)
        top_pos = [k for k, v in sorted_attribs if v > 0][:3]
        top_neg = [k for k, v in sorted_attribs if v < 0][-3:]
        
        explanation = f"**Row {idx_val}** | Actual: `{actual_class}` | Predicted: `{pred_class}`\n"
        explanation += "- **Increases Risk/Prob**: " + ", ".join([f"`{f}` ({contribs[f]:.2f})" for f in top_pos]) + "\n"
        explanation += "- **Decreases Risk/Prob**: " + ", ".join([f"`{f}` ({contribs[f]:.2f})" for f in top_neg]) + "\n"
        local_explanations.append(explanation)

    # --- Report Generation ---
    with open('risk_model_report.md', 'w') as f:
        f.write("# Risk Model (V2) Analysis Report\n\n")
        f.write(f"**Model**: XGBoost (Selected Features)\n")
        f.write(f"**Test Set Accuracy**: {acc:.4%}\n\n")
        
        f.write("## 1. Classification Metrics\n```\n")
        f.write(classification_report(y_test, y_pred, target_names=class_names))
        f.write("\n```\n\n")
        
        f.write("## 2. Feature Importance (Combined)\n")
        f.write("| Feature | Combined Score | XGB (Norm) | SHAP (Norm) |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for _, row in imp_df.iterrows():
            f.write(f"| `{row['Feature']}` | {row['Combined_Importance']:.4f} | {row['XGB_Importance']:.4f} | {row['SHAP_Importance']:.4f} |\n")
            
        f.write("\n## 3. Local Explanations (10 Sample Test Rows)\n")
        for exp in local_explanations:
            f.write(exp + "\n")
            
    print("Report generated: risk_model_report.md")

if __name__ == "__main__":
    train_risk_model()
