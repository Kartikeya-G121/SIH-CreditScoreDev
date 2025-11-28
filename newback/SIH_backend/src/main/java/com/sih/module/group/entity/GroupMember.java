package com.sih.module.group.entity;

import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "group_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}),
       indexes = {
           @Index(name = "idx_group_members_user", columnList = "user_id"),
           @Index(name = "idx_group_members_group", columnList = "group_id"),
           @Index(name = "idx_group_members_status", columnList = "status")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long memberId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private BorrowerGroup group;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "role", length = 50)
    @Builder.Default
    private String role = "MEMBER"; // 'LEADER', 'MEMBER'
    
    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING"; // 'PENDING', 'APPROVED', 'REJECTED'
    
    @Column(name = "joined_at")
    @Builder.Default
    private LocalDate joinedAt = LocalDate.now();
}

