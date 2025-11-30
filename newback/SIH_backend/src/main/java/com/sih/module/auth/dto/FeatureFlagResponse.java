package com.sih.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlagResponse {
    private String flagName;
    private Boolean flagValue;
    private String description;
    private OffsetDateTime lastChangedAt;
}

