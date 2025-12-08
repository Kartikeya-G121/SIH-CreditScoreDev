package com.sih.module.scoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RiskModelInput {
    @JsonProperty("beneficiary_id")
    private String beneficiaryId;

    private Integer age;
    private String gender;
    private String marital_status;
    private String education_level;
    private Integer family_size;
    private Integer dependents_count;
    private Double annual_family_income;
    private String income_source;
    
    private Double loan_amount;
    private Integer tenure_months;
    private Double interest_rate;
    private Double emi_amount;
    
    // History
    private Integer late_payments;
    private Integer missed_payments;
    private Double average_delay_days;
}
