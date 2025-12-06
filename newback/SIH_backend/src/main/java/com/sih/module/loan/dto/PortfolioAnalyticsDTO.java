package com.sih.module.loan.dto;

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
public class PortfolioAnalyticsDTO {
    // Top Level KPIs
    private BigDecimal totalAum;           // Assets Under Management
    private Long activeLoansCount;
    private BigDecimal npaRate;            // % of AUM that is NPA
    private BigDecimal parRate;            // % of AUM that is PAR (>30 DPD)
    private BigDecimal collectionEfficiency; // Collected / Demand

    // Breakdowns
    private List<RiskBucketStatsDTO> riskDistribution;
    private List<StatePerformanceDTO> statePerformance;
    private List<SchemePerformanceDTO> schemePerformance;
    private List<ProviderPerformanceDTO> providerPerformance;
    private List<DemographicsDTO> genderDistribution;
    private List<DemographicsDTO> ageDistribution;
}
