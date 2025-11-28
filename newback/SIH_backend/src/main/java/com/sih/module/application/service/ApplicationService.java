package com.sih.module.application.service;

import com.sih.common.config.FailSafeConfig;
import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.dto.*;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.group.entity.BorrowerGroup;
import com.sih.module.group.repository.BorrowerGroupRepository;
import com.sih.module.scheme.entity.LoanScheme;
import com.sih.module.scheme.repository.LoanSchemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {
    
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final BorrowerGroupRepository groupRepository;
    private final LoanSchemeRepository schemeRepository;
    private final FailSafeConfig failSafeConfig;
    
    @Transactional
    public ApplicationResponse createApplication(Long userId, ApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getIsBlacklisted()) {
            throw new BadRequestException("Blacklisted users cannot apply for loans");
        }
        
        LoanApplication application = LoanApplication.builder()
                .user(user)
                .requestedAmount(request.getRequestedAmount())
                .purpose(request.getPurpose())
                .status("DRAFT")
                .build();
        
        if (request.getGroupId() != null) {
            BorrowerGroup group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
            application.setGroup(group);
        }
        
        if (request.getSchemeId() != null) {
            LoanScheme scheme = schemeRepository.findById(request.getSchemeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));
            if (!scheme.getIsActive()) {
                throw new BadRequestException("Scheme is not active");
            }
            application.setScheme(scheme);
        }
        
        application = applicationRepository.save(application);
        log.info("Loan application created: {} by user: {}", application.getApplicationId(), userId);
        
        return mapToResponse(application);
    }
    
    public List<ApplicationResponse> getMyApplications(Long userId) {
        return applicationRepository.findByUserUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public ApplicationResponse getApplicationById(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        return mapToResponse(application);
    }
    
    @Transactional
    public ApplicationResponse updateApplication(Long applicationId, Long userId, ApplicationRequest request) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!application.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only update your own applications");
        }
        
        if (!"DRAFT".equals(application.getStatus())) {
            throw new BadRequestException("Only draft applications can be updated");
        }
        
        if (request.getRequestedAmount() != null) application.setRequestedAmount(request.getRequestedAmount());
        if (request.getPurpose() != null) application.setPurpose(request.getPurpose());
        if (request.getGroupId() != null) {
            BorrowerGroup group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
            application.setGroup(group);
        }
        if (request.getSchemeId() != null) {
            LoanScheme scheme = schemeRepository.findById(request.getSchemeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));
            application.setScheme(scheme);
        }
        
        application = applicationRepository.save(application);
        return mapToResponse(application);
    }
    
    @Transactional
    public ApplicationResponse submitApplication(Long applicationId, Long userId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!application.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only submit your own applications");
        }
        
        if (!"DRAFT".equals(application.getStatus())) {
            throw new BadRequestException("Application is not in draft status");
        }
        
        application.setStatus("SUBMITTED");
        application.setStageTimestamp(java.time.OffsetDateTime.now());
        
        application = applicationRepository.save(application);
        log.info("Application {} submitted", applicationId);
        
        // Fail-safe: Auto-trigger scoring if enabled, otherwise manual review
        try {
            // TODO: Trigger scoring engine asynchronously
            // For now, move to SCORING status
            application.setStatus("SCORING");
            applicationRepository.save(application);
        } catch (Exception e) {
            log.error("Failed to trigger scoring for application {}: {}", applicationId, e.getMessage());
            // Fail-safe: Continue with manual review if scoring fails
            application.setStatus("SUBMITTED");
            applicationRepository.save(application);
        }
        
        return mapToResponse(application);
    }
    
    @Transactional
    public ApplicationResponse withdrawApplication(Long applicationId, Long userId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!application.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only withdraw your own applications");
        }
        
        if ("SANCTIONED".equals(application.getStatus())) {
            throw new BadRequestException("Cannot withdraw sanctioned application");
        }
        
        application.setStatus("WITHDRAWN");
        application.setStageTimestamp(java.time.OffsetDateTime.now());
        
        application = applicationRepository.save(application);
        log.info("Application {} withdrawn", applicationId);
        
        return mapToResponse(application);
    }
    
    public List<ApplicationResponse> getPendingApplications() {
        return applicationRepository.findByStatus("SUBMITTED").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ApplicationResponse reviewApplication(Long applicationId, Long officerId, ReviewRequest request) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!"SUBMITTED".equals(application.getStatus()) && !"SCORING".equals(application.getStatus())) {
            throw new BadRequestException("Application is not in reviewable status");
        }
        
        if (request.getApproved() != null && request.getApproved()) {
            application.setStatus("APPROVED");
        } else {
            application.setStatus("REJECTED");
            application.setRejectionReason(request.getComments());
        }
        
        application.setStageTimestamp(java.time.OffsetDateTime.now());
        application = applicationRepository.save(application);
        
        log.info("Application {} reviewed: {}", applicationId, request.getApproved() ? "APPROVED" : "REJECTED");
        
        // Fail-safe: Auto-sanction if enabled and conditions met
        if (request.getApproved() != null && request.getApproved() && failSafeConfig.isAutoSanctionEnabled()) {
            try {
                // TODO: Auto-sanction logic based on scoring
                log.info("Auto-sanction enabled, but not yet implemented");
            } catch (Exception e) {
                log.error("Auto-sanction failed, requires manual sanction: {}", e.getMessage());
            }
        }
        
        return mapToResponse(application);
    }
    
    @Transactional
    public ApplicationResponse sanctionApplication(Long applicationId, Long officerId, SanctionRequest request) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!"APPROVED".equals(application.getStatus())) {
            throw new BadRequestException("Only approved applications can be sanctioned");
        }
        
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
        
        application.setStatus("SANCTIONED");
        application.setSanctionedAmount(request.getAmount());
        application.setFinalInterestRate(request.getInterestRate());
        application.setSanctionedBy(officer);
        application.setStageTimestamp(java.time.OffsetDateTime.now());
        
        application = applicationRepository.save(application);
        log.info("Application {} sanctioned: {} at {}%", applicationId, request.getAmount(), request.getInterestRate());
        
        // TODO: Create loan record (fail-safe: will be created manually if automatic creation fails)
        try {
            // Loan creation will be handled by LoanService
        } catch (Exception e) {
            log.error("Failed to create loan automatically for application {}: {}", applicationId, e.getMessage());
            // Application is still sanctioned, loan can be created manually
        }
        
        return mapToResponse(application);
    }
    
    public TimelineResponse getApplicationTimeline(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        List<TimelineResponse.TimelineEvent> events = new ArrayList<>();
        events.add(TimelineResponse.TimelineEvent.builder()
                .status(application.getStatus())
                .timestamp(application.getStageTimestamp())
                .comments("Current status")
                .build());
        
        return TimelineResponse.builder()
                .applicationId(applicationId)
                .events(events)
                .build();
    }
    
    private ApplicationResponse mapToResponse(LoanApplication application) {
        return ApplicationResponse.builder()
                .applicationId(application.getApplicationId())
                .userId(application.getUser().getUserId())
                .groupId(application.getGroup() != null ? application.getGroup().getGroupId() : null)
                .schemeId(application.getScheme() != null ? application.getScheme().getSchemeId() : null)
                .requestedAmount(application.getRequestedAmount())
                .purpose(application.getPurpose())
                .status(application.getStatus())
                .rejectionReason(application.getRejectionReason())
                .stageTimestamp(application.getStageTimestamp())
                .sanctionedAmount(application.getSanctionedAmount())
                .finalInterestRate(application.getFinalInterestRate())
                .sanctionedBy(application.getSanctionedBy() != null ? application.getSanctionedBy().getUserId() : null)
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}

