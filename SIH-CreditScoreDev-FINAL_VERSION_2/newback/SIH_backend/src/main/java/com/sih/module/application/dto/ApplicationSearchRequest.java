package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationSearchRequest {
    private String searchText; // Search by username, email, phone, or application ID
    private String status;
    private String state;
    private Integer schemeId;
    private OffsetDateTime createdAfter;
    private OffsetDateTime createdBefore;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
    private Double minAmount;
    private Double maxAmount;
    private String providerName;
    private String schemeName;
}
