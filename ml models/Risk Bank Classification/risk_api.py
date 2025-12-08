import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import shap
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler
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
    
    # Allow switching to v3 if it exists
    if version not in ['v1', 'v2', 'v3']:
        return jsonify({'error': 'Invalid version. Use v1, v2 or v3'}), 400
    
    if version not in model_versions or not model_versions[version]['loaded']:
        # Try to load if v3
        if version == 'v3':
            if not load_model_version('v3'):
                return jsonify({'error': f'Version {version} not found or failed to load'}), 400
        else:
            return jsonify({'error': f'Version {version} not loaded'}), 400
    
    active_version = version
    return jsonify({
        'message': f'Switched to {version}',
        'active_version': active_version
    })

@app.route('/models/train_custom', methods=['POST'])
def train_custom_model():
    """Train V3 model with custom dataset and feature priority"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        import json
        config_str = request.form.get('priority_config', '[]')
        priority_features = json.loads(config_str) # List of feature names in order of priority
        
        # Load Dataset
        df = pd.read_csv(file)
        
        # --- Feature Engineering V3 (Priority Based) ---
        from sklearn.preprocessing import StandardScaler, MinMaxScaler
        
        # Basic cleaning
        df = df.fillna(0)
        
        # Identify features to keep (Priority ones + others)
        # For simplicity, we assume the dataset contains the necessary columns
        
        # Apply Priority Transformations
        # Rank 1: Original + MinMax (A) + Standard (B)
        # Rank 2: Original + MinMax (A) 
        # Rank 3: Original
        
        idx = 0
        for feat in priority_features:
            if feat in df.columns:
                idx += 1
                # Scale A (MinMax) - if Rank 1 or 2
                if idx <= 2:
                    scaler_a = MinMaxScaler()
                    col_name_a = f"{feat}_scaleA"
                    df[col_name_a] = scaler_a.fit_transform(df[[feat]])
                    
                # Scale B (Standard) - if Rank 1
                if idx <= 1:
                    scaler_b = StandardScaler()
                    col_name_b = f"{feat}_scaleB"
                    df[col_name_b] = scaler_b.fit_transform(df[[feat]])
        
        # Define target (assuming 'risk_score' or similar is target, or we emulate training)
        # For this demo, we will use 'risk_score' if present, else synthesize or use a default target
        # If no target, we can't really train. We'll assume the CSV has a target col 'target' or 'risk_score'
        target_col = 'risk_score' if 'risk_score' in df.columns else 'default_status'
        
        if target_col not in df.columns:
             # Fallback: Create dummy target for demo purposes if not provided
             df[target_col] = np.random.randint(0, 100, size=len(df))
             
        X = df.drop(columns=[target_col], errors='ignore')
        y = df[target_col]
        
        # Keep numeric cols only
        X = X.select_dtypes(include=[np.number])
        feature_names = X.columns.tolist()
        
        # Train Model (XGBoost)
        model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=100)
        model.fit(X, y)
        
        # Metric calculation (on Train set for demo)
        preds = model.predict(X)
        from sklearn.metrics import mean_squared_error, r2_score
        rmse = np.sqrt(mean_squared_error(y, preds))
        r2 = r2_score(y, preds)
        
        # Save Artifacts
        artifacts = {
            'models': [model], # Single model for v3
            'feature_names': feature_names,
            'encoders': {}, # Simplified
            'cols_to_drop': [],
            'metrics': {'rmse': float(rmse), 'r2': float(r2)},
            'version': 'v3'
        }
        
        v3_path = os.path.join(current_dir, 'risk_model_artifacts_v3.joblib')
        joblib.dump(artifacts, v3_path)
        
        # Load into memory
        global model_versions
        model_versions['v3'] = {
            'loaded': True,
            'artifacts': artifacts,
            'explainers': [shap.TreeExplainer(model)]
        }
        
        return jsonify({
            'message': 'V3 Model trained and saved successfully',
            'features': feature_names,
            'metrics': {'rmse': rmse, 'r2': r2},
            'version': 'v3',
            'priority_config': priority_features
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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
            
            # --- KMEANS CONSENSUS LOGIC ---
            
            # 1. Collect all explanation vectors
            explanation_vectors = []
            
            # Collect SHAP (Signed)
            for i, model in enumerate(models):
                shap_values = explainers[i].shap_values(sample)[0]
                # Normalize SHAP: signed / max(abs) -> [-1, 1] (approx)
                # We want to preserve sign for direction, but scale it relative to its own magnitude
                max_abs_shap = np.max(np.abs(shap_values)) + 1e-9
                shap_norm = shap_values / max_abs_shap
                explanation_vectors.append(shap_norm)
                
            # Collect XGBoost (Unsigned Importance)
            for i, model in enumerate(models):
                xgb_imp = model.feature_importances_
                # Normalize XGB: val / max -> [0, 1]
                max_xgb = np.max(xgb_imp) + 1e-9
                xgb_norm = xgb_imp / max_xgb
                explanation_vectors.append(xgb_norm)
            
            explanation_vectors = np.array(explanation_vectors) # Shape: (2*M, n_features)
            
            # 2. Apply KMeans Clustering
            # We have 2*M vectors (e.g., 10). Cluster into 2 groups.
            n_clusters = 2
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(explanation_vectors)
            
            # 3. Select Majority Cluster
            counts = np.bincount(cluster_labels)
            majority_cluster_idx = np.argmax(counts)
            
            # 4. Calculate Final Contribution (Mean of Majority Cluster)
            majority_vectors = explanation_vectors[cluster_labels == majority_cluster_idx]
            final_contribution = np.mean(majority_vectors, axis=0) # Shape: (n_features,)
            
            # 5. Create Result List
            contributions = []
            for i, feat in enumerate(feature_names):
                score = final_contribution[i]
                
                # Safe value extraction
                orig_val = df_input.iloc[idx].get(feat, sample.iloc[0, i])
                if hasattr(orig_val, 'item'):
                    orig_val = orig_val.item()
                    
                contributions.append({
                    'feature': feat,
                    'value': float(sample.iloc[0, i]),
                    'original_value': orig_val,
                    'score': float(score), # Sign determines direction, Magnitude determines importance
                    'abs_score': abs(float(score))
                })
            
            # Sort by absolute importance
            contributions.sort(key=lambda x: x['abs_score'], reverse=True)
            
            # Generate explanation for ALL features
            explanation_text = generate_explanation(ensemble_pred, contributions)
            
            # Write to explanations.txt (Overwrite for latest prediction)
            try:
                with open('explanations.txt', 'w') as f:
                    f.write(explanation_text)
            except Exception as ex:
                print(f"Error writing to explanations.txt: {ex}")
            
            results.append({
                'risk_score': ensemble_pred,
                'risk_category': get_risk_category(ensemble_pred),
                'explanation': explanation_text,
                'top_factors': contributions[:10], # Keep top 10 for API response structure
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
    explanation += "=" * 50 + "\n"
    explanation += "DETAILED RISK ANALYSIS (Sorted by Importance)\n"
    explanation += "=" * 50 + "\n\n"
    
    for item in contributions:
        feat = item['feature']
        score_val = item['score']
        points = abs(score_val) * 100 # Scale up for readability (arbitrary unit)
        
        # Determine direction based on sign of consensus score
        if score_val > 0:
            direction = "INCREASES"
        else:
            direction = "DECREASES"
            
        # Clean feature name for display
        feat_display = feat.replace('_', ' ').capitalize()
        
        explanation += f"• {feat_display}: {direction} risk (Impact: {points:.2f})\n"
        
        # Add context based on feature name (Simple rules)
        val = item['original_value']
        if 'outstanding' in feat.lower():
            if score_val > 0:
                explanation += f"  - High outstanding amount ({val}) is a risk factor.\n"
            else:
                explanation += f"  - Managed outstanding amount ({val}) stabilizes risk.\n"
        elif 'delay' in feat.lower() or 'overdue' in feat.lower():
            if score_val > 0:
                explanation += f"  - Payment inconsistencies detected.\n"
            else:
                explanation += f"  - Minimal delays observed.\n"
        elif 'income' in feat.lower():
            if score_val < 0: # Risk decreasing
                explanation += f"  - Income level ({val}) supports repayment capacity.\n"
            else:
                explanation += f"  - Income level relative to obligations is a concern.\n"
        
        explanation += "\n"
            
    return explanation

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
