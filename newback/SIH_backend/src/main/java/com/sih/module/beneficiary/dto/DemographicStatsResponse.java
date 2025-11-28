package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemographicStatsResponse {
    private Long totalBeneficiaries;
    private Long verifiedCount;
    private Long unverifiedCount;
    private Map<String, Long> stateWiseDistribution;
    private Map<String, Long> casteCategoryDistribution;
    private Map<String, Long> genderDistribution;
    private Map<String, Long> regionTypeDistribution;
}

