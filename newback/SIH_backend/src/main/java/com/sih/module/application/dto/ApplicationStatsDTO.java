package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatsDTO {
    private Long totalApplications;
    private Long draftCount;
    private Long submittedCount;
    private Long scoringCount;
    private Long approvedCount;
    private Long rejectedCount;
    private Long sanctionedCount;
    private Long withdrawnCount;
}
