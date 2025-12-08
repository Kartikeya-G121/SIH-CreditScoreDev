package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StateApplicationStatsDTO {
    private String state;
    private Long totalApplications;
    private Long submittedCount;
    private Long scoringCount;
    private Long approvedCount;
    private Long rejectedCount;
    private Long sanctionedCount;
    private Double totalAmountRequested;
}
