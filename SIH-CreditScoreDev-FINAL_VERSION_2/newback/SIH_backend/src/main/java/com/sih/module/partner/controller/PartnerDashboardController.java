package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.partner.dto.OfficerCreateRequest;
import com.sih.module.partner.entity.ChannelPartner;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import com.sih.module.partner.service.PartnerDashboardService;
import com.sih.module.scheme.dto.SchemeRequest;
import com.sih.module.scheme.dto.SchemeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partner")
@RequiredArgsConstructor
public class PartnerDashboardController {

    private final PartnerDashboardService dashboardService;
    private final LoanApplicationRepository applicationRepository; // Direct usage for read-only View
    private final ChannelPartnerRepository partnerRepository;

    @PostMapping("/schemes")
    public ResponseEntity<ApiResponse<SchemeResponse>> createScheme(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SchemeRequest request) {
        
        SchemeResponse response = dashboardService.createScheme(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Scheme created successfully", response));
    }

    @PostMapping("/officers")
    public ResponseEntity<ApiResponse<String>> createOfficer(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody OfficerCreateRequest request) {
        
        dashboardService.createLoanOfficer(userId, request.getName(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Loan Officer created successfully. Credentials sent via email."));
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<LoanApplication>>> getApplications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // Find partner ID from User ID
        // Note: For production, better to cache this mapping or put in Principal
        ChannelPartner partner = partnerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        Page<LoanApplication> applications = applicationRepository.findBySchemeChannelPartnerId(partner.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(applications));
    }
}
