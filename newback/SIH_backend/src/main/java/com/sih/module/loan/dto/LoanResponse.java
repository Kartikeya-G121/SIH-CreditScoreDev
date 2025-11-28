package com.sih.module.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanResponse {
    private Long loanId;
    private Long applicationId;
    private Long userId;
    private BigDecimal totalPrincipal;
    private BigDecimal totalInterest;
    private BigDecimal monthlyEmi;
    private BigDecimal outstandingPrincipal;
    private BigDecimal outstandingInterest;
    private LocalDate startDate;
    private LocalDate endDate;
    private String loanStatus;
    private LocalDate nextPaymentDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

