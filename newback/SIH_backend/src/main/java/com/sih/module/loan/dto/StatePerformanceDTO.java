package com.sih.module.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatePerformanceDTO {
    private String state;
    private Long activeLoans;
    private BigDecimal totalAum;
    private BigDecimal npaAmount;
    private BigDecimal npaRate; // Derived
}
