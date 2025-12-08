# Model Training & Analysis Report

**Model**: XGBoost Classifier
**Test Set Accuracy**: 81.2400%

## 1. Classification Metrics
```
              precision    recall  f1-score   support

        High       0.93      0.81      0.87      3307
         Low       0.82      0.84      0.83      3396
      Medium       0.72      0.78      0.75      3297

    accuracy                           0.81     10000
   macro avg       0.82      0.81      0.81     10000
weighted avg       0.82      0.81      0.81     10000

```

## 2. Top 15 Features (Combined Importance)
| Feature | Combined Score | XGB (Norm) | SHAP (Norm) |
| :--- | :--- | :--- | :--- |
| `mobilerechargeamount_mean` | 1.0000 | 1.0000 | 1.0000 |
| `units_consumed_mean` | 0.4789 | 0.5697 | 0.3881 |
| `subsidy_ratio` | 0.1929 | 0.2782 | 0.1075 |
| `units_consumed_median` | 0.1106 | 0.1616 | 0.0596 |
| `gas_refill_subsidy_amt_std` | 0.0911 | 0.1725 | 0.0097 |
| `mobilerechargeamount_median` | 0.0908 | 0.0709 | 0.1107 |
| `missing_mobile` | 0.0675 | 0.0893 | 0.0456 |
| `gas_refill_subsidy_amt_mean` | 0.0645 | 0.0556 | 0.0735 |
| `mobilerechargeamount_max` | 0.0511 | 0.0344 | 0.0678 |
| `units_consumed_mode` | 0.0397 | 0.0342 | 0.0452 |
| `units_consumed_max` | 0.0342 | 0.0327 | 0.0357 |
| `mobilerechargeamount_mode` | 0.0320 | 0.0297 | 0.0344 |
| `mobilerechargeamount_std` | 0.0313 | 0.0236 | 0.0390 |
| `electricitybilling_amount_max` | 0.0275 | 0.0230 | 0.0320 |
| `mobilerechargeamount_min` | 0.0250 | 0.0238 | 0.0262 |

## 3. Local Explanations (10 Sample Test Rows)
Analysis of features increasing or decreasing the probability of the *predicted* class.

**Row 9125** | Actual: `Medium` | Predicted: `Low`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (0.41), `units_consumed_mean` (0.34), `subsidy_ratio` (0.19)
- **Decreases Risk/Prob**: `mobilerechargeamount_min` (-0.05), `mobilerechargeamount_std` (-0.05), `mobile_bill_per_capita` (-0.06)

**Row 45892** | Actual: `Medium` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (0.78), `electricity_bill_per_capita` (0.21), `units_consumed_mean` (0.17)
- **Decreases Risk/Prob**: `mobilerechargeamount_min` (-0.05), `units_consumed_max` (-0.06), `electricitybilling_amount_min` (-0.16)

**Row 12783** | Actual: `Low` | Predicted: `Low`
- **Increases Risk/Prob**: `units_consumed_mean` (0.30), `subsidy_ratio` (0.24), `mobilerechargeamount_mean` (0.16)
- **Decreases Risk/Prob**: `mobilerechargeamount_min` (-0.08), `mobilerechargeamount_mode` (-0.10), `interaction_elec_hh` (-0.11)

**Row 1390** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (2.89), `units_consumed_mean` (0.87), `units_consumed_median` (0.39)
- **Decreases Risk/Prob**: `gas_refill_amt_min` (-0.05), `subsidy_ratio` (-0.07), `gas_refill_subsidy_amt_mean` (-0.37)

**Row 4772** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (3.08), `units_consumed_mean` (0.69), `mobilerechargeamount_median` (0.38)
- **Decreases Risk/Prob**: `cost_per_unit_electricity` (-0.03), `missing_gas` (-0.04), `gas_refill_amt_mean` (-0.05)

**Row 16397** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (2.77), `units_consumed_mean` (0.79), `units_consumed_median` (0.62)
- **Decreases Risk/Prob**: `electricitybilling_amount_mode` (-0.05), `missing_gas` (-0.06), `gas_refill_amt_min` (-0.09)

**Row 41190** | Actual: `Medium` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (0.57), `units_consumed_max` (0.05), `mobile_bill_per_capita` (0.05)
- **Decreases Risk/Prob**: `units_consumed_mean` (-0.05), `gas_refill_amt_mean` (-0.06), `gas_refill_amt_max` (-0.09)

**Row 24212** | Actual: `Medium` | Predicted: `High`
- **Increases Risk/Prob**: `units_consumed_mean` (0.35), `gas_refill_subsidy_amt_mean` (0.23), `subsidy_ratio` (0.17)
- **Decreases Risk/Prob**: `gas_refill_amt_max` (-0.03), `mobilerechargeamount_min` (-0.06), `mobilerechargeamount_mean` (-0.07)

**Row 1392** | Actual: `High` | Predicted: `High`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (3.33), `units_consumed_mean` (0.63), `mobilerechargeamount_median` (0.38)
- **Decreases Risk/Prob**: `mobilerechargeamount_min` (-0.06), `subsidy_ratio` (-0.13), `gas_refill_subsidy_amt_mean` (-0.26)

**Row 13641** | Actual: `Low` | Predicted: `Medium`
- **Increases Risk/Prob**: `mobilerechargeamount_mean` (0.55), `mobilerechargeamount_min` (0.06), `gas_refill_amt_max` (0.06)
- **Decreases Risk/Prob**: `units_consumed_std` (-0.05), `mobilerechargeamount_mode` (-0.07), `units_consumed_mean` (-0.18)

