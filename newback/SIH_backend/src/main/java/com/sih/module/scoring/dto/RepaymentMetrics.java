package com.sih.module.scoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepaymentMetrics {
    private Integer totalEmis;
    private Integer paidEmis;
    private Integer latePayments;
    private Integer missedPayments;
    private Double averageDelayDays;
}
