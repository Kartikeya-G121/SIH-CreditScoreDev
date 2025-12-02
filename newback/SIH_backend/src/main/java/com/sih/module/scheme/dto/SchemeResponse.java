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
}
