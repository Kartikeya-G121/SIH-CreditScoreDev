package com.sih.module.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeatureFlagUpdateRequest {
    @NotNull(message = "Flag value is required")
    private Boolean flagValue;
    
    private String description;
}

