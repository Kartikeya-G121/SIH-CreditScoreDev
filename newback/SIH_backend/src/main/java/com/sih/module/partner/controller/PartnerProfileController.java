package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.partner.entity.ChannelPartnerProfile;
import com.sih.module.partner.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partner/profile")
@RequiredArgsConstructor
public class PartnerProfileController {

    private final PartnerService partnerService;

    @GetMapping
    public ResponseEntity<ApiResponse<ChannelPartnerProfile>> getProfile(@AuthenticationPrincipal Long userId) {
        ChannelPartnerProfile profile = partnerService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<ChannelPartnerProfile>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody ChannelPartnerProfile profile) {
        
        ChannelPartnerProfile updated = partnerService.updateProfile(userId, profile);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }
}
