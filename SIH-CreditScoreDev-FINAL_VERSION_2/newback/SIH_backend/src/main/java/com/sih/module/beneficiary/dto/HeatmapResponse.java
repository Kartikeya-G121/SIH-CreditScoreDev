package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapResponse {
    private String region;
    private BigDecimal riskScore;
    private Long beneficiaryCount;
    private String colorCode; // 'RED', 'YELLOW', 'GREEN'
    private BigDecimal averageIncome;
}

