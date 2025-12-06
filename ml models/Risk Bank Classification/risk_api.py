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

# Global variables for models
current_dir = os.path.dirname(os.path.abspath(__file__))
v1_artifacts_path = os.path.join(current_dir, 'risk_model_artifacts_v1.joblib')
v2_artifacts_path = os.path.join(current_dir, 'risk_model_artifacts_v2.joblib')

# Model storage
model_versions = {
    'v1': {'loaded': False, 'artifacts': None, 'explainers': None},
    'v2': {'loaded': False, 'artifacts': None, 'explainers': None}
}

active_version = 'v1'  

def load_model_version(version):
    """Load a specific model version"""
    global model_versions
    
    if version not in ['v1', 'v2']:
        raise ValueError(f"Invalid version: {version}")
    
    path = v1_artifacts_path if version == 'v1' else v2_artifacts_path
    
    print(f"Loading {version} from {path}...")
    try:
        artifacts = joblib.load(path)
        models = artifacts['models']
        
        # Pre-initialize explainers
        print(f"Initializing SHAP explainers for {version}...")
        explainers = [shap.TreeExplainer(model) for model in models]
        
        model_versions[version] = {
            'loaded': True,
            'artifacts': artifacts,
            'explainers': explainers
        }
        
        print(f"✓ Loaded {version}: {len(models)} models, {len(artifacts['feature_names'])} features")
        return True
    except Exception as e:
        print(f"❌ Error loading {version}: {e}")
        return False

# Load both versions on startup
print("="*80)
print("RISK CLASSIFICATION API - INITIALIZING")
print("="*80)
load_model_version('v1')
load_model_version('v2')
print(f"Active version: {active_version}")
print("="*80)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'active_version': active_version,
        'versions_loaded': {
            'v1': model_versions['v1']['loaded'],
            'v2': model_versions['v2']['loaded']
        }
    })

@app.route('/models/info', methods=['GET'])
def get_models_info():
    """Get information about loaded models"""
    info = {}
    for version in ['v1', 'v2']:
        if model_versions[version]['loaded']:
            artifacts = model_versions[version]['artifacts']
            info[version] = {
                'num_models': len(artifacts['models']),
                'num_features': len(artifacts['feature_names']),
                'features': artifacts['feature_names'],
                'metrics': artifacts.get('metrics', {}),
                'version_name': artifacts.get('version', version)
            }
        else:
            info[version] = {'loaded': False}
    
    return jsonify({
        'active_version': active_version,
        'versions': info
    })

@app.route('/models/switch/<version>', methods=['POST'])
def switch_version(version):
    """Switch active model version"""
    global active_version
    
    if version not in ['v1', 'v2']:
        return jsonify({'error': 'Invalid version. Use v1 or v2'}), 400
    
    if not model_versions[version]['loaded']:
        return jsonify({'error': f'Version {version} not loaded'}), 400
    
    active_version = version
    return jsonify({
        'message': f'Switched to {version}',
        'active_version': active_version
    })

