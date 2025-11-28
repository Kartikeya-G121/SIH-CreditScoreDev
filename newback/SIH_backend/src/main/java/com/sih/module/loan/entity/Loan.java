package com.sih.module.loan.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loans", indexes = {
    @Index(name = "idx_loans_user", columnList = "user_id"),
    @Index(name = "idx_loans_status", columnList = "loan_status"),
    @Index(name = "idx_loans_application", columnList = "application_id"),
    @Index(name = "idx_loans_next_payment", columnList = "next_payment_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Long loanId;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "total_principal", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrincipal;
    
    @Column(name = "total_interest", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInterest;
    
    @Column(name = "monthly_emi", precision = 10, scale = 2)
    private BigDecimal monthlyEmi;
    
    @Column(name = "outstanding_principal", precision = 15, scale = 2)
    private BigDecimal outstandingPrincipal;
    
    @Column(name = "outstanding_interest", precision = 15, scale = 2)
    private BigDecimal outstandingInterest;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "loan_status", length = 50, nullable = false)
    @Builder.Default
    private String loanStatus = "ACTIVE"; // 'ACTIVE', 'CLOSED', 'DEFAULTED', 'FORECLOSED', 'WAIVED_OFF'
    
    @Column(name = "next_payment_date")
    private LocalDate nextPaymentDate;
}

