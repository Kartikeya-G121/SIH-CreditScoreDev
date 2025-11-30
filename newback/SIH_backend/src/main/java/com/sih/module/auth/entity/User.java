package com.sih.module.auth.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.common.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_keycloak", columnList = "keycloak_user_id"),
    @Index(name = "idx_users_phone", columnList = "phone_number"),
    @Index(name = "idx_users_role", columnList = "role"),
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_reset_token", columnList = "reset_token")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "keycloak_user_id", unique = true)
    private UUID keycloakUserId;
    
    @Column(name = "email", unique = true)
    private String email;
    
    @Column(name = "phone_number", unique = true, nullable = false)
    private String phoneNumber;
    
    @Column(name = "password_hash")
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private UserRole role = UserRole.BENEFICIARY;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "is_blacklisted", nullable = false)
    @Builder.Default
    private Boolean isBlacklisted = false;
    
    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";
    
    @Column(name = "reset_token")
    private String resetToken;
    
    @Column(name = "reset_token_expiry")
    private OffsetDateTime resetTokenExpiry;
}

