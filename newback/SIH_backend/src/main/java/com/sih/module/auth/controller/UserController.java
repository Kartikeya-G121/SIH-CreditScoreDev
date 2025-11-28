package com.sih.module.auth.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.auth.dto.UserProfileResponse;
import com.sih.module.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    
    private final AuthService authService;
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal Long userId) {
        // userId is extracted from JWT token by JwtAuthenticationFilter
        if (userId == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Unauthorized"));
        }
        UserProfileResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

