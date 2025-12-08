package com.sih.module.scoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class IncomeModelInput {
    @JsonProperty("beneficiary_id")
    private String beneficiaryId;

    @JsonProperty("household_size")
    private Integer householdSize;

    @JsonProperty("units_consumed_mean")
    private Double unitsConsumedMean;

    @JsonProperty("electricitybilling_amount_mean")
    private Double electricityBillingAmountMean;

    @JsonProperty("gas_refill_amt_mean")
    private Double gasRefillAmtMean;

    @JsonProperty("mobilerechargeamount_mean")
    private Double mobileRechargeAmountMean;

    @JsonProperty("state")
    private String state;

    @JsonProperty("district")
    private String district;

    @JsonProperty("total_monthly_utility_spend")
    private Double totalMonthlyUtilitySpend;
}
