package com.sih.module.fraud.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.auth.entity.User;
import com.sih.module.fraud.dto.BlacklistRequest;
import com.sih.module.fraud.dto.FraudAlertResponse;
import com.sih.module.fraud.dto.ResolveAlertRequest;
import com.sih.module.fraud.service.FraudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fraud")
@RequiredArgsConstructor
public class FraudController {
    
    private final FraudService fraudService;
    
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<FraudAlertResponse>>> getAlerts(
            @RequestParam(required = false) Boolean isResolved) {
        List<FraudAlertResponse> alerts = fraudService.getAllAlerts(isResolved);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }
    
    @GetMapping("/alerts/{id}")
    public ResponseEntity<ApiResponse<FraudAlertResponse>> getAlertById(@PathVariable Long id) {
        FraudAlertResponse alert = fraudService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }
    
    @PutMapping("/alerts/{id}/resolve")
    public ResponseEntity<ApiResponse<FraudAlertResponse>> resolveAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal Long resolverId,
            @Valid @RequestBody ResolveAlertRequest request) {
        FraudAlertResponse response = fraudService.resolveAlert(id, resolverId, request);
        return ResponseEntity.ok(ApiResponse.success("Alert resolved", response));
    }
    
    @PostMapping("/check-user/{userId}")
    public ResponseEntity<ApiResponse<Object>> checkUser(@PathVariable Long userId) {
        fraudService.checkUserForFraud(userId);
        return ResponseEntity.ok(ApiResponse.success("Fraud check initiated"));
    }
    
    @PostMapping("/blacklist/{userId}")
    public ResponseEntity<ApiResponse<Object>> blacklistUser(
            @PathVariable Long userId,
            @Valid @RequestBody BlacklistRequest request) {
        fraudService.blacklistUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User blacklisted"));
    }
    
    @GetMapping("/blacklist")
    public ResponseEntity<ApiResponse<List<User>>> getBlacklistedUsers() {
        List<User> users = fraudService.getBlacklistedUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}

