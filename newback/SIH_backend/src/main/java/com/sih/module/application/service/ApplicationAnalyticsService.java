package com.sih.module.application.service;

import com.sih.module.application.dto.*;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationAnalyticsService {

    private final LoanApplicationRepository applicationRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;

    @Cacheable(value = "applicationAnalytics", key = "'analytics'")
    public ApplicationAnalyticsResponse getApplicationAnalytics() {
        log.info("Computing application analytics (cache miss)");

        // Overall statistics
        ApplicationStatsDTO overallStats = ApplicationStatsDTO.builder()
                .totalApplications(applicationRepository.count())
                .draftCount(applicationRepository.countByStatus("DRAFT"))
                .submittedCount(applicationRepository.countByStatus("SUBMITTED"))
                .scoringCount(applicationRepository.countByStatus("SCORING"))
                .approvedCount(applicationRepository.countByStatus("APPROVED"))
                .rejectedCount(applicationRepository.countByStatus("REJECTED"))
                .sanctionedCount(applicationRepository.countByStatus("SANCTIONED"))
                .withdrawnCount(applicationRepository.countByStatus("WITHDRAWN"))
                .build();

        // State-wise statistics
        List<Object[]> stateStatsRaw = applicationRepository.getStateWiseStatistics();
        List<StateApplicationStatsDTO> stateWiseStats = stateStatsRaw.stream()
                .map(row -> StateApplicationStatsDTO.builder()
                        .state((String) row[0])
                        .totalApplications(((Number) row[1]).longValue())
                        .submittedCount(((Number) row[2]).longValue())
                        .scoringCount(((Number) row[3]).longValue())
                        .approvedCount(((Number) row[4]).longValue())
                        .rejectedCount(((Number) row[5]).longValue())
                        .sanctionedCount(((Number) row[6]).longValue())
                        .totalAmountRequested(((Number) row[7]).doubleValue())
                        .build())
                .collect(Collectors.toList());

        return ApplicationAnalyticsResponse.builder()
                .overallStats(overallStats)
                .stateWiseStats(stateWiseStats)
                .lastUpdated(OffsetDateTime.now())
                .isCached(false)
                .build();
    }

    @CacheEvict(value = "applicationAnalytics", allEntries = true)
    public void refreshAnalyticsCache() {
        log.info("Application analytics cache manually refreshed");
    }

    public ApplicationSearchResponse advancedSearch(ApplicationSearchRequest request) {
        log.info("Advanced search request: searchText='{}', status='{}', state='{}', schemeId={}", 
                request.getSearchText(), request.getStatus(), request.getState(), request.getSchemeId());

        // Default pagination - use unsorted pageable to avoid column name conflicts in native query
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 20;

        // Native query has ORDER BY built-in, so we use unsorted Pageable
        Pageable pageable = PageRequest.of(page, size);

        // Use native SQL query for better reliability
        Page<LoanApplication> applicationPage = applicationRepository.advancedSearchNative(
                request.getSearchText(),
                request.getStatus(),
                request.getState(),
                request.getSchemeId(),
                request.getCreatedAfter(),
                request.getCreatedBefore(),
                request.getMinAmount(),
                request.getMaxAmount(),
                request.getProviderName(),
                request.getSchemeName(),
                pageable
        );

        List<ApplicationDetailDTO> applications = applicationPage.getContent().stream()
                .map(this::mapToDetailDTO)
                .collect(Collectors.toList());

        return ApplicationSearchResponse.builder()
                .applications(applications)
                .totalElements(applicationPage.getTotalElements())
                .totalPages(applicationPage.getTotalPages())
                .currentPage(applicationPage.getNumber())
                .pageSize(applicationPage.getSize())
                .build();
    }

    private ApplicationDetailDTO mapToDetailDTO(LoanApplication app) {
        BeneficiaryProfile profile = beneficiaryProfileRepository
                .findByUserUserId(app.getUser().getUserId())
                .orElse(null);

        return ApplicationDetailDTO.builder()
                .applicationId(app.getApplicationId())
                .userId(app.getUser().getUserId())
                .userName(profile != null ? profile.getFullName() : null)
                .userEmail(app.getUser().getEmail())
                .userPhone(app.getUser().getPhoneNumber())
                .state(profile != null ? profile.getState() : null)
                .district(profile != null ? profile.getDistrict() : null)
                .groupId(app.getGroup() != null ? app.getGroup().getGroupId() : null)
                .groupName(app.getGroup() != null ? app.getGroup().getGroupName() : null)
                .schemeId(app.getScheme() != null ? app.getScheme().getSchemeId() : null)
                .schemeName(app.getScheme() != null ? app.getScheme().getSchemeName() : null)
                .requestedAmount(app.getRequestedAmount())
                .purpose(app.getPurpose())
                .tenureMonths(app.getTenureMonths())
                .status(app.getStatus())
                .rejectionReason(app.getRejectionReason())
                .stageTimestamp(app.getStageTimestamp())
                .sanctionedAmount(app.getSanctionedAmount())
                .finalInterestRate(app.getFinalInterestRate())
                .sanctionedBy(app.getSanctionedBy() != null ? app.getSanctionedBy().getUserId() : null)
                .sanctionedByName(app.getSanctionedBy() != null ? app.getSanctionedBy().getEmail() : null)
                .interestRate(app.getScheme() != null ? app.getScheme().getBaseInterestRate() : null)
                .processingFee(BigDecimal.ZERO) // Default to 0 as it's not in scheme yet
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
