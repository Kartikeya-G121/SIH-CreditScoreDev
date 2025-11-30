package com.sih.module.consumption.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ConsumptionEntryRequest {

    @NotBlank(message = "Data source is required")
    private String dataSource; // 'ELECTRICITY', 'WATER', 'MOBILE'

    // Optional - will be extracted by OCR if not provided
    private BigDecimal billingAmount;

    // Optional - will be extracted by OCR if not provided
    private LocalDate billingDate;

    private BigDecimal unitsConsumed;
}
