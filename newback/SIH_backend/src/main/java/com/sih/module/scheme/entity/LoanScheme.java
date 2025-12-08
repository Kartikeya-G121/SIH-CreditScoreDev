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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private com.sih.module.partner.entity.ChannelPartner channelPartner;

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

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "gender_allowed", length = 20)
    private String genderAllowed;

    @Column(name = "caste_category", length = 50)
    private String casteCategory;

    @Column(name = "income_max", precision = 15, scale = 2)
    private BigDecimal incomeMax;

    @Column(name = "max_existing_loans")
    @Builder.Default
    private Integer maxExistingLoans = 1;

    @Column(name = "is_subsidy")
    @Builder.Default
    private Boolean isSubsidy = false;

    @Column(name = "subsidy_type", length = 20)
    private String subsidyType;

    @Column(name = "subsidy_percentage", precision = 5, scale = 2)
    private BigDecimal subsidyPercentage;

    @Column(name = "grace_period_days")
    @Builder.Default
    private Integer gracePeriodDays = 0;

    @Column(name = "penalty_rate", precision = 5, scale = 2)
    private BigDecimal penaltyRate;

    @Column(name = "emi_bounce_charges", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal emiBounceCharges = BigDecimal.ZERO;

    @Column(name = "allow_prepayment")
    @Builder.Default
    private Boolean allowPrepayment = true;

    @Column(name = "prepayment_penalty", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal prepaymentPenalty = BigDecimal.ZERO;

    @Column(name = "is_group_loan_allowed")
    @Builder.Default
    private Boolean isGroupLoanAllowed = false;

    @Column(name = "created_by", length = 100)
    private String createdBy;
}
