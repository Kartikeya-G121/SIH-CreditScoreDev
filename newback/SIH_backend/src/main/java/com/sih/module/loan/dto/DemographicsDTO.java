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
public class DemographicsDTO {
    private String category; // e.g., "Male", "Female", "20-30", "Rural"
    private String type;     // "GENDER", "AGE_GROUP", "LOCATION"
    private Long count;
    private BigDecimal percentage;
}
