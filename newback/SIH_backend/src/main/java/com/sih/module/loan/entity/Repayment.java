package com.sih.module.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "repayments", indexes = {
    @Index(name = "idx_repay_loan", columnList = "loan_id"),
    @Index(name = "idx_repay_due_date", columnList = "due_date"),
    @Index(name = "idx_repay_paid_date", columnList = "paid_date"),
    @Index(name = "idx_repay_on_time", columnList = "is_on_time")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Repayment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "repayment_id")
    private Long repaymentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column(name = "paid_date")
    private LocalDate paidDate;
    
    @Column(name = "amount_due", precision = 10, scale = 2)
    private BigDecimal amountDue;
    
    @Column(name = "amount_paid", precision = 10, scale = 2)
    private BigDecimal amountPaid;
    
    @Column(name = "payment_mode", length = 50)
    private String paymentMode;
    
    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;
    
    @Column(name = "delay_days")
    @Builder.Default
    private Integer delayDays = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

