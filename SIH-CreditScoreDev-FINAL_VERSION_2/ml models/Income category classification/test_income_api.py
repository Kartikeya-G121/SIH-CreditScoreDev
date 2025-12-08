import requests
import pandas as pd
import json
import time

URL = "http://localhost:5000"

def test_income_api():
    print(f"Connecting to Income API at {URL}...")
    
    # 1. Health Check
    try:
        res = requests.get(f"{URL}/health")
        if res.status_code == 200:
            data = res.json()
            print(f"Health Check: OK | Active: {data.get('active_version')} | Loaded: {data.get('versions_loaded')}")
        else:
            print(f"Health Check Failed: {res.text}")
            return
    except Exception as e:
        print(f"Connection Failed: {e}")
        return

    print("Loading test data...")
    df = pd.read_csv('primary_dataset.csv')
    sample = df.sample(3, random_state=101)
    
    report_lines = []
    report_lines.append("# Income Classification API Validation Report")
    report_lines.append(f"**Test Date**: {time.ctime()}\n")

    # 2. Test V1 (Full Model) - Default
    print("\n--- Testing V1 (Full) ---")
    requests.post(f"{URL}/models/switch/v1")
    
    for idx, row in sample.iterrows():
        print(f"Row {idx}:")
        payload = row.drop(['income_category', 'beneficiary_id', 'timestamp']).to_dict()
        
        start = time.time()
        res = requests.post(f"{URL}/predict", json=payload)
        lat = (time.time() - start) * 1000
        
        if res.status_code == 200:
            # API returns list
            data = res.json()[0]
            print(f"  [V1] Pred: {data['prediction']} ({data['confidence']:.2f})")
            report_lines.append(f"## Row {idx} (V1)")
            report_lines.append(f"- **Pred**: `{data['prediction']}` ({data['confidence']:.2f})")
            report_lines.append(f"- **Explanation**: {data['explanation']}\n")
        else:
            print(f"  [V1] Error: {res.text}")
            
    # 3. Test V2 (Risk Model) - Switching
    print("\n--- Switching to V2 (Risk) ---")
    res = requests.post(f"{URL}/models/switch/v2")
    if res.status_code == 200:
        print("Switched to V2.")
    else:
        print(f"Switch Failed: {res.text}")
        
    for idx, row in sample.iterrows():
        print(f"Row {idx}:")
        # Payload can be full, API handles subsetting for V2
        payload = row.drop(['income_category', 'beneficiary_id', 'timestamp']).to_dict()
        
        start = time.time()
        res = requests.post(f"{URL}/predict", json=payload)
        lat = (time.time() - start) * 1000
        
        if res.status_code == 200:
            data = res.json()[0]
            print(f"  [V2] Pred: {data['prediction']} ({data['confidence']:.2f})")
            report_lines.append(f"## Row {idx} (V2)")
            report_lines.append(f"- **Pred**: `{data['prediction']}` ({data['confidence']:.2f})")
            report_lines.append(f"- **Explanation**: {data['explanation']}\n")
        else:
            print(f"  [V2] Error: {res.text}")

    with open('income_api_validation_report.md', 'w') as f:
        f.writelines([l + "\n" for l in report_lines])
    print("\nReport saved to income_api_validation_report.md")

if __name__ == "__main__":
    time.sleep(2)
    test_income_api()
