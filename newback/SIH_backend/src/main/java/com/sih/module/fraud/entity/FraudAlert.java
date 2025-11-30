package com.sih.module.fraud.entity;

import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "fraud_alerts", indexes = {
    @Index(name = "idx_fraud_user", columnList = "user_id"),
    @Index(name = "idx_fraud_status", columnList = "is_resolved"),
    @Index(name = "idx_fraud_severity", columnList = "severity"),
    @Index(name = "idx_fraud_source", columnList = "source_table, source_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "source_table", length = 50)
    private String sourceTable; // consumption_entries
    
    @Column(name = "source_id")
    private Long sourceId;
    
    @Column(name = "alert_type", length = 100)
    private String alertType; // PATTERN_DEVIATION, DUPLICATE, SPIKE
    
    @Column(name = "severity", length = 20)
    private String severity; // HIGH, MEDIUM, LOW
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "is_resolved", nullable = false)
    @Builder.Default
    private Boolean isResolved = false;
    
    @Column(name = "resolution_comments", columnDefinition = "TEXT")
    private String resolutionComments;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolver_id")
    private User resolver;
    
    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

