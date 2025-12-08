package com.sih.module.scoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class RiskModelOutput {
    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("risk_category")
    private String riskCategory;

    private String explanation;

    @JsonProperty("top_factors")
    private List<RiskFactor> topFactors;

    @Data
    @NoArgsConstructor
    public static class RiskFactor {
        private String feature;
        private Double value;
        
        @JsonProperty("original_value")
        private Object originalValue;
        
        private Double score;
        
        @JsonProperty("abs_score")
        private Double absScore;
    }
}
