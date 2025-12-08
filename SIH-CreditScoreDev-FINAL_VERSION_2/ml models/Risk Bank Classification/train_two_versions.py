import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

def train_model_version(df_train, cols_to_drop, version_name, artifacts_path):
    """Train a single model version with specific feature exclusions"""
    print(f"\n{'='*100}")
    print(f"TRAINING {version_name.upper()}")
    print(f"{'='*100}")
    
    # Feature Engineering
    df_train['dependency_ratio'] = df_train['family_size'] / (df_train['dependents_count'] + 1e-5)
    
    # Drop specified columns
    df_model = df_train.drop(columns=[c for c in cols_to_drop if c in df_train.columns])
    target = 'risk_score'
    
    print(f"Training dataset: {df_model.shape[0]} samples, {df_model.shape[1]-1} features")
    print(f"Features excluded: {len([c for c in cols_to_drop if c in df_train.columns])}")
    
    # Stratified splitting
    print(f"\nCreating 5 stratified subsets...")
    df_model['risk_category'] = pd.cut(
        df_model[target], 
        bins=[0, 40, 60, 100], 
        labels=['Low', 'Medium', 'High'],
        include_lowest=True
    )
    
    n_splits = 5
    stratified_subsets = []
    
    low_risk_df = df_model[df_model['risk_category'] == 'Low'].copy()
    medium_risk_df = df_model[df_model['risk_category'] == 'Medium'].copy()
    high_risk_df = df_model[df_model['risk_category'] == 'High'].copy()
    
    low_risk_df = low_risk_df.sample(frac=1, random_state=42).reset_index(drop=True)
    medium_risk_df = medium_risk_df.sample(frac=1, random_state=42).reset_index(drop=True)
    high_risk_df = high_risk_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    low_splits = np.array_split(low_risk_df, n_splits)
    medium_splits = np.array_split(medium_risk_df, n_splits)
    high_splits = np.array_split(high_risk_df, n_splits)
    
    for i in range(n_splits):
        subset = pd.concat([low_splits[i], medium_splits[i], high_splits[i]], ignore_index=True)
        subset = subset.sample(frac=1, random_state=42).reset_index(drop=True)
        stratified_subsets.append(subset)
    
    # Prepare splits and encoders
    print(f"\nPreparing splits and encoders...")
    dataset_splits = []
    saved_encoders = None
    feature_names = None
    
    for i, subset in enumerate(stratified_subsets):
        subset_clean = subset.drop(columns=['risk_category'])
        
        X_raw = subset_clean.drop(columns=[target])
        y = subset_clean[target]
        
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            X_raw, y, test_size=0.2, random_state=42, stratify=pd.cut(y, bins=[0, 40, 60, 100])
        )
        
        cat_cols = X_train_raw.select_dtypes(include=['object', 'category']).columns
        label_encoders = {}
        
        X_train = X_train_raw.copy()
        X_test = X_test_raw.copy()
        
        for col in cat_cols:
            le = LabelEncoder()
            X_train[col] = le.fit_transform(X_train[col].astype(str))
            X_test[col] = le.transform(X_test[col].astype(str))
            label_encoders[col] = le
        
        if i == 0:
            saved_encoders = label_encoders
            feature_names = X_train.columns.tolist()
        
        dataset_splits.append({
            'subset_id': i + 1,
            'X_train': X_train,
            'X_test': X_test,
            'y_train': y_train,
            'y_test': y_test,
            'encoders': label_encoders
        })
    
    # Train models
    print(f"\nTraining 5 XGBoost models...")
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
    
    trained_models = []
    r2_scores = []
    rmse_scores = []
    
    for i, (config, data_split) in enumerate(zip(configs, dataset_splits)):
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
        
        model.fit(data_split['X_train'], data_split['y_train'])
        
        y_pred_test = model.predict(data_split['X_test'])
        test_rmse = np.sqrt(mean_squared_error(data_split['y_test'], y_pred_test))
        test_r2 = r2_score(data_split['y_test'], y_pred_test)
        
        trained_models.append(model)
        r2_scores.append(test_r2)
        rmse_scores.append(test_rmse)
        print(f"  {config['name']}: Test R²={test_r2:.4f}, RMSE={test_rmse:.4f}")
    
    avg_r2 = np.mean(r2_scores)
    avg_rmse = np.mean(rmse_scores)
    print(f"\nAverage R²: {avg_r2:.4f}")
    print(f"Average RMSE: {avg_rmse:.4f}")
    
    # Save artifacts
    print(f"\nSaving artifacts to {artifacts_path}...")
    artifacts = {
        'models': trained_models,
        'encoders': saved_encoders,
        'feature_names': feature_names,
        'cols_to_drop': cols_to_drop,
        'version': version_name,
        'metrics': {
            'r2': float(avg_r2),
            'rmse': float(avg_rmse),
            'num_models': len(trained_models),
            'num_features': len(feature_names)
        }
    }
    
    joblib.dump(artifacts, artifacts_path)
    print(f"✓ Artifacts saved successfully!")
    
    return {
        'success': True,
        'r2': float(avg_r2),
        'rmse': float(avg_rmse),
        'num_features': len(feature_names)
    }

