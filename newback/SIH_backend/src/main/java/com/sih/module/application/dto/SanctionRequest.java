package com.sih.module.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SanctionRequest {
    
    @NotNull(message = "Sanctioned amount is required")
    private BigDecimal amount;
    
    @NotNull(message = "Interest rate is required")
    private BigDecimal interestRate;
}

