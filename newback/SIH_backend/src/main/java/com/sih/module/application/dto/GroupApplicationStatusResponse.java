package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupApplicationStatusResponse {
    private Long userId;
    private String userName;
    private String role; // LEADER or MEMBER
    private Long applicationId;
    private String status; // DRAFT, SUBMITTED, NOT_APPLIED
    private BigDecimal requestedAmount;
}
