package com.sih.module.application.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.application.dto.ApplicationAnalyticsResponse;
import com.sih.module.application.dto.ApplicationSearchRequest;
import com.sih.module.application.dto.ApplicationSearchResponse;
import com.sih.module.application.service.ApplicationAnalyticsService;
import lombok.RequiredArgsConstructor;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/applications")
@RequiredArgsConstructor
public class ApplicationAnalyticsController {

    private final ApplicationAnalyticsService analyticsService;
    private final ChannelPartnerRepository partnerRepository;

    /**
     * Get application analytics (cached)
     */
    @GetMapping("/analytics")
    // @PreAuthorize("hasRole('ADMIN')")

    public ResponseEntity<ApiResponse<ApplicationAnalyticsResponse>> getAnalytics() {
        String providerName = null; // Default for ADMIN
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHANNEL_PARTNER"))) {
            try {
                Long userId = (Long) auth.getPrincipal();
                providerName = partnerRepository.findByUserUserId(userId)
                        .map(p -> p.getOrganizationName())
                        .orElse(null);
            } catch (Exception e) {
                // Fallback if principal is not Long
            }
        }

        ApplicationAnalyticsResponse analytics = analyticsService.getApplicationAnalytics(providerName);
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

        String providerName = null; // Default for ADMIN
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHANNEL_PARTNER"))) {
            try {
                Long userId = (Long) auth.getPrincipal();
                providerName = partnerRepository.findByUserUserId(userId)
                        .map(p -> p.getOrganizationName())
                        .orElse(null);
            } catch (Exception e) {
                // Fallback if principal is not Long
            }
        }

        ApplicationAnalyticsResponse analytics = analyticsService.getApplicationAnalytics(providerName);
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

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHANNEL_PARTNER"))) {
            try {
                Long userId = (Long) auth.getPrincipal();
                partnerRepository.findByUserUserId(userId)
                        .ifPresent(p -> request.setProviderName(p.getOrganizationName()));
            } catch (Exception e) {
                // Fallback if principal is not Long
            }
        }

        ApplicationSearchResponse response = analyticsService.advancedSearch(request);
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", response));
    }
}
