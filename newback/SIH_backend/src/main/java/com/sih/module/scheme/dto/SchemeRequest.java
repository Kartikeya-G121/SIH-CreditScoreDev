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
}
