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
public class RiskBucketStatsDTO {
    private String riskBucket; // CURRENT, SMA_0, SMA_1, SMA_2, NPA
    private Long loanCount;
    private BigDecimal totalPrincipal;
    private BigDecimal percentageOfBook;
}
