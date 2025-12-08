package com.sih.module.loan.entity;

import com.sih.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan_transactions", indexes = {
        @Index(name = "idx_txn_loan", columnList = "loan_id"),
        @Index(name = "idx_txn_date", columnList = "value_date"),
        @Index(name = "idx_txn_type", columnList = "txn_type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(name = "txn_type", length = 50, nullable = false)
    private String txnType; 
    // DISBURSEMENT, EMI_PAYMENT, PARTIAL_PAYMENT, PREPAYMENT, PREPAYMENT_PENALTY,
    // FORECLOSURE_PAYMENT, PENALTY_CHARGE, PENALTY_REVERSAL, INTEREST_ACCRUAL, OTHER_CHARGE

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "principal_component", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal principalComponent = BigDecimal.ZERO;

    @Column(name = "interest_component", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal interestComponent = BigDecimal.ZERO;

    @Column(name = "penalty_component", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal penaltyComponent = BigDecimal.ZERO;

    @Column(name = "charges_component", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal chargesComponent = BigDecimal.ZERO;

    @Column(name = "applied_installments_json", columnDefinition = "TEXT")
    private String appliedInstallmentsJson;

    @Column(name = "payment_mode", length = 50)
    private String paymentMode;

    @Column(name = "external_ref", length = 100)
    private String externalRef;

    @Column(name = "value_date", nullable = false)
    private LocalDate valueDate;
}