def train_both_versions(dataset_path, output_dir):
    """Train both model versions"""
    print("="*100)
    print("DUAL VERSION RISK MODEL TRAINING PIPELINE")
    print("="*100)
    
    # Load data
    print(f"\nLoading data from {dataset_path}...")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
    
    df_train = pd.read_csv(dataset_path)
    print(f"Loaded {len(df_train)} rows")
    
    # VERSION 1: Fewer exclusions (more features)
    # Excludes: default_status and basic identifiers
    cols_to_drop_v1 = [
        'beneficiary_id', 'partner_id', 'loan_id', 'repayment_id',
        'gender', 'age', 'category', 'education_level', 'marital_status',
        'state', 'district', 'default_status',
        'bank_account_status', 'bank_name', 'account_type', 'loan_scheme',
        'guarantor_present', 'business_age',
        'last_payment_date', 'land_owned_acres',
        'collateral_required', 'loan_start_date', 'loan_end_date', 'Unnamed: 0'
    ]
    
    # VERSION 2: More exclusions (fewer features, more generalized)
    # Additionally excludes: annual_family_income, interest_rate, loan_purpose, sector, income_source
    cols_to_drop_v2 = [
        'beneficiary_id', 'partner_id', 'loan_id', 'repayment_id',
        'gender', 'age', 'category', 'education_level', 'marital_status',
        'state', 'district', 'annual_family_income', 'default_status',
        'bank_account_status', 'bank_name', 'account_type', 'loan_scheme',
        'interest_rate', 'guarantor_present', 'loan_purpose', 'business_age',
        'sector', 'last_payment_date', 'income_source', 'land_owned_acres',
        'collateral_required', 'loan_start_date', 'loan_end_date', 'Unnamed: 0'
    ]
    
    # Train Version 1
    v1_path = os.path.join(output_dir, 'risk_model_artifacts_v1.joblib')
    result_v1 = train_model_version(df_train.copy(), cols_to_drop_v1, 'v1_rich_features', v1_path)
    
    # Train Version 2
    v2_path = os.path.join(output_dir, 'risk_model_artifacts_v2.joblib')
    result_v2 = train_model_version(df_train.copy(), cols_to_drop_v2, 'v2_lean_features', v2_path)
    
    # Summary
    print("\n" + "="*100)
    print("TRAINING COMPLETE - SUMMARY")
    print("="*100)
    print(f"\n✓ VERSION 1 (Rich Features):")
    print(f"  - Features: {result_v1['num_features']}")
    print(f"  - R²: {result_v1['r2']:.4f}")
    print(f"  - RMSE: {result_v1['rmse']:.4f}")
    print(f"  - Path: {v1_path}")
    
    print(f"\n✓ VERSION 2 (Lean Features):")
    print(f"  - Features: {result_v2['num_features']}")
    print(f"  - R²: {result_v2['r2']:.4f}")
    print(f"  - RMSE: {result_v2['rmse']:.4f}")
    print(f"  - Path: {v2_path}")
    
    print("\n" + "="*100)
    
    return {
        'v1': result_v1,
        'v2': result_v2
    }

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, 'corrected_repayment_dataset.csv')
    
    if not os.path.exists(dataset_path):
        dataset_path = r'f:\SIH-CreditScoreDev-soham - Copy\ml models\Risk Bank Classification\corrected_repayment_dataset.csv'
    
    results = train_both_versions(dataset_path, current_dir)
    print("\n✓ Both versions trained successfully!")
