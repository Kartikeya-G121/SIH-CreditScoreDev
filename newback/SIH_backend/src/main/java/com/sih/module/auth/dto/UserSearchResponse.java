package com.sih.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for advanced user search
 * Contains paginated results and metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
    
    private List<UserSearchResult> users;
    private Long totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer pageSize;
    private UserSearchCriteria appliedFilters;
}
