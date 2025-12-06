package com.sih.module.scheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemeResponse {
    private Integer schemeId;
    private String schemeName;
    private String providerName;
    private String loanCategory;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private BigDecimal baseInterestRate;
    private Integer minTenureMonths;
    private Integer maxTenureMonths;
    private Boolean isTieredInterest;
    private BigDecimal tierThreshold;
    private BigDecimal tierInterestRate;
    private Boolean isActive;
    private OffsetDateTime createdAt;

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
    private String createdBy;
}
