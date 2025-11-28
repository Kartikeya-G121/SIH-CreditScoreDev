package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClusterResponse {
    private String pincode;
    private String district;
    private String state;
    private Long beneficiaryCount;
    private BigDecimal averageIncome;
    private String riskLevel; // 'HIGH', 'MEDIUM', 'LOW'
    private List<BigDecimal> coordinates; // [lat, long]
}

