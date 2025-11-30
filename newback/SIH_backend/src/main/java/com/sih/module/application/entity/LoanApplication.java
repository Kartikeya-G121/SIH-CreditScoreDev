package com.sih.module.application.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.auth.entity.User;
import com.sih.module.group.entity.BorrowerGroup;
import com.sih.module.scheme.entity.LoanScheme;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "loan_applications", indexes = {
    @Index(name = "idx_app_user", columnList = "user_id"),
    @Index(name = "idx_app_status", columnList = "status"),
    @Index(name = "idx_app_group", columnList = "group_id"),
    @Index(name = "idx_app_scheme", columnList = "scheme_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplication extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long applicationId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private BorrowerGroup group;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id")
    private LoanScheme scheme;
    
    @Column(name = "requested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;
    
    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;
    
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "DRAFT"; // 'DRAFT', 'SUBMITTED', 'SCORING', 'APPROVED', 'REJECTED', 'SANCTIONED', 'WITHDRAWN'
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "stage_timestamp", nullable = false)
    @Builder.Default
    private OffsetDateTime stageTimestamp = OffsetDateTime.now();
    
    @Column(name = "sanctioned_amount", precision = 15, scale = 2)
    private BigDecimal sanctionedAmount;
    
    @Column(name = "final_interest_rate", precision = 5, scale = 2)
    private BigDecimal finalInterestRate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sanctioned_by")
    private User sanctionedBy;
}

