package com.sih.module.fraud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudAlertResponse {
    private Long alertId;
    private Long userId;
    private String userEmail;
    private String sourceTable;
    private Long sourceId;
    private String alertType;
    private String severity;
    private String description;
    private Boolean isResolved;
    private String resolutionComments;
    private Long resolverId;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime createdAt;
}

