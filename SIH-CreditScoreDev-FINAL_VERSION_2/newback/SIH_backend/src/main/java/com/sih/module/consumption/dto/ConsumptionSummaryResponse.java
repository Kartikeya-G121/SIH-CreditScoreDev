package com.sih.module.consumption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionSummaryResponse {
    private Long totalEntries;
    private Long verifiedEntries;
    private Long pendingEntries;
    private BigDecimal totalAmount;
    private BigDecimal averageAmount;
    private Map<String, Long> entriesBySource;
    private Map<String, BigDecimal> amountBySource;
}

