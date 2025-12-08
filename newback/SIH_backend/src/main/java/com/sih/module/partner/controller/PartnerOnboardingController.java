package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.partner.dto.PartnerRequestDTO;
import com.sih.module.partner.entity.PartnerAccountRequest;
import com.sih.module.partner.service.PartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PartnerOnboardingController {

    private final PartnerService partnerService;

    // Public API
    @PostMapping("/api/v1/auth/partner/register")
    public ResponseEntity<ApiResponse<PartnerAccountRequest>> createRequest(@Valid @RequestBody PartnerRequestDTO dto) {
        PartnerAccountRequest request = partnerService.createRequest(dto);
        return ResponseEntity.ok(ApiResponse.success("Request submitted successfully", request));
    }

    // Admin APIs
    @GetMapping("/api/v1/admin/partner/requests")
    public ResponseEntity<ApiResponse<Page<PartnerAccountRequest>>> getRequests(
            @RequestParam(required = false, defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<PartnerAccountRequest> requests = partnerService.getAllRequests(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/api/v1/admin/partner/approve/{id}")
    public ResponseEntity<ApiResponse<String>> approveRequest(@PathVariable Long id) {
        partnerService.approveRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Partner approved successfully"));
    }

    @PostMapping("/api/v1/admin/partner/reject/{id}")
    public ResponseEntity<ApiResponse<String>> rejectRequest(@PathVariable Long id) {
        partnerService.rejectRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Partner rejected successfully"));
    }
}
