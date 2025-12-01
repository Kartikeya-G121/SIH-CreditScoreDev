package com.sih.module.loan.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class LoanScheduleDTO {
    private Integer installmentNumber;
    private LocalDate dueDate;
    private BigDecimal amount;
    private String status; // PAID, PENDING, OVERDUE
    private LocalDate paidDate;
    private BigDecimal amountPaid;
}
