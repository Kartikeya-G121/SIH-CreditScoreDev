package com.sih.module.scoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class IncomeModelOutput {
    private String prediction; // Low, Medium, High
    private Double confidence;
    private String explanation;
    
    @JsonProperty("top_factors")
    private List<String> topFactors;
}
