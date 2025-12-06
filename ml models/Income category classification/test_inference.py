import requests
import pandas as pd
import json
import time

URL = "http://localhost:5000"

def test_api():
    print("Loading test data...")
    df = pd.read_csv('primary_dataset.csv')
    
    # Pick 5 random rows
    sample = df.sample(5, random_state=101)
    
    report_lines = []
    report_lines.append("# Inference API Validation Report\n")
    report_lines.append(f"**Test Date**: {time.ctime()}\n\n")
    
    # Define Risk Features manually to ensure subsetting is correct for client simulation
    RISK_FEATURES = [
        'mobilerechargeamount_median', 'mobilerechargeamount_max', 'units_consumed_mean', 
        'units_consumed_max', 'mobile_bill_per_capita', 'electricitybilling_amount_mean', 
        'electricitybilling_amount_median', 'units_per_capita', 'electricity_bill_per_capita', 
        'gas_refill_subsidy_amt_std', 'gas_refill_subsidy_amt_mode', 'subsidy_ratio', 
        'missing_gas', 'missing_electricity', 'gas_refill_amt_mean'
    ]
    
    for idx, row in sample.iterrows():
        actual = row['income_category']
        print(f"\n--- Testing Row {idx} (Actual: {actual}) ---")
        
        # 1. Full Model
        payload_full = row.drop(['income_category', 'beneficiary_id', 'timestamp']).to_dict()
        start = time.time()
        try:
            res = requests.post(f"{URL}/predict_full", json=payload_full)
            lat = (time.time() - start) * 1000
            if res.status_code == 200:
                data = res.json()
                print(f"[Full] Pred: {data['prediction']} ({data['confidence']:.2f}) | Latency: {lat:.0f}ms")
                report_lines.append(f"## Row {idx} (Actual: {actual})\n")
                report_lines.append(f"**Full Model API**: Predicted `{data['prediction']}` ({data['confidence']:.2f}) in {lat:.0f}ms\n")
                report_lines.append(f"> {data['explanation']}\n\n")
            else:
                print(f"[Full] Error {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Full] Failed: {e}")

        # 2. Risk Model
        payload_risk = {k: row[k] for k in RISK_FEATURES}
        start = time.time()
        try:
            res = requests.post(f"{URL}/predict_risk", json=payload_risk)
            lat = (time.time() - start) * 1000
            if res.status_code == 200:
                data = res.json()
                print(f"[Risk] Pred: {data['prediction']} ({data['confidence']:.2f}) | Latency: {lat:.0f}ms")
                report_lines.append(f"**Risk Model API**: Predicted `{data['prediction']}` ({data['confidence']:.2f}) in {lat:.0f}ms\n")
                report_lines.append(f"> {data['explanation']}\n\n")
            else:
                print(f"[Risk] Error {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Risk] Failed: {e}")
            
    with open('inference_validation_report.md', 'w') as f:
        f.writelines(report_lines)
    print("\nReport saved to inference_validation_report.md")

if __name__ == "__main__":
    # Wait for API to come up
    time.sleep(5) 
    test_api()
