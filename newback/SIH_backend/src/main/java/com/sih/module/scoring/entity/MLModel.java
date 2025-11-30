package com.sih.module.scoring.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "ml_models", indexes = {
    @Index(name = "idx_models_active", columnList = "is_active"),
    @Index(name = "idx_models_type", columnList = "type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "model_id")
    private Long modelId;
    
    @Column(name = "name", length = 200)
    private String name;
    
    @Column(name = "version", length = 50)
    private String version;
    
    @Column(name = "type", length = 50)
    private String type;
    
    @Column(name = "trained_on")
    private LocalDate trainedOn;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics", columnDefinition = "jsonb")
    private Map<String, Object> metrics;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

