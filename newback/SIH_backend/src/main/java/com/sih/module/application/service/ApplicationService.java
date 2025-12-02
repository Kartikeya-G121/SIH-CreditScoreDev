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
import com.sih.module.group.entity.GroupMember;
import com.sih.module.group.repository.BorrowerGroupRepository;
import com.sih.module.group.repository.GroupMemberRepository;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
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
    private final GroupMemberRepository groupMemberRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final LoanSchemeRepository schemeRepository;
    private final FailSafeConfig failSafeConfig;

    @Transactional
    public ApplicationResponse createApplication(Long userId, ApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsBlacklisted()) {
            throw new BadRequestException("Blacklisted users cannot apply for loans");
        }

        // Check for existing active individual application
        if (request.getGroupId() == null) {
            List<LoanApplication> existingApplications = applicationRepository.findByUserUserId(userId);
            boolean hasActiveApplication = existingApplications.stream()
                    .anyMatch(app -> app.getGroup() == null &&
                            !List.of("SANCTIONED", "REJECTED", "WITHDRAWN").contains(app.getStatus()));

            if (hasActiveApplication) {
                throw new BadRequestException(
                        "You already have an active individual loan application. Please wait for it to be sanctioned, rejected, or withdraw it before applying for a new one.");
            }
        }

        LoanApplication application = LoanApplication.builder()
                .user(user)
                .requestedAmount(request.getRequestedAmount())
                .purpose(request.getPurpose())
                .tenureMonths(request.getTenureMonths())
                .status("DRAFT")
                .build();

        if (request.getGroupId() != null) {
            BorrowerGroup group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

            // Verify user is a member of the group
            boolean isMember = groupMemberRepository.existsByGroupGroupIdAndUserUserIdAndStatus(
                    request.getGroupId(), userId, "APPROVED");
            if (!isMember) {
                throw new BadRequestException("You must be an approved member of the group to apply");
            }

            // Check if user already has an active application in this group
            List<LoanApplication> existingGroupApps = applicationRepository.findByGroupGroupId(request.getGroupId());
            boolean hasActiveGroupApp = existingGroupApps.stream()
                    .anyMatch(app -> app.getUser().getUserId().equals(userId) &&
                            !List.of("SANCTIONED", "REJECTED", "WITHDRAWN").contains(app.getStatus()));

            if (hasActiveGroupApp) {
                throw new BadRequestException("You already have an active application in this group");
            }

            application.setGroup(group);
        }

        if (request.getSchemeId() != null) {
            LoanScheme scheme = schemeRepository.findById(request.getSchemeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));
            if (!scheme.getIsActive()) {
                throw new BadRequestException("Scheme is not active");
            }
            if (request.getTenureMonths() != null && scheme.getMaxTenureMonths() != null
                    && request.getTenureMonths() > scheme.getMaxTenureMonths()) {
                throw new BadRequestException(
                        "Tenure cannot exceed scheme maximum of " + scheme.getMaxTenureMonths() + " months");
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

        if (request.getRequestedAmount() != null)
            application.setRequestedAmount(request.getRequestedAmount());
        if (request.getPurpose() != null)
            application.setPurpose(request.getPurpose());
        if (request.getTenureMonths() != null)
            application.setTenureMonths(request.getTenureMonths());

        if (request.getGroupId() != null) {
            BorrowerGroup group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

            // Verify user is a member of the new group
            boolean isMember = groupMemberRepository.existsByGroupGroupIdAndUserUserIdAndStatus(
                    request.getGroupId(), userId, "APPROVED");
            if (!isMember) {
                throw new BadRequestException("You must be an approved member of the group to apply");
            }

            application.setGroup(group);
        }
        if (request.getSchemeId() != null) {
            LoanScheme scheme = schemeRepository.findById(request.getSchemeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));

            // Validate tenure against new scheme
            Integer tenureToCheck = request.getTenureMonths() != null ? request.getTenureMonths()
                    : application.getTenureMonths();
            if (tenureToCheck != null && scheme.getMaxTenureMonths() != null
                    && tenureToCheck > scheme.getMaxTenureMonths()) {
                throw new BadRequestException(
                        "Tenure cannot exceed scheme maximum of " + scheme.getMaxTenureMonths() + " months");
            }

            application.setScheme(scheme);
        } else if (request.getTenureMonths() != null && application.getScheme() != null) {
            // Validate new tenure against existing scheme
            LoanScheme scheme = application.getScheme();
            if (scheme.getMaxTenureMonths() != null && request.getTenureMonths() > scheme.getMaxTenureMonths()) {
                throw new BadRequestException(
                        "Tenure cannot exceed scheme maximum of " + scheme.getMaxTenureMonths() + " months");
            }
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

        // TODO: Create loan record (fail-safe: will be created manually if automatic
        // creation fails)
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

    public List<GroupApplicationStatusResponse> getGroupApplicationStatus(Long groupId, Long userId) {
        // Verify user is a member of the group
        boolean isMember = groupMemberRepository.existsByGroupGroupIdAndUserUserIdAndStatus(
                groupId, userId, "APPROVED");
        if (!isMember) {
            throw new BadRequestException("You must be an approved member of the group to view application status");
        }

        // Get all approved members
        List<GroupMember> members = groupMemberRepository.findByGroupGroupIdAndStatus(groupId, "APPROVED");

        // Get all applications for this group
        List<LoanApplication> applications = applicationRepository.findByGroupGroupId(groupId);

        return members.stream().map(member -> {
            // Find application for this member
            LoanApplication app = applications.stream()
                    .filter(a -> a.getUser().getUserId().equals(member.getUser().getUserId()) &&
                            !List.of("SANCTIONED", "REJECTED", "WITHDRAWN").contains(a.getStatus()))
                    .findFirst()
                    .orElse(null);

            return GroupApplicationStatusResponse.builder()
                    .userId(member.getUser().getUserId())
                    .userName(beneficiaryProfileRepository.findByUserUserId(member.getUser().getUserId())
                            .map(p -> p.getFullName())
                            .orElse("Unknown User"))
                    .role(member.getRole())
                    .applicationId(app != null ? app.getApplicationId() : null)
                    .status(app != null ? app.getStatus() : "NOT_APPLIED")
                    .requestedAmount(app != null ? app.getRequestedAmount() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<ApplicationResponse> submitGroupApplications(Long groupId, Long leaderId) {
        // Verify leader
        GroupMember leaderMember = groupMemberRepository.findByGroupGroupIdAndUserUserId(groupId, leaderId)
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));

        if (!"LEADER".equals(leaderMember.getRole())) {
            throw new BadRequestException("Only the group leader can submit group applications");
        }

        List<GroupMember> members = groupMemberRepository.findByGroupGroupIdAndStatus(groupId, "APPROVED");
        List<LoanApplication> applications = applicationRepository.findByGroupGroupId(groupId);

        // Filter for active DRAFT applications
        List<LoanApplication> draftApplications = applications.stream()
                .filter(app -> "DRAFT".equals(app.getStatus()))
                .collect(Collectors.toList());

        // Check if all members have a draft application
        // Note: This logic assumes 1 active draft per member.
        // Since we restrict creation, checking size might be enough if we assume no
        // other active apps.
        // Better to verify each member has exactly one DRAFT application.

        List<Long> membersWithDrafts = draftApplications.stream()
                .map(app -> app.getUser().getUserId())
                .collect(Collectors.toList());

        for (GroupMember member : members) {
            if (!membersWithDrafts.contains(member.getUser().getUserId())) {
                String memberName = beneficiaryProfileRepository.findByUserUserId(member.getUser().getUserId())
                        .map(p -> p.getFullName())
                        .orElse("Unknown Name");
                throw new BadRequestException(
                        "Cannot submit: Member " + memberName + " (" + member.getUser().getPhoneNumber()
                                + ") has not drafted an application yet.");
            }
        }

        // Submit all
        draftApplications.forEach(app -> {
            app.setStatus("SUBMITTED");
            app.setStageTimestamp(java.time.OffsetDateTime.now());
        });

        List<LoanApplication> savedApps = applicationRepository.saveAll(draftApplications);
        log.info("Group {} applications submitted by leader {}", groupId, leaderId);

        // Fail-safe: Trigger scoring for batch?
        // For now, just move to SCORING or SUBMITTED as per individual flow
        // We can iterate and trigger individual scoring or batch scoring

        return savedApps.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ApplicationResponse mapToResponse(LoanApplication application) {
        return ApplicationResponse.builder()
                .applicationId(application.getApplicationId())
                .userId(application.getUser().getUserId())
                .groupId(application.getGroup() != null ? application.getGroup().getGroupId() : null)
                .schemeId(application.getScheme() != null ? application.getScheme().getSchemeId() : null)
                .requestedAmount(application.getRequestedAmount())
                .purpose(application.getPurpose())
                .tenureMonths(application.getTenureMonths())
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
