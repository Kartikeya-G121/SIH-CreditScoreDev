package com.sih.module.scheme.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_schemes", indexes = {
        @Index(name = "idx_schemes_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheme_id")
    private Integer schemeId;

    @Column(name = "scheme_name", nullable = false, length = 100)
    private String schemeName;

    @Column(name = "provider_name", length = 200)
    private String providerName;

    @Column(name = "loan_category", length = 100)
    private String loanCategory;

    @Column(name = "min_amount", precision = 15, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", precision = 15, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "base_interest_rate", precision = 5, scale = 2)
    private BigDecimal baseInterestRate;

    @Column(name = "min_tenure_months")
    private Integer minTenureMonths;

    @Column(name = "max_tenure_months")
    private Integer maxTenureMonths;

    @Column(name = "is_tiered_interest", nullable = false)
    @Builder.Default
    private Boolean isTieredInterest = false;

    @Column(name = "tier_threshold", precision = 15, scale = 2)
    private BigDecimal tierThreshold;

    @Column(name = "tier_interest_rate", precision = 5, scale = 2)
    private BigDecimal tierInterestRate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
