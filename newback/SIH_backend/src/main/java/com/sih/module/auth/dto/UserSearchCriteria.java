package com.sih.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for advanced user search criteria
 * Supports multiple filters for comprehensive user search
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchCriteria {
    
    // Role filter
    private String role; // BENEFICIARY, LOAN_OFFICER, ADMIN, AUDITOR
    
    // Status filter
    private Boolean isActive;
    
    // Location filters
    private String regionType; // RURAL, URBAN
    private String state;
    private String district;
    
    // Demographic filters
    private String casteCategory; // SC, ST, OBC, General
    private String gender; // Male, Female, Other
    
    // Date range filters
    private LocalDate registeredAfter;
    private LocalDate registeredBefore;
    
    // Text search
    private String searchText; // Search in name, email, phone
    
    // Pagination
    private Integer page = 0;
    private Integer size = 20;
    
    // Sorting
    private String sortBy = "createdAt"; // createdAt, email, role
    private String sortDirection = "DESC"; // ASC, DESC
}
