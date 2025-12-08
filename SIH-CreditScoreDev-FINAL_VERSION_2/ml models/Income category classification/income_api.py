import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import shap
from flask import Flask, request, jsonify
import os
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)

# --- Configuration ---
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_FILES = {
    'v1': 'model_full.json',
    'v2': 'model_risk.json'
}
ENCODER_FILE = 'label_encoder.joblib'

# Risk Model Config (Features must match training EXACTLY)
RISK_FEATURES = [
    'mobilerechargeamount_median', 'mobilerechargeamount_max', 'units_consumed_mean', 
    'units_consumed_max', 'mobile_bill_per_capita', 'electricitybilling_amount_mean', 
    'electricitybilling_amount_median', 'units_per_capita', 'electricity_bill_per_capita', 
    'gas_refill_subsidy_amt_std', 'gas_refill_subsidy_amt_mode', 'subsidy_ratio', 
    'missing_gas', 'missing_electricity', 'gas_refill_amt_mean'
]

# --- Global State ---
model_versions = {
    'v1': {'loaded': False, 'model': None, 'explainer': None, 'features': None},
    'v2': {'loaded': False, 'model': None, 'explainer': None, 'features': RISK_FEATURES} 
}
active_version = 'v1'
label_encoder = None
class_names = []

def load_encoder():
    global label_encoder, class_names
    path = os.path.join(current_dir, ENCODER_FILE)
    try:
        label_encoder = joblib.load(path)
        class_names = list(label_encoder.classes_)
        print(f"✓ Loaded LabelEncoder: {class_names}")
    except Exception as e:
        print(f"❌ Error loading LabelEncoder: {e}")

def load_model_version(version):
    global model_versions
    if version not in MODEL_FILES:
        return False
    
    path = os.path.join(current_dir, MODEL_FILES[version])
    print(f"Loading {version} from {path}...")
    
    try:
        model = xgb.XGBClassifier()
        model.load_model(path)
        
        # Initialize Explainer
        explainer = shap.TreeExplainer(model)
        
        # Determine features
        if version == 'v1':
            # Try to get from booster
            booster = model.get_booster()
            features = booster.feature_names
            if not features:
                print(f"⚠️ Warning: V1 model has no internal feature names. Expecting input to match training columns perfectly.")
                # We can't strictly enforce without names, but we proceed.
        else:
            features = RISK_FEATURES # V2 is strictly defined
            
        model_versions[version] = {
            'loaded': True,
            'model': model,
            'explainer': explainer,
            'features': features
        }
        print(f"✓ Loaded {version}")
        return True
    except Exception as e:
        print(f"❌ Error loading {version}: {e}")
        return False

# --- Helper Functions ---
def generate_explanation(explainer, df_row, pred_idx, feature_names):
    try:
        shap_vals = explainer.shap_values(df_row)
        
        if isinstance(shap_vals, list):
            vals = shap_vals[pred_idx][0]
        else:
            if len(shap_vals.shape) == 3:
                vals = shap_vals[0, :, pred_idx]
            else:
                vals = shap_vals[0]
                
        # Handle case where feature_names might be None (V1 fallback)
        if not feature_names:
            feature_names = df_row.columns.tolist()
            
        contribs = dict(zip(feature_names, vals))
        sorted_contribs = sorted(contribs.items(), key=lambda x: x[1], reverse=True)
        
        # Top 3 Positive/Negative
        top_pos = [f"{k} (+{v:.2f})" for k, v in sorted_contribs if v > 0][:3]
        top_neg = [f"{k} ({v:.2f})" for k, v in sorted_contribs if v < 0][-3:]
        
        text = f"Factors for {class_names[pred_idx]}: "
        if top_pos: text += "Increases: " + ", ".join(top_pos) + ". "
        if top_neg: text += "Decreases: " + ", ".join(top_neg) + "."
        return text
    except Exception as e:
        return f"Explanation error: {str(e)}"

# --- Startup ---
print("="*60)
print("INCOME CLASSIFICATION API - INITIALIZING")
print("="*60)
load_encoder()
load_model_version('v1')
load_model_version('v2')
print(f"Active version: {active_version}")

# --- Endpoints ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'active_version': active_version,
        'versions_loaded': {v: data['loaded'] for v, data in model_versions.items()}
    })

@app.route('/models/info', methods=['GET'])
def get_models_info():
    info = {}
    for v, data in model_versions.items():
        if data['loaded']:
            feats = data['features']
            info[v] = {
                'loaded': True,
                'num_features': len(feats) if feats else 'Unknown',
                'features': feats,
                'metrics': {
                    'accuracy': 0.8124 if v == 'v1' else 0.8062
                }
            }
        else:
            info[v] = {'loaded': False}
    return jsonify({'active_version': active_version, 'versions': info})

@app.route('/models/switch/<version>', methods=['POST'])
def switch_version(version):
    global active_version
    if version not in model_versions:
        return jsonify({'error': 'Invalid version'}), 400
    if not model_versions[version]['loaded']:
        return jsonify({'error': f'Version {version} not loaded'}), 400
    
    active_version = version
    return jsonify({'message': f'Switched to {version}', 'active_version': active_version})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data: return jsonify({'error': 'No data provided'}), 400
        
        # Allow override
        use_version = data.pop('model_version', active_version)
        if use_version not in model_versions or not model_versions[use_version]['loaded']:
            return jsonify({'error': f'Invalid or unloaded version: {use_version}'}), 400
            
        info = model_versions[use_version]
        model = info['model']
        explainer = info['explainer']
        target_features = info['features']
        
        # Prepare DataFrame
        df_in = pd.DataFrame([data])
        
        # Feature Alignment
        if target_features:
            # Check missing
            missing = [c for c in target_features if c not in df_in.columns]
            if missing:
                # If V2 (Risk), fail. If V1, maybe warn but fail is safer for API.
                # Risk API allows filling 0, let's allow filling 0 for robustness
                for c in missing: df_in[c] = 0.0
            
            # Reorder
            df_in = df_in[target_features]
        else:
            # Fallback for V1 if no features saved (unlikely with XGB JSON)
            pass 
            
        # Predict
        probs = model.predict_proba(df_in)[0]
        pred_idx = np.argmax(probs)
        pred_class = class_names[pred_idx]
        confidence = float(probs[pred_idx])
        
        # Explain
        explanation = generate_explanation(explainer, df_in, pred_idx, target_features)
        
        response = {
            'model_version': use_version,
            'prediction': pred_class,
            'confidence': confidence,
            'explanation': explanation,
            'top_factors': [] # Simplified for now, can expand to full list if needed like Risk API
        }
        
        # Format similar to Risk API list return (though here usually 1 item)
        # Risk API returned list of results (batch). Let's return list to be EXACTLY similar.
        return jsonify([response])
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Use port 5000 (Risk uses 5001)
    app.run(host='0.0.0.0', port=5002, debug=True)
