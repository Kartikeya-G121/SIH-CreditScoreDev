package com.sih.module.loan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    
    @NotNull(message = "Amount is required")
    private BigDecimal amount;
    
    @NotBlank(message = "Payment mode is required")
    private String mode;
    
    private String transactionRef;
}

