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
public class SchemePerformanceDTO {
    private Integer schemeId;
    private String schemeName;
    private Boolean isActive;
    private Long activeLoans;
    private BigDecimal totalAum;
    private BigDecimal npaRate;
    private BigDecimal averageRoi;
}
