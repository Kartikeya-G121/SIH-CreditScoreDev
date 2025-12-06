package com.sih.module.loan.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class LoanTransactionDTO {
    private Long transactionId;
    private Long loanId;
    private String txnType;
    private BigDecimal amount;
    private BigDecimal principalComponent;
    private BigDecimal interestComponent;
    private BigDecimal penaltyComponent;
    private BigDecimal chargesComponent;
    private String paymentMode;
    private String externalRef;
    private LocalDate valueDate;
    private OffsetDateTime createdAt;
}
