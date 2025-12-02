package com.sih.module.fraud.service;

import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.fraud.dto.BlacklistRequest;
import com.sih.module.fraud.dto.FraudAlertResponse;
import com.sih.module.fraud.dto.ResolveAlertRequest;
import com.sih.module.fraud.entity.FraudAlert;
import com.sih.module.fraud.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudService {
    
    private final FraudAlertRepository alertRepository;
    private final UserRepository userRepository;
    
    public List<FraudAlertResponse> getAllAlerts(Boolean isResolved) {
        List<FraudAlert> alerts = isResolved != null ? 
                alertRepository.findByIsResolved(isResolved) : 
                alertRepository.findAll();
        
        return alerts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public FraudAlertResponse getAlertById(Long alertId) {
        FraudAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        return mapToResponse(alert);
    }
    
    @Transactional
    public FraudAlertResponse resolveAlert(Long alertId, Long resolverId, ResolveAlertRequest request) {
        FraudAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        
        User resolver = userRepository.findById(resolverId)
                .orElseThrow(() -> new ResourceNotFoundException("Resolver not found"));
        
        alert.setIsResolved(true);
        alert.setResolutionComments(request.getResolutionComments());
        alert.setResolver(resolver);
        alert.setResolvedAt(java.time.OffsetDateTime.now());
        
        alert = alertRepository.save(alert);
        log.info("Alert {} resolved by {}", alertId, resolverId);
        
        return mapToResponse(alert);
    }
    
    @Transactional
    public void checkUserForFraud(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // TODO: Implement fraud detection logic
        // Check for patterns, spikes, duplicates, etc.
        log.info("Fraud check triggered for user: {}", userId);
    }
    
    @Transactional
    public void blacklistUser(Long userId, BlacklistRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setIsBlacklisted(true);
        userRepository.save(user);
        
        // Create fraud alert
        FraudAlert alert = FraudAlert.builder()
                .user(user)
                .alertType("BLACKLISTED")
                .severity("HIGH")
                .description("User blacklisted: " + request.getReason())
                .isResolved(false)
                .build();
        
        alertRepository.save(alert);
        log.info("User {} blacklisted: {}", userId, request.getReason());
    }
    
    public List<User> getBlacklistedUsers() {
        return userRepository.findAll().stream()
                .filter(User::getIsBlacklisted)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void createAlert(Long userId, String sourceTable, Long sourceId, 
                           String alertType, String severity, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        FraudAlert alert = FraudAlert.builder()
                .user(user)
                .sourceTable(sourceTable)
                .sourceId(sourceId)
                .alertType(alertType)
                .severity(severity)
                .description(description)
                .isResolved(false)
                .build();
        
        alertRepository.save(alert);
        log.info("Fraud alert created: {} for user: {}", alertType, userId);
    }
    
    private FraudAlertResponse mapToResponse(FraudAlert alert) {
        return FraudAlertResponse.builder()
                .alertId(alert.getAlertId())
                .userId(alert.getUser().getUserId())
                .userEmail(alert.getUser().getEmail())
                .sourceTable(alert.getSourceTable())
                .sourceId(alert.getSourceId())
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .description(alert.getDescription())
                .isResolved(alert.getIsResolved())
                .resolutionComments(alert.getResolutionComments())
                .resolverId(alert.getResolver() != null ? alert.getResolver().getUserId() : null)
                .resolvedAt(alert.getResolvedAt())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}

