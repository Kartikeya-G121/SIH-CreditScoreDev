package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationAnalyticsResponse {
    private ApplicationStatsDTO overallStats;
    private List<StateApplicationStatsDTO> stateWiseStats;
    private OffsetDateTime lastUpdated;
    private Boolean isCached;
}
