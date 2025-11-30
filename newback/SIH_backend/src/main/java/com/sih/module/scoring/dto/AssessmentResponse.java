package com.sih.module.scoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResponse {
    private Long assessmentId;
    private Long applicationId;
    private BigDecimal rawIncomeScore;
    private BigDecimal adjustedIncomeScore;
    private BigDecimal creditRiskScore;
    private BigDecimal compositeScore;
    private String riskBand;
    private String eligibilityStatus;
    private Map<String, Object> explainabilityData;
    private String explainabilitySummary;
    private Long modelId;
    private OffsetDateTime assessedAt;
}

