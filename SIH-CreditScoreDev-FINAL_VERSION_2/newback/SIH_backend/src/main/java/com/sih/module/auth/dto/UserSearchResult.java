package com.sih.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual user result in search response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResult {
    
    private Long userId;
    private String email;
    private String phoneNumber;
    private String role;
    private Boolean isActive;
    private Boolean isBlacklisted;
    private String preferredLanguage;
    private String createdAt;
    
    // Profile information (if available)
    private String fullName;
    private String state;
    private String district;
    private String regionType;
    private String casteCategory;
    private String gender;
}
