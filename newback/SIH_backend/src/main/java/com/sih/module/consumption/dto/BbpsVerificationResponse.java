package com.sih.module.consumption.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BbpsVerificationResponse {

    private boolean verified;
    private boolean tampered;

    @Builder.Default
    private List<String> tamperReasons = new ArrayList<>();

    private BigDecimal confidence;
    private String verificationSource;
    private String message;

    // Additional details
    private Boolean amountValid;
    private Boolean dateValid;
    private Boolean billNumberValid;
    private Boolean billerValid;
}
