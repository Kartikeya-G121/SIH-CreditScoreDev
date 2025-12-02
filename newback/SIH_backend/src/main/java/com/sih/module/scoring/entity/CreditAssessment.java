package com.sih.module.scoring.entity;

import com.sih.module.application.entity.LoanApplication;
import com.sih.module.scoring.entity.MLModel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "credit_assessments", indexes = {
    @Index(name = "idx_assessment_app", columnList = "application_id"),
    @Index(name = "idx_assessment_risk", columnList = "risk_band"),
    @Index(name = "idx_assessment_model", columnList = "model_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditAssessment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assessment_id")
    private Long assessmentId;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;
    
    @Column(name = "raw_income_score", precision = 5, scale = 2)
    private BigDecimal rawIncomeScore;
    
    @Column(name = "adjusted_income_score", precision = 5, scale = 2)
    private BigDecimal adjustedIncomeScore;
    
    @Column(name = "credit_risk_score", precision = 5, scale = 2)
    private BigDecimal creditRiskScore;
    
    @Column(name = "composite_score", precision = 5, scale = 2)
    private BigDecimal compositeScore;
    
    @Column(name = "risk_band", length = 50)
    private String riskBand; // 'HIGH', 'MEDIUM', 'LOW'
    
    @Column(name = "eligibility_status", length = 20)
    private String eligibilityStatus;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "explainability_data", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> explainabilityData = Map.of();
    
    @Column(name = "explainability_summary", columnDefinition = "TEXT")
    private String explainabilitySummary;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id")
    private MLModel model;
    
    @Column(name = "assessed_at", nullable = false)
    @Builder.Default
    private OffsetDateTime assessedAt = OffsetDateTime.now();
}

