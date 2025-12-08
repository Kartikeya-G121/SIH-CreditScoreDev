import pandas as pd
import numpy as np
import os

# Define paths
PRIMARY_DATASET_PATH = r'ml models\Income category classification\primary_dataset.csv'
REPAYMENT_DATASET_PATH = r'ml models\Income category classification\corrected_repayment_dataset.csv'

OUTPUT_DIR = r'C:\Users\Soham\.gemini\antigravity\brain\5706af58-2cc1-40f8-bad7-f7d9f3347cb0'
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)


def df_to_markdown(df):
    """
    Converts a pandas DataFrame to a markdown table string without requiring the 'tabulate' dependency.
    """
    if len(df) == 0:
        return ""
    
    # Header
    columns = [str(c) for c in df.columns]
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join(["---"] * len(columns)) + " |"
    
    lines = [header, separator]
    
    # Data
    for _, row in df.iterrows():
        # Handle newlines in data which break markdown tables
        clean_row = [str(val).replace('\n', ' ') for val in row]
        line = "| " + " | ".join(clean_row) + " |"
        lines.append(line)
        
    return "\n".join(lines)

def generate_primary_report(df):
    report = []
    report.append("# Primary Dataset (Income/Affordability) EDA Report\n")
    
    # 1. Columns and Data Types
    report.append("## 1. Dataset Structure\n")
    report.append(f"- **Total Rows:** {len(df)}")
    report.append(f"- **Total Columns:** {len(df.columns)}")
    report.append("\n### Columns and Data Types\n")
    report.append("| Column Name | Data Type | Non-Null Count |\n|---|---|---|")
    for col in df.columns:
        report.append(f"| {col} | {df[col].dtype} | {df[col].count()} |")
    
    # 2. Missing Values
    report.append("\n## 2. Missing Values Analysis\n")
    missing = df.isnull().sum()
    missing = missing[missing > 0]
    if missing.empty:
        report.append("No missing values found.")
    else:
        report.append("| Column | Missing Count | Percentage |\n|---|---|---|")
        for col, count in missing.items():
            report.append(f"| {col} | {count} | {(count/len(df))*100:.2f}% |")

    # 3. Distributions & Outliers
    report.append("\n## 3. Data Distribution & Outliers\n")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    # Key numeric stats
    report.append("### Key Numeric Statistics\n")
    stats = df[numeric_cols].describe().transpose()
    # Reset index to include column name in the table
    stats['feature'] = stats.index
    stats = stats[['feature'] + [c for c in stats.columns if c != 'feature']]
    report.append(df_to_markdown(stats))

    # Specific checks requested
    report.append("\n### Anomaly Checks\n")
    
    # Check for negative values in potential monetary columns
    monetary_cols = [c for c in df.columns if 'amount' in c or 'bill' in c or 'cost' in c]
    for col in monetary_cols:
        if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                report.append(f"- **WARNING:** Column `{col}` has {neg_count} negative values.")
    
    # Check for zero electricity bills (potential indicator)
    if 'electricitybilling_amount_mean' in df.columns:
        zero_bills = (df['electricitybilling_amount_mean'] == 0).sum()
        report.append(f"- Beneficiaries with zero mean electricity bill: {zero_bills} ({(zero_bills/len(df))*100:.2f}%)")

    # 4. Categorical Variables
    report.append("\n## 4. Categorical Variables Analysis\n")
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in cat_cols:
        if col != 'beneficiary_id' and col != 'timestamp': # Skip ID and Date
            counts = df[col].value_counts().head(10).reset_index()
            counts.columns = [col, 'Count']
            report.append(f"\n**{col}** Distribution (Top 10):")
            report.append(df_to_markdown(counts))

    # 5. Correlations
    report.append("\n## 5. Correlation Analysis\n")
    if len(numeric_cols) > 0:
        corr_matrix = df[numeric_cols].corr()
        # Find high correlations
        high_corr = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i):
                if abs(corr_matrix.iloc[i, j]) > 0.7:
                    high_corr.append((corr_matrix.columns[i], corr_matrix.columns[j], corr_matrix.iloc[i, j]))
        
        report.append("### High Correlations (> 0.7)\n")
        if high_corr:
            report.append("| Variable 1 | Variable 2 | Correlation |\n|---|---|---|")
            for v1, v2, val in high_corr:
                report.append(f"| {v1} | {v2} | {val:.2f} |")
        else:
            report.append("No correlations above 0.7 found.")

    # 6. Recommendations
    report.append("\n## 6. Recommendations\n")
    report.append("### Preprocessing\n")
    report.append("- Handle missing values in utility columns (consider imputation with 0 if implies no usage, or median/mean).")
    report.append("- Normalize/Scale numeric features due to high variance in billing amounts.")
    report.append("- Encode categorical variables (e.g., `income_category`) for modeling.")
    
    report.append("\n### Feature Engineering\n")
    report.append("- Create `utility_volatility`: Standard deviation of bills / Mean of bills.")
    report.append("- `seasonality_index`: If timestamp available, correlate usage with months.")
    report.append("- `affordability_ratio`: Total utility spend / Reported Income (if available).")

    return "\n".join(report)

