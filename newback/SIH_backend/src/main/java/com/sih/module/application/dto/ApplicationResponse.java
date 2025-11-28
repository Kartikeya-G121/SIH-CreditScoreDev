package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long applicationId;
    private Long userId;
    private Long groupId;
    private Integer schemeId;
    private BigDecimal requestedAmount;
    private String purpose;
    private String status;
    private String rejectionReason;
    private OffsetDateTime stageTimestamp;
    private BigDecimal sanctionedAmount;
    private BigDecimal finalInterestRate;
    private Long sanctionedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

