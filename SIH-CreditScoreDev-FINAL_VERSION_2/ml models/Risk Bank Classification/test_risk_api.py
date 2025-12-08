import requests
import pandas as pd
import json
import time

URL = "http://localhost:5001"

def test_risk_api():
    print(f"Connecting to {URL}...")
    
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

    # Load Data
    try:
        df = pd.read_csv('test.csv')
        sample = df.head(3).to_dict(orient='records')
        print(f"\nLoaded {len(sample)} sample rows.")
    except Exception as e:
        print(f"Failed to read test.csv: {e}")
        return

    report_lines = []
    report_lines.append("# Risk Bank Classification API Validation Report")
    report_lines.append(f"**Test Date**: {time.ctime()}\n")

    # 2. Test V1 (Default)
    print("\n--- Testing V1 ---")
    headers = {'Content-Type': 'application/json'}
    
    # Switch to V1 explicitly to be sure
    requests.post(f"{URL}/models/switch/v1")
    
    payload = sample[0]
    # Remove any potential target columns if they exist in test.csv (assuming pure features or ignoring extra)
    
    start = time.time()
    res = requests.post(f"{URL}/predict", json=payload)
    lat = (time.time() - start) * 1000
    
    if res.status_code == 200:
        results = res.json()
        # Expecting a list of results
        res_data = results[0]
        print(f"[V1] Risk Score: {res_data['risk_score']:.2f} ({res_data['risk_category']}) | Latency: {lat:.0f}ms")
        report_lines.append(f"\n## V1 Prediction (Sample 1)")
        report_lines.append(f"- **Score**: {res_data['risk_score']:.2f} ({res_data['risk_category']})")
        report_lines.append(f"- **Latency**: {lat:.0f}ms")
        report_lines.append(f"- **Explanation**:\n> {res_data['explanation'].replace(chr(10), '  '+chr(10))}") # Indent newlines
    else:
        print(f"[V1] Error: {res.text}")
        report_lines.append(f"\n## V1 Error\n`{res.text}`")

    # 3. Switch to V2
    print("\n--- Switching to V2 ---")
    res = requests.post(f"{URL}/models/switch/v2")
    if res.status_code == 200:
        print("Switched to V2 successfully.")
        report_lines.append(f"\n## Version Switch\nSuccessfully switched to V2.")
    else:
        print(f"Switch Failed: {res.text}")
        
    # 4. Test V2
    print("\n--- Testing V2 ---")
    start = time.time()
    res = requests.post(f"{URL}/predict", json=payload) # Use same sample
    lat = (time.time() - start) * 1000
    
    if res.status_code == 200:
        results = res.json()
        res_data = results[0]
        print(f"[V2] Risk Score: {res_data['risk_score']:.2f} ({res_data['risk_category']}) | Latency: {lat:.0f}ms")
        report_lines.append(f"\n## V2 Prediction (Sample 1)")
        report_lines.append(f"- **Score**: {res_data['risk_score']:.2f} ({res_data['risk_category']})")
        report_lines.append(f"- **Latency**: {lat:.0f}ms")
        report_lines.append(f"- **Explanation**:\n> {res_data['explanation'].replace(chr(10), '  '+chr(10))}")
    else:
        print(f"[V2] Error: {res.text}")
        report_lines.append(f"\n## V2 Error\n`{res.text}`")

    # Save Report
    with open('risk_api_validation_report.md', 'w') as f:
        f.writelines([l + "\n" for l in report_lines])
    print("\nReport saved to risk_api_validation_report.md")

if __name__ == "__main__":
    time.sleep(2) # Give API a moment if just started
    test_risk_api()
