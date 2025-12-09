package com.sih.module.consumption.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ConsumptionEntryRequest {

    @NotBlank(message = "Data source is required")
    private String dataSource; // 'ELECTRICITY', 'GAS', 'TELEPHONE'

    // REQUIRED - Manual user input for billing amount
    @NotNull(message = "Billing amount is required")
    @DecimalMin(value = "0.01", message = "Billing amount must be greater than 0")
    private BigDecimal billingAmount;

    // REQUIRED - Manual user input for billing date
    @NotNull(message = "Billing date is required")
    @PastOrPresent(message = "Billing date cannot be in the future")
    private LocalDate billingDate;

    // Optional - user may not know units consumed
    private BigDecimal unitsConsumed;
}
