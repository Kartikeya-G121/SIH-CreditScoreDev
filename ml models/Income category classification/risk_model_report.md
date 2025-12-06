# Risk Model (V2) Analysis Report

**Model**: XGBoost (Selected Features)
**Test Set Accuracy**: 80.6200%

## 1. Classification Metrics
```
              precision    recall  f1-score   support

        High       0.92      0.81      0.86      3307
         Low       0.81      0.84      0.82      3396
      Medium       0.71      0.77      0.74      3297

    accuracy                           0.81     10000
   macro avg       0.81      0.81      0.81     10000
weighted avg       0.81      0.81      0.81     10000

```

## 2. Feature Importance (Combined)
| Feature | Combined Score | XGB (Norm) | SHAP (Norm) |
| :--- | :--- | :--- | :--- |
| `mobilerechargeamount_median` | 1.0000 | 1.0000 | 1.0000 |
| `units_consumed_mean` | 0.5797 | 0.5972 | 0.5622 |
| `subsidy_ratio` | 0.2203 | 0.3216 | 0.1190 |
| `mobilerechargeamount_max` | 0.1209 | 0.0564 | 0.1855 |
| `gas_refill_subsidy_amt_mode` | 0.0664 | 0.0605 | 0.0723 |
| `mobile_bill_per_capita` | 0.0660 | 0.0186 | 0.1134 |
| `gas_refill_subsidy_amt_std` | 0.0378 | 0.0756 | 0.0000 |
| `units_consumed_max` | 0.0309 | 0.0151 | 0.0468 |
| `electricitybilling_amount_median` | 0.0174 | 0.0033 | 0.0315 |
| `electricity_bill_per_capita` | 0.0141 | 0.0023 | 0.0258 |
| `units_per_capita` | 0.0125 | 0.0038 | 0.0211 |
| `electricitybilling_amount_mean` | 0.0122 | 0.0019 | 0.0224 |
| `gas_refill_amt_mean` | 0.0110 | 0.0000 | 0.0220 |
| `missing_electricity` | 0.0100 | 0.0094 | 0.0105 |
| `missing_gas` | 0.0043 | 0.0005 | 0.0080 |

## 3. Local Explanations (10 Sample Test Rows)
**Row 27822** | Actual: `Medium` | Predicted: `Low`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (1.27), `mobilerechargeamount_max` (0.27), `subsidy_ratio` (0.20)
- **Decreases Risk/Prob**: `gas_refill_amt_mean` (-0.09), `mobile_bill_per_capita` (-0.10), `units_consumed_mean` (-0.95)

**Row 34144** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (2.41), `units_consumed_mean` (0.84), `mobilerechargeamount_max` (0.29)
- **Decreases Risk/Prob**: `missing_electricity` (-0.00), `electricitybilling_amount_median` (-0.01), `gas_refill_amt_mean` (-0.07)

**Row 26690** | Actual: `Medium` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (0.93), `units_consumed_mean` (0.44), `mobilerechargeamount_max` (0.23)
- **Decreases Risk/Prob**: `subsidy_ratio` (-0.01), `units_per_capita` (-0.01)

**Row 839** | Actual: `Medium` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (0.71), `units_consumed_mean` (0.18), `mobilerechargeamount_max` (0.10)
- **Decreases Risk/Prob**: `missing_electricity` (-0.01), `electricitybilling_amount_median` (-0.01), `subsidy_ratio` (-0.06)

**Row 17299** | Actual: `High` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (0.55), `subsidy_ratio` (0.05), `mobilerechargeamount_max` (0.04)
- **Decreases Risk/Prob**: `units_per_capita` (-0.02), `units_consumed_max` (-0.07), `units_consumed_mean` (-0.09)

**Row 39314** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (2.20), `units_consumed_mean` (1.29), `mobilerechargeamount_max` (0.57)
- **Decreases Risk/Prob**: `units_per_capita` (-0.01), `gas_refill_amt_mean` (-0.10)

**Row 32804** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (1.49), `mobile_bill_per_capita` (0.63), `subsidy_ratio` (0.42)
- **Decreases Risk/Prob**: `electricitybilling_amount_mean` (-0.03), `electricitybilling_amount_median` (-0.03), `gas_refill_amt_mean` (-0.09)

**Row 49064** | Actual: `Medium` | Predicted: `Low`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (0.64), `units_consumed_mean` (0.49), `subsidy_ratio` (0.24)
- **Decreases Risk/Prob**: `mobilerechargeamount_max` (-0.00), `electricitybilling_amount_mean` (-0.01), `mobile_bill_per_capita` (-0.28)

**Row 9312** | Actual: `Medium` | Predicted: `Low`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (0.86), `units_consumed_mean` (0.73), `mobilerechargeamount_max` (0.20)
- **Decreases Risk/Prob**: `units_per_capita` (-0.05), `subsidy_ratio` (-0.16), `gas_refill_subsidy_amt_mode` (-0.18)

**Row 22077** | Actual: `Low` | Predicted: `Low`
- **Increases Risk/Prob**: `mobilerechargeamount_median` (1.53), `units_consumed_mean` (0.29), `mobilerechargeamount_max` (0.14)
- **Decreases Risk/Prob**: `gas_refill_subsidy_amt_std` (-0.03), `gas_refill_subsidy_amt_mode` (-0.11), `subsidy_ratio` (-0.28)

