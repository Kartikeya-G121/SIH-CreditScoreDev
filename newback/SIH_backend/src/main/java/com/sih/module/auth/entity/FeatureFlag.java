package com.sih.module.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "feature_flags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlag {
    
    @Id
    @Column(name = "flag_name", length = 100)
    private String flagName;
    
    @Column(name = "flag_value", nullable = false)
    private Boolean flagValue;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "last_changed_at")
    private OffsetDateTime lastChangedAt;
}

