package com.sih.module.beneficiary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class VerifyRequest {
    
    @NotNull(message = "Verified annual income is required")
    private BigDecimal verifiedAnnualIncome;
    
    private String comments;
}

