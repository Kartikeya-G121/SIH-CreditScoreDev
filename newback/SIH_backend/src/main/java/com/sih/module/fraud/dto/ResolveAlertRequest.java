package com.sih.module.fraud.dto;

import lombok.Data;

@Data
public class ResolveAlertRequest {
    private String resolutionComments;
    private Boolean markAsFalsePositive;
}

