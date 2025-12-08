package com.sih.module.loan.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.loan.dto.LoanResponse;
import com.sih.module.loan.service.LoanAnalyticsService;
import com.sih.module.loan.service.LoanService;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.sih.module.loan.dto.LoanSearchCriteria;
import org.springframework.data.domain.Page;
import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/loans")
@RequiredArgsConstructor
public class AdminLoanController {

    private final LoanService loanService;
    private final LoanAnalyticsService analyticsService;
    private final ChannelPartnerRepository partnerRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER', 'CHANNEL_PARTNER')")
    public ResponseEntity<ApiResponse<Page<LoanResponse>>> searchLoans(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String riskBucket,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Boolean isNpa,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        LoanSearchCriteria criteria = new LoanSearchCriteria();
        criteria.setQuery(query);
        criteria.setStatus(status);
        criteria.setState(state);
        criteria.setRiskBucket(riskBucket);
        criteria.setMinAmount(minAmount);
        criteria.setMaxAmount(maxAmount);
        criteria.setStartDate(startDate);
        criteria.setEndDate(endDate);
        criteria.setIsNpa(isNpa);
        criteria.setPage(page);
        criteria.setSize(size);
        criteria.setSortBy(sortBy);
        criteria.setSortDir(sortDir);

        // Context-Aware Filtering
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHANNEL_PARTNER"))) {
            partnerRepository.findByLoginEmail(auth.getName())
                    .ifPresent(partner -> criteria.setProviderName(partner.getOrganizationName()));
        }

        return ResponseEntity.ok(ApiResponse.success(loanService.searchLoans(criteria)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(loanService.getLoanById(id)));
    }
}
