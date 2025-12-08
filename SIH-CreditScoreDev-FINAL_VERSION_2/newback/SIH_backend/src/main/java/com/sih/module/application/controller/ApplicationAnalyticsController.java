package com.sih.module.application.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.application.dto.ApplicationAnalyticsResponse;
import com.sih.module.application.dto.ApplicationSearchRequest;
import com.sih.module.application.dto.ApplicationSearchResponse;
import com.sih.module.application.service.ApplicationAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/applications")
@RequiredArgsConstructor
public class ApplicationAnalyticsController {

    private final ApplicationAnalyticsService analyticsService;

    /**
     * Get application analytics (cached)
     */
    @GetMapping("/analytics")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ApplicationAnalyticsResponse>> getAnalytics() {
        ApplicationAnalyticsResponse analytics = analyticsService.getApplicationAnalytics();
        // Mark as cached if this is a subsequent call
        analytics.setIsCached(true);
        return ResponseEntity.ok(ApiResponse.success("Application analytics fetched successfully", analytics));
    }

    /**
     * Manually refresh analytics cache
     */
    @PostMapping("/refresh-cache")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ApplicationAnalyticsResponse>> refreshCache() {
        analyticsService.refreshAnalyticsCache();
        ApplicationAnalyticsResponse analytics = analyticsService.getApplicationAnalytics();
        analytics.setIsCached(false);
        return ResponseEntity.ok(ApiResponse.success("Cache refreshed successfully", analytics));
    }

    /**
     * Advanced application search with filters
     */
    @PostMapping("/search")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ApplicationSearchResponse>> advancedSearch(
            @RequestBody ApplicationSearchRequest request) {
        ApplicationSearchResponse response = analyticsService.advancedSearch(request);
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", response));
    }
}
