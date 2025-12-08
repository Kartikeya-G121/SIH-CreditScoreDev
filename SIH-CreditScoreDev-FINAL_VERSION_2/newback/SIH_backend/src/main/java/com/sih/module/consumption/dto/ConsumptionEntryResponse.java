package com.sih.module.consumption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionEntryResponse {
    private Long entryId;
    private Long userId;
    private String dataSource;
    private BigDecimal billingAmount;
    private LocalDate billingDate;
    private BigDecimal unitsConsumed;
    private Map<String, Object> uploadMetadata;
    private Boolean isTamperedFlag;
    private String tamperReason;
    private Boolean isImputed;
    private String verificationStatus;
    private String verificationSource;
    private BigDecimal verificationConfidence;
    private Long verifiedBy;
    private String fileS3Url;
    private OffsetDateTime createdAt;
}

