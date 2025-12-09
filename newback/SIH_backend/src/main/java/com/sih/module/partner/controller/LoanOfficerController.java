package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.dto.ApplicationResponse;
import com.sih.module.application.dto.ReviewRequest;
import com.sih.module.application.dto.SanctionRequest;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.application.service.ApplicationService;
import com.sih.module.partner.entity.LoanOfficer;
import com.sih.module.partner.repository.LoanOfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/officer")
@RequiredArgsConstructor
public class LoanOfficerController {

    private final LoanOfficerRepository officerRepository;
    private final LoanApplicationRepository applicationRepository;
    private final ApplicationService applicationService;

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<LoanApplication>>> getApplications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // Check if officer record exists for this user
        LoanOfficer officer = officerRepository.findByUserUserId(userId)
                .orElse(null);

        // If no officer record exists, return empty page
        // This can happen for LOAN_OFFICER users who haven't been assigned to a partner yet
        if (officer == null) {
            return ResponseEntity.ok(ApiResponse.success(Page.empty()));
        }

        Set<Integer> assignedSchemes = officer.getAssignedSchemeIds();

        Page<LoanApplication> applications;
        if (assignedSchemes == null || assignedSchemes.isEmpty()) {
            applications = Page.empty();
        } else {
            applications = applicationRepository.findBySchemeSchemeIdIn(assignedSchemes, PageRequest.of(page, size));
        }

        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @PostMapping("/application/{id}/review")
    public ResponseEntity<ApiResponse<ApplicationResponse>> reviewApplication(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody ReviewRequest request) { // Approve/Reject

        ApplicationResponse response = applicationService.reviewApplication(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Application reviewed successfully", response));
    }

    @PostMapping("/application/{id}/sanction")
    public ResponseEntity<ApiResponse<ApplicationResponse>> sanctionApplication(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody SanctionRequest request) {

        ApplicationResponse response = applicationService.sanctionApplication(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Application sanctioned successfully", response));
    }
}
