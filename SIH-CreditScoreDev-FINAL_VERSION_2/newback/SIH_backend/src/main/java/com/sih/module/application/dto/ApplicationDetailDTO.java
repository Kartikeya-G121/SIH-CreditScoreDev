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
public class ApplicationDetailDTO {
    private Long applicationId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String state;
    private String district;
    private Long groupId;
    private String groupName;
    private Integer schemeId;
    private String schemeName;
    private BigDecimal requestedAmount;
    private String purpose;
    private Integer tenureMonths;
    private String status;
    private String rejectionReason;
    private OffsetDateTime stageTimestamp;
    private BigDecimal sanctionedAmount;
    private BigDecimal finalInterestRate;
    private Long sanctionedBy;
    private String sanctionedByName;
    private BigDecimal interestRate;
    private BigDecimal processingFee;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
