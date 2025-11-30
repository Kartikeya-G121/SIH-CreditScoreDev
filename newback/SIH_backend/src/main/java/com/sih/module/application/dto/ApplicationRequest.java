package com.sih.module.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApplicationRequest {
    
    @NotNull(message = "Requested amount is required")
    private BigDecimal requestedAmount;
    
    private String purpose;
    private Long groupId;
    private Integer schemeId;
}