@app.route('/predict', methods=['POST'])
def predict_risk():
    """Predict risk score using active model version"""
    try:
        # Get request parameters
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Allow version override in request
        use_version = data.pop('model_version', active_version)
        
        if use_version not in ['v1', 'v2']:
            return jsonify({'error': 'Invalid model_version. Use v1 or v2'}), 400
        
        if not model_versions[use_version]['loaded']:
            return jsonify({'error': f'Version {use_version} not loaded'}), 400
        
        # Get artifacts for the selected version
        artifacts = model_versions[use_version]['artifacts']
        explainers = model_versions[use_version]['explainers']
        models = artifacts['models']
        encoders = artifacts['encoders']
        feature_names = artifacts['feature_names']
        cols_to_drop = artifacts['cols_to_drop']
        
        # Convert to DataFrame
        if isinstance(data, dict):
            df_input = pd.DataFrame([data])
        else:
            df_input = pd.DataFrame(data)
        
        # Preprocessing
        if 'family_size' in df_input.columns and 'dependents_count' in df_input.columns:
            df_input['dependency_ratio'] = df_input['family_size'] / (df_input['dependents_count'] + 1e-5)
        
        # Drop columns
        df_model = df_input.drop(columns=[c for c in cols_to_drop if c in df_input.columns])
        
        # Encode categoricals
        for col, le in encoders.items():
            if col in df_model.columns:
                df_model[col] = df_model[col].astype(str)
                
                def safe_transform(x):
                    try:
                        return le.transform([x])[0]
                    except ValueError:
                        return 0
                
                df_model[col] = df_model[col].apply(safe_transform)
        
        # Ensure column order
        for col in feature_names:
            if col not in df_model.columns:
                df_model[col] = 0
        
        X_test = df_model[feature_names]
        
        # Prediction & Explanation
        results = []
        
        for idx in range(len(X_test)):
            sample = X_test.iloc[[idx]]
            
            # Ensemble prediction
            ensemble_preds = [model.predict(sample)[0] for model in models]
            ensemble_pred = float(np.mean(ensemble_preds))
            
            # Generate explanations
            shap_values_list = []
            xgb_importance_list = []
            
            for i, model in enumerate(models):
                shap_values = explainers[i].shap_values(sample)
                shap_values_list.append(shap_values[0])
                xgb_importance_list.append(model.feature_importances_)
            
            # Average explanations
            avg_shap = np.mean(shap_values_list, axis=0)
            avg_xgb = np.mean(xgb_importance_list, axis=0)
            
            # Normalize scores
            shap_abs = np.abs(avg_shap)
            shap_min, shap_max = shap_abs.min(), shap_abs.max()
            shap_norm = (shap_abs - shap_min) / (shap_max - shap_min + 1e-9)
            
            xgb_min, xgb_max = avg_xgb.min(), avg_xgb.max()
            xgb_norm = (avg_xgb - xgb_min) / (xgb_max - xgb_min + 1e-9)
            
            # Combined score
            combined_score = (shap_norm + xgb_norm) / 2.0
            
            # Create contribution list
            contributions = []
            for i, feat in enumerate(feature_names):
                signed_score = combined_score[i] if avg_shap[i] >= 0 else -combined_score[i]
                contributions.append({
                    'feature': feat,
                    'value': float(sample.iloc[0, i]),
                    'original_value': df_input.iloc[idx].get(feat, sample.iloc[0, i]),
                    'score': float(signed_score),
                    'shap': float(avg_shap[i]),
                    'xgb': float(avg_xgb[i])
                })
            
            contributions.sort(key=lambda x: abs(x['score']), reverse=True)
            
            # Generate explanation
            explanation_text = generate_explanation(ensemble_pred, contributions)
            
            results.append({
                'risk_score': ensemble_pred,
                'risk_category': get_risk_category(ensemble_pred),
                'explanation': explanation_text,
                'top_factors': contributions[:10],
                'model_version': use_version,
                'num_features': len(feature_names)
            })
        
        return jsonify(results)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_risk_category(score):
    if score >= 60: return "High"
    if score >= 40: return "Medium"
    return "Low"

def generate_explanation(score, contributions):
    explanation = f"Risk Score: {score:.2f} ({get_risk_category(score)})\n"
    
    top_positive = [c for c in contributions if c['score'] > 0][:3]
    top_negative = [c for c in contributions if c['score'] < 0][:3]
    
    if top_positive:
        explanation += "\nRISK INCREASING FACTORS:\n"
        for item in top_positive:
            feat = item['feature']
            points = abs(item['score']) * 10
            
            if 'outstanding' in feat.lower():
                explanation += f"• High outstanding amount adds ~{points:.1f} risk points\n"
            elif 'delay' in feat.lower():
                explanation += f"• Payment delays add ~{points:.1f} risk points\n"
            elif 'late' in feat.lower() or 'missed' in feat.lower():
                explanation += f"• Late/missed payments add ~{points:.1f} risk points\n"
            else:
                explanation += f"• {feat} adds ~{points:.1f} risk points\n"
    
    if top_negative:
        explanation += "\nRISK DECREASING FACTORS:\n"
        for item in top_negative:
            feat = item['feature']
            points = abs(item['score']) * 10
            
            if 'paid' in feat.lower() or 'on_time' in feat.lower():
                explanation += f"• Consistent on-time payments reduce risk by ~{points:.1f} points\n"
            else:
                explanation += f"• {feat} reduces risk by ~{points:.1f} points\n"
    
    return explanation

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
