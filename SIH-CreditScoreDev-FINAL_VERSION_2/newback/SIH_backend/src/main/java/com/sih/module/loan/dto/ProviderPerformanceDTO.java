package com.sih.module.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderPerformanceDTO {
    private String providerName;
    private Long totalSchemes;
    private Long activeLoans;
    private BigDecimal totalAum;
    private BigDecimal npaRate;
    private BigDecimal averageRoi;
    private BigDecimal totalDisbursed;
}
