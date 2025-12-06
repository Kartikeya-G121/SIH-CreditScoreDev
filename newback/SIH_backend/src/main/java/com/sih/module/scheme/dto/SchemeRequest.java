package com.sih.module.scheme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SchemeRequest {

    @NotBlank(message = "Scheme name is required")
    private String schemeName;

    private String providerName;
    private String loanCategory;

    @NotNull(message = "Minimum amount is required")
    private BigDecimal minAmount;

    @NotNull(message = "Maximum amount is required")
    private BigDecimal maxAmount;

    @NotNull(message = "Base interest rate is required")
    private BigDecimal baseInterestRate;

    @NotNull(message = "Minimum tenure is required")
    private Integer minTenureMonths;

    @NotNull(message = "Maximum tenure is required")
    private Integer maxTenureMonths;

    private Boolean isTieredInterest;
    private BigDecimal tierThreshold;
    private BigDecimal tierInterestRate;

    private Integer minAge;
    private Integer maxAge;
    private String genderAllowed;
    private String casteCategory;
    private BigDecimal incomeMax;
    private Integer maxExistingLoans;

    private Boolean isSubsidy;
    private String subsidyType;
    private BigDecimal subsidyPercentage;

    private Integer gracePeriodDays;
    private BigDecimal penaltyRate;
    private BigDecimal emiBounceCharges;
    private Boolean allowPrepayment;
    private BigDecimal prepaymentPenalty;

    private Boolean isGroupLoanAllowed;
}
