package com.sih.module.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InitiateGroupLoanRequest {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "Scheme ID is required")
    private Long schemeId;

    @NotNull(message = "Requested amount is required")
    @DecimalMin(value = "1000.0", message = "Minimum loan amount is 1000")
    private BigDecimal requestedAmount;

    private String purpose;
}
