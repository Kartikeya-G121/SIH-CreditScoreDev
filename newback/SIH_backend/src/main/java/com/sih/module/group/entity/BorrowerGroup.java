package com.sih.module.group.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "borrower_groups", indexes = {
    @Index(name = "idx_groups_creator", columnList = "created_by_user_id"),
    @Index(name = "idx_groups_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowerGroup extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long groupId;
    
    @Column(name = "group_name", nullable = false)
    private String groupName;
    
    @Column(name = "formation_date")
    private LocalDate formationDate;
    
    @Column(name = "project_description", columnDefinition = "TEXT")
    private String projectDescription;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;
    
    @Column(name = "group_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal groupScore = BigDecimal.ZERO;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

