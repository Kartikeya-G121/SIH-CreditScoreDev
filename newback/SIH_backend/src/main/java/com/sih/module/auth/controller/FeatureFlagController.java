package com.sih.module.auth.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.auth.dto.FeatureFlagResponse;
import com.sih.module.auth.dto.FeatureFlagUpdateRequest;
import com.sih.module.auth.service.FeatureFlagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {
    
    private final FeatureFlagService featureFlagService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlagResponse>>> getAllFlags() {
        List<FeatureFlagResponse> flags = featureFlagService.getAllFlags();
        return ResponseEntity.ok(ApiResponse.success(flags));
    }
    
    @PutMapping("/{flagName}")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> updateFlag(
            @PathVariable String flagName,
            @Valid @RequestBody FeatureFlagUpdateRequest request) {
        FeatureFlagResponse response = featureFlagService.updateFlag(flagName, request);
        return ResponseEntity.ok(ApiResponse.success("Feature flag updated", response));
    }
}

