from flask import Flask, request, jsonify
import xgboost as xgb
import joblib
import pandas as pd
import shap
import numpy as np

app = Flask(__name__)

# --- Load Artifacts ---
print("Loading models and artifacts...")
model_full = xgb.XGBClassifier()
model_full.load_model("model_full.json")

model_risk = xgb.XGBClassifier()
model_risk.load_model("model_risk.json")

le = joblib.load("label_encoder.joblib")
class_names = list(le.classes_)
print(f"Loaded Classes: {class_names}")

# Initialize Explainers (this might vary slightly based on XGB version compatibility)
# For efficiency in API, we might skip full TreeExplainer init per request if possible
# But TreeExplainer(model) is generally fast for trees.
explainer_full = shap.TreeExplainer(model_full)
explainer_risk = shap.TreeExplainer(model_risk)

# Defined features for Risk Model to ensure correct order
RISK_FEATURES = [
    'mobilerechargeamount_median', 'mobilerechargeamount_max', 'units_consumed_mean', 
    'units_consumed_max', 'mobile_bill_per_capita', 'electricitybilling_amount_mean', 
    'electricitybilling_amount_median', 'units_per_capita', 'electricity_bill_per_capita', 
    'gas_refill_subsidy_amt_std', 'gas_refill_subsidy_amt_mode', 'subsidy_ratio', 
    'missing_gas', 'missing_electricity', 'gas_refill_amt_mean'
]

def generate_explanation(explainer, df_row, pred_idx, feature_names):
    # Calculate SHAP values for this single instance
    shap_vals = explainer.shap_values(df_row)
    
    # Handle SHAP output format (list of arrays vs array)
    if isinstance(shap_vals, list):
        # List of [1, n_features] -> select class index
        vals = shap_vals[pred_idx][0]
    else:
        if len(shap_vals.shape) == 3:
            vals = shap_vals[0, :, pred_idx]
        else:
            vals = shap_vals[0]
            
    # Map to feature names
    contribs = dict(zip(feature_names, vals))
    
    # Top 3 Positive (Increase Risk/Prob of this class)
    sorted_contribs = sorted(contribs.items(), key=lambda x: x[1], reverse=True)
    
    # Correction: 'sorted_attribs' variable name typo fix
    top_pos = [f"{k} (+{v:.2f})" for k, v in sorted_contribs if v > 0][:3]
    top_neg = [f"{k} ({v:.2f})" for k, v in sorted_contribs if v < 0][-3:]
    
    text = f"Top Factors for {class_names[pred_idx]}: "
    if top_pos:
        text += "Increases: " + ", ".join(top_pos) + ". "
    if top_neg:
        text += "Decreases: " + ", ".join(top_neg) + "."
        
    return text

@app.route('/predict_full', methods=['POST'])
def predict_full():
    try:
        data = request.json
        print(f"Received Full Request. Keys: {list(data.keys())}")
        
        # Get feature names from booster
        booster = model_full.get_booster()
        # feature_names might be None if loaded from JSON without names, but save_model usually preservers them
        feature_names = booster.feature_names
        
        if not feature_names:
            print("WARNING: Model has no feature names. Using keys from request sorted?")
            # This is risky. Let's assume training columns order if we knew it.
            # But we saved as JSON.
            feature_names = list(data.keys()) # Fallback (dangerous)

        print(f"Model Feature Names (First 5): {feature_names[:5]}")
        
        # DataFrame construction
        df_in = pd.DataFrame([data])
        
        # Reorder/Fill missing
        missing_cols = [c for c in feature_names if c not in df_in.columns]
        if missing_cols:
            print(f"Missing columns filled with 0: {missing_cols}")
            for col in missing_cols:
                df_in[col] = 0.0
                
        df_in = df_in[feature_names]
        
        # Predict
        probs = model_full.predict_proba(df_in)[0]
        pred_idx = np.argmax(probs)
        pred_class = class_names[pred_idx]
        confidence = float(probs[pred_idx])
        
        # Explain
        explanation = "Explanation unavailable."
        try:
            explanation = generate_explanation(explainer_full, df_in, pred_idx, feature_names)
        except Exception as e_shap:
            print(f"SHAP Error: {e_shap}")
            explanation = f"Could not generate explanation: {str(e_shap)}"
        
        return jsonify({
            'model': 'Full Model (V1)',
            'prediction': pred_class,
            'confidence': confidence,
            'explanation': explanation
        })
        
    except Exception as e:
        print(f"FULL API ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/predict_risk', methods=['POST'])
def predict_risk():
    try:
        data = request.json
        print(f"Received Risk Request. Keys: {list(data.keys())}")
        
        # Validate subset
        df_in = pd.DataFrame([data])
        
        # Ensure only RISK features and in order
        missing = [c for c in RISK_FEATURES if c not in df_in.columns]
        if missing:
            print(f"Missing Risk Features: {missing}")
            return jsonify({'error': f'Missing feature: {missing}'}), 400
        
        df_in = df_in[RISK_FEATURES]
        
        # Predict
        probs = model_risk.predict_proba(df_in)[0]
        pred_idx = np.argmax(probs)
        pred_class = class_names[pred_idx]
        confidence = float(probs[pred_idx])
        
        # Explain
        explanation = "Explanation unavailable."
        try:
            explanation = generate_explanation(explainer_risk, df_in, pred_idx, RISK_FEATURES)
        except Exception as e_shap:
             print(f"SHAP Error (Risk): {e_shap}")
             explanation = f"Error explaining: {e_shap}"
        
        return jsonify({
            'model': 'Risk Model (V2)',
            'prediction': pred_class,
            'confidence': confidence,
            'explanation': explanation
        })
        
    except Exception as e:
        print(f"RISK API ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("Starting Inference API on port 5000...")
    app.run(host='0.0.0.0', port=5000)
