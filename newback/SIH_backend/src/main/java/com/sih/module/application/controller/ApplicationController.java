package com.sih.module.application.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.application.dto.*;
import com.sih.module.application.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {
    
    private final ApplicationService applicationService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.createApplication(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Application created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal Long userId) {
        List<ApplicationResponse> applications = applicationService.getMyApplications(userId);
        return ResponseEntity.ok(ApiResponse.success(applications));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationById(@PathVariable Long id) {
        ApplicationResponse response = applicationService.getApplicationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.updateApplication(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Application updated successfully", response));
    }
    
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ApplicationResponse>> submitApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        ApplicationResponse response = applicationService.submitApplication(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Application submitted successfully", response));
    }
    
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<ApplicationResponse>> withdrawApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        ApplicationResponse response = applicationService.withdrawApplication(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Application withdrawn", response));
    }
    
    @GetMapping("/officer/pending")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getPendingApplications() {
        List<ApplicationResponse> applications = applicationService.getPendingApplications();
        return ResponseEntity.ok(ApiResponse.success(applications));
    }
    
    @PutMapping("/{id}/review")
    public ResponseEntity<ApiResponse<ApplicationResponse>> reviewApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long officerId,
            @Valid @RequestBody ReviewRequest request) {
        ApplicationResponse response = applicationService.reviewApplication(id, officerId, request);
        return ResponseEntity.ok(ApiResponse.success("Application reviewed", response));
    }
    
    @PostMapping("/{id}/sanction")
    public ResponseEntity<ApiResponse<ApplicationResponse>> sanctionApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Long officerId,
            @Valid @RequestBody SanctionRequest request) {
        ApplicationResponse response = applicationService.sanctionApplication(id, officerId, request);
        return ResponseEntity.ok(ApiResponse.success("Loan sanctioned successfully", response));
    }
    
    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<TimelineResponse>> getTimeline(@PathVariable Long id) {
        TimelineResponse response = applicationService.getApplicationTimeline(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

