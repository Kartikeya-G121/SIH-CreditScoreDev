package com.sih.module.auth.dto;

import com.sih.common.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String email;
    private String phoneNumber;
    private UserRole role;
    private Boolean isActive;
    private String preferredLanguage;
    private OffsetDateTime createdAt;
}