def generate_repayment_report(df):
    report = []
    report.append("# Repayment Dataset (Risk/Behaviour) EDA Report\n")
    
    # 1. Structure
    report.append("## 1. Dataset Structure\n")
    report.append(f"- **Total Rows:** {len(df)}")
    report.append(f"- **Total Columns:** {len(df.columns)}")
    report.append("\n### Columns and Data Types\n")
    report.append("| Column Name | Data Type | Non-Null Count |\n|---|---|---|")
    for col in df.columns:
        report.append(f"| {col} | {df[col].dtype} | {df[col].count()} |")

    # 2. Missing Values
    report.append("\n## 2. Missing Values\n")
    missing = df.isnull().sum()
    missing = missing[missing > 0].reset_index()
    if not missing.empty:
        missing.columns = ['Column', 'Missing Count']
        report.append(df_to_markdown(missing))
    else:
        report.append("No missing values found.")

    # 3. Target Variable Analysis
    report.append("\n## 3. Target Variable Analysis\n")
    if 'risk_score' in df.columns:
        report.append("### Risk Score Distribution\n")
        stats = df['risk_score'].describe().to_frame().transpose()
        stats = stats.reset_index().rename(columns={'index': 'metric'})
        report.append(df_to_markdown(stats))
    if 'default_status' in df.columns:
        report.append("\n### Default Status Distribution\n")
        dist = df['default_status'].value_counts(normalize=True).reset_index()
        dist.columns = ['default_status', 'percentage']
        report.append(df_to_markdown(dist))

    # 4. Cohort/Segment Analysis
    report.append("\n## 4. Cohort Analysis\n")
    
    if 'state' in df.columns and 'risk_score' in df.columns:
        report.append("### Average Risk Score by State\n")
        state_risk = df.groupby('state')['risk_score'].mean().sort_values(ascending=False).reset_index()
        report.append(df_to_markdown(state_risk))

    if 'loan_scheme' in df.columns and 'default_status' in df.columns:
         report.append("\n### Default Rates by Loan Scheme\n")
         # Simple proxy for default rate if default_status is Yes/No
         if df['default_status'].dtype == 'object':
             default_rates = df.groupby('loan_scheme')['default_status'].apply(lambda x: (x == 'Yes').mean()).sort_values(ascending=False).reset_index()
             default_rates.columns = ['loan_scheme', 'default_rate']
             report.append(df_to_markdown(default_rates))

    # 5. Key Distributions
    report.append("\n## 5. Key Feature Distributions\n")
    dist_cols = ['total_emis', 'average_delay_days', 'max_delay_days', 'current_outstanding']
    for col in dist_cols:
        if col in df.columns:
            report.append(f"\n**{col}** Statistics:")
            stats = df[col].describe().to_frame().transpose().reset_index()
            report.append(df_to_markdown(stats))

    # 6. Recommendations
    report.append("\n## 6. Recommendations\n")
    report.append("- **Imbalanced Data:** Check default rate. If low (< 5%), consider SMOTE or class weighting.")
    report.append("- **Feature Engineering:** `delay_ratio` (average delay / allowed tenure), `payment_efficiency` (on_time_emis / total_emis).")
    report.append("- **Risk Scoring:** Current `risk_score` seems pre-calculated. Recommend validating it against `default_status`.")

    return "\n".join(report)

def main():
    print("Starting EDA Process...")
    
    # Process Primary Dataset
    if os.path.exists(PRIMARY_DATASET_PATH):
        print(f"Reading Primary Dataset: {PRIMARY_DATASET_PATH}")
        df_primary = pd.read_csv(PRIMARY_DATASET_PATH)
        report_primary = generate_primary_report(df_primary)
        
        with open(os.path.join(OUTPUT_DIR, 'primary_dataset_eda_report.md'), 'w', encoding='utf-8') as f:
            f.write(report_primary)
        print("Generated primary_dataset_eda_report.md")
    else:
        print(f"ERROR: Primary dataset not found at {PRIMARY_DATASET_PATH}")

    # Process Repayment Dataset
    if os.path.exists(REPAYMENT_DATASET_PATH):
        print(f"Reading Repayment Dataset: {REPAYMENT_DATASET_PATH}")
        df_repay = pd.read_csv(REPAYMENT_DATASET_PATH)
        report_repay = generate_repayment_report(df_repay)
        
        with open(os.path.join(OUTPUT_DIR, 'corrected_repayment_dataset_eda_report.md'), 'w', encoding='utf-8') as f:
            f.write(report_repay)
        print("Generated corrected_repayment_dataset_eda_report.md")
    else:
        print(f"ERROR: Repayment dataset not found at {REPAYMENT_DATASET_PATH}")

if __name__ == "__main__":
    main()
