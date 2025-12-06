import pandas as pd
import numpy as np
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder, MinMaxScaler

import joblib

def train_and_explain():
    print("Loading data...")
    df = pd.read_csv('primary_dataset.csv')
    
    # Preprocessing
    drop_cols = ['beneficiary_id', 'timestamp']
    X = df.drop(columns=['income_category'] + drop_cols, errors='ignore')
    y = df['income_category']
    
    # Encode Target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    # Save Label Encoder
    joblib.dump(le, "label_encoder.joblib")
    print("LabelEncoder saved to label_encoder.joblib")
    
    # Note mapping
    class_names = list(le.classes_)
    print(f"Classes: {class_names}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.20, random_state=42)
    
    # XGBoost
    print("Training XGBoost...")
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
    model.save_model("model_full.json")
    print("Model saved to model_full.json")
    
    # Predictions
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    
    # --- Explainability ---
    print("Generating Explanations...")
    
    # 1. Combined Global Importance
    # XGBoost Importance
    xgb_imp = model.feature_importances_
    print(f"XGB Importance Shape: {xgb_imp.shape}")
    
    # SHAP Importance
    # Use a smaller subset for global importance to speed up
    X_shap_subset = X_test.sample(n=min(1000, len(X_test)), random_state=42)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_shap_subset)
    
    # Handle SHAP output structure (list vs array)
    if isinstance(shap_values, list):
        # Format: List of [n_samples, n_features] per class
        # Convert to array: (n_classes, n_samples, n_features)
        shap_arr = np.array(shap_values)
        print(f"SHAP Values Shape (from list): {shap_arr.shape}")
        # Mean across classes (axis 0) and samples (axis 1) -> (n_features,)
        shap_imp = np.mean(np.abs(shap_arr), axis=(0, 1))
    else:
        # Format might be (n_samples, n_features) [binary] or (n_samples, n_features, n_classes)
        print(f"SHAP Values Shape (direct): {shap_values.shape}")
        if len(shap_values.shape) == 3:
             # (n_samples, n_features, n_classes) -> Mean across samples (0) and classes (2)
             shap_imp = np.mean(np.abs(shap_values), axis=(0, 2))
        else:
             # (n_samples, n_features)
             shap_imp = np.mean(np.abs(shap_values), axis=0)
             
    print(f"Calculated SHAP Importance Shape: {shap_imp.shape}")

    # Normalize both
    scaler = MinMaxScaler()
    norm_xgb = scaler.fit_transform(xgb_imp.reshape(-1, 1)).flatten()
    norm_shap = scaler.fit_transform(shap_imp.reshape(-1, 1)).flatten()
    
    avg_imp = (norm_xgb + norm_shap) / 2
    
    feature_names = X.columns
    imp_df = pd.DataFrame({
        'Feature': feature_names,
        'XGB_Importance': norm_xgb,
        'SHAP_Importance': norm_shap,
        'Combined_Importance': avg_imp
    }).sort_values(by='Combined_Importance', ascending=False)
    
    # 2. Local Explanations (10 Rows)
    test_indices = np.random.choice(X_test.index, 10, replace=False)
    local_explanations = []
    
    # We need to re-compute shap values for these SPECIFIC 10 rows if they weren't in the subset
    # Or just explain them individually
    
    for idx_val in test_indices:
        iloc_idx = X_test.index.get_loc(idx_val)
        
        row_values = X_test.iloc[[iloc_idx]] # Keep as DF
        pred_class_idx = y_pred[iloc_idx]
        actual_class = class_names[y_test[iloc_idx]]
        pred_class = class_names[pred_class_idx]
        
        # Explain this single row
        # shap_values_single returns list of arrays for this one row
        shap_values_single = explainer.shap_values(row_values)
        
        if isinstance(shap_values_single, list):
            # list of (1, n_features), select the one for the predicted class
            shap_vals_row = shap_values_single[pred_class_idx][0]
        else:
            if len(shap_values_single.shape) == 3:
                shap_vals_row = shap_values_single[0, :, pred_class_idx]
            else:
                shap_vals_row = shap_values_single[0]
        
        # Create dict feature -> contribution
        contribs = dict(zip(feature_names, shap_vals_row))
        
        # Sort by impact
        sorted_attribs = sorted(contribs.items(), key=lambda x: x[1], reverse=True)
        top_pos = [k for k, v in sorted_attribs if v > 0][:3]
        top_neg = [k for k, v in sorted_attribs if v < 0][-3:] # Most negative
        
        explanation = f"**Row {idx_val}** | Actual: `{actual_class}` | Predicted: `{pred_class}`\n"
        explanation += "- **Increases Risk/Prob**: " + ", ".join([f"`{f}` ({contribs[f]:.2f})" for f in top_pos]) + "\n"
        explanation += "- **Decreases Risk/Prob**: " + ", ".join([f"`{f}` ({contribs[f]:.2f})" for f in top_neg]) + "\n"
        local_explanations.append(explanation)

    # --- Report Generation ---
    with open('model_report.md', 'w') as f:
        f.write("# Model Training & Analysis Report\n\n")
        f.write(f"**Model**: XGBoost Classifier\n")
        f.write(f"**Test Set Accuracy**: {acc:.4%}\n\n")
        
        f.write("## 1. Classification Metrics\n```\n")
        f.write(classification_report(y_test, y_pred, target_names=class_names))
        f.write("\n```\n\n")
        
        f.write("## 2. Top 15 Features (Combined Importance)\n")
        f.write("| Feature | Combined Score | XGB (Norm) | SHAP (Norm) |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for _, row in imp_df.head(15).iterrows():
            f.write(f"| `{row['Feature']}` | {row['Combined_Importance']:.4f} | {row['XGB_Importance']:.4f} | {row['SHAP_Importance']:.4f} |\n")
            
        f.write("\n## 3. Local Explanations (10 Sample Test Rows)\n")
        f.write("Analysis of features increasing or decreasing the probability of the *predicted* class.\n\n")
        for exp in local_explanations:
            f.write(exp + "\n")
            
    print("Report generated: model_report.md")

if __name__ == "__main__":
    train_and_explain()
