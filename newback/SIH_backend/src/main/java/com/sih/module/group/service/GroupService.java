package com.sih.module.group.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.group.dto.*;
import com.sih.module.group.entity.BorrowerGroup;
import com.sih.module.group.entity.GroupMember;
import com.sih.module.group.repository.BorrowerGroupRepository;
import com.sih.module.group.repository.GroupMemberRepository;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final BorrowerGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final LoanApplicationRepository applicationRepository;
    private final com.sih.module.loan.repository.LoanRepository loanRepository;

    private static final int MAX_GROUP_MEMBERS = 10;

    @Transactional
    public GroupResponse createGroup(Long userId, CreateGroupRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BorrowerGroup group = BorrowerGroup.builder()
                .groupName(request.getGroupName())
                .formationDate(
                        request.getFormationDate() != null ? request.getFormationDate() : java.time.LocalDate.now())
                .projectDescription(request.getProjectDescription())
                .createdBy(creator)
                .isActive(true)
                .build();

        group = groupRepository.save(group);

        // Add creator as leader
        GroupMember leader = GroupMember.builder()
                .group(group)
                .user(creator)
                .role("LEADER")
                .status("APPROVED")
                .build();
        memberRepository.save(leader);

        log.info("Group created: {} by user: {}", group.getGroupId(), userId);
        return mapToResponse(group);
    }

    public List<GroupResponse> getAllGroups() {
        return groupRepository.findByIsActive(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GroupResponse> getMyGroups(Long userId) {
        return memberRepository.findByUserUserId(userId).stream()
                .map(member -> mapToResponse(member.getGroup()))
                .collect(Collectors.toList());
    }

    public GroupResponse getGroupById(Long groupId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        return mapToResponse(group);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, Long userId, CreateGroupRequest request) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        // Verify user is the creator/leader
        if (!group.getCreatedBy().getUserId().equals(userId)) {
            throw new BadRequestException("Only group leader can update group");
        }

        if (request.getGroupName() != null)
            group.setGroupName(request.getGroupName());
        if (request.getFormationDate() != null)
            group.setFormationDate(request.getFormationDate());
        if (request.getProjectDescription() != null)
            group.setProjectDescription(request.getProjectDescription());

        group = groupRepository.save(group);
        return mapToResponse(group);
    }

    @Transactional
    public void disbandGroup(Long groupId, Long userId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!group.getCreatedBy().getUserId().equals(userId)) {
            throw new BadRequestException("Only group leader can disband group");
        }

        // Check if any member has an active loan
        boolean hasActiveLoans = loanRepository.existsByGroupGroupIdAndLoanStatus(groupId, "ACTIVE") ||
                loanRepository.existsByGroupGroupIdAndLoanStatus(groupId, "OVERDUE");

        if (hasActiveLoans) {
            throw new BadRequestException("Cannot disband group while there are active or overdue loans.");
        }

        group.setIsActive(false);
        groupRepository.save(group);
        log.info("Group disbanded: {}", groupId);
    }

    @Transactional
    public MemberResponse joinGroup(Long groupId, Long userId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!group.getIsActive()) {
            throw new BadRequestException("Group is not active");
        }

        // Check if already a member
        if (memberRepository.findByGroupGroupIdAndUserUserId(groupId, userId).isPresent()) {
            throw new BadRequestException("User is already a member of this group");
        }

        // Check member limit
        long memberCount = memberRepository.findByGroupGroupIdAndStatus(groupId, "APPROVED").size();
        if (memberCount >= MAX_GROUP_MEMBERS) {
            throw new BadRequestException("Group has reached maximum member limit");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GroupMember member = GroupMember.builder()
                .group(group)
                .user(user)
                .role("MEMBER")
                .status("PENDING")
                .build();

        member = memberRepository.save(member);
        log.info("User {} requested to join group {}", userId, groupId);

        return mapMemberToResponse(member);
    }

    @Transactional
    public void leaveGroup(Long groupId, Long userId) {
        GroupMember member = memberRepository.findByGroupGroupIdAndUserUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if ("LEADER".equals(member.getRole())) {
            throw new BadRequestException("Leader cannot leave group. Disband the group instead.");
        }

        // Check for active loan
        boolean hasActiveLoan = loanRepository.existsByUserUserIdAndLoanStatus(userId, "ACTIVE") ||
                loanRepository.existsByUserUserIdAndLoanStatus(userId, "OVERDUE");

        if (hasActiveLoan) {
            throw new BadRequestException("Cannot leave group while you have an active or overdue loan.");
        }

        // Check for active application
        List<LoanApplication> applications = applicationRepository.findByGroupGroupId(groupId);
        LoanApplication memberApp = applications.stream()
                .filter(app -> app.getUser().getUserId().equals(userId) &&
                        !List.of("WITHDRAWN", "REJECTED").contains(app.getStatus()))
                .findFirst()
                .orElse(null);

        if (memberApp != null) {
            if ("DRAFT".equals(memberApp.getStatus())) {
                applicationRepository.delete(memberApp);
                log.info("Deleted draft application {} for user {} leaving group {}", memberApp.getApplicationId(),
                        userId, groupId);
            } else {
                throw new BadRequestException(
                        "Cannot leave group while you have an active application in progress. Please withdraw it first.");
            }
        }

        memberRepository.delete(member);
        log.info("User {} left group {}", userId, groupId);
    }

    public List<MemberResponse> getGroupMembers(Long groupId) {
        return memberRepository.findByGroupGroupId(groupId).stream()
                .map(this::mapMemberToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MemberResponse approveMember(Long groupId, Long memberUserId, Long leaderId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        // Verify leader
        GroupMember leader = memberRepository.findByGroupGroupIdAndUserUserId(groupId, leaderId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this group"));

        if (!"LEADER".equals(leader.getRole())) {
            throw new BadRequestException("Only leader can approve members");
        }

        GroupMember member = memberRepository.findByGroupGroupIdAndUserUserId(groupId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        // Check member limit
        long approvedCount = memberRepository.findByGroupGroupIdAndStatus(groupId, "APPROVED").size();
        if (approvedCount >= MAX_GROUP_MEMBERS) {
            throw new BadRequestException("Group has reached maximum member limit");
        }

        member.setStatus("APPROVED");
        member = memberRepository.save(member);

        log.info("Member {} approved in group {}", memberUserId, groupId);
        return mapMemberToResponse(member);
    }

    @Transactional
    public void removeMember(Long groupId, Long memberUserId, Long leaderId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        // Verify leader
        GroupMember leader = memberRepository.findByGroupGroupIdAndUserUserId(groupId, leaderId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this group"));

        if (!"LEADER".equals(leader.getRole())) {
            throw new BadRequestException("Only leader can remove members");
        }

        GroupMember member = memberRepository.findByGroupGroupIdAndUserUserId(groupId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if ("LEADER".equals(member.getRole())) {
            throw new BadRequestException("Cannot remove leader");
        }

        // Check for active loan
        boolean hasActiveLoan = loanRepository.existsByUserUserIdAndLoanStatus(memberUserId, "ACTIVE") ||
                loanRepository.existsByUserUserIdAndLoanStatus(memberUserId, "OVERDUE");

        if (hasActiveLoan) {
            throw new BadRequestException("Cannot remove member who has an active or overdue loan.");
        }

        // Check for active application
        List<LoanApplication> applications = applicationRepository.findByGroupGroupId(groupId);
        LoanApplication memberApp = applications.stream()
                .filter(app -> app.getUser().getUserId().equals(memberUserId) &&
                        !List.of("WITHDRAWN", "REJECTED").contains(app.getStatus()))
                .findFirst()
                .orElse(null);

        if (memberApp != null) {
            if ("DRAFT".equals(memberApp.getStatus())) {
                applicationRepository.delete(memberApp);
                log.info("Deleted draft application {} for user {} removed from group {}", memberApp.getApplicationId(),
                        memberUserId, groupId);
            } else {
                throw new BadRequestException("Cannot remove member who has an active application in progress.");
            }
        }

        memberRepository.delete(member);
        log.info("Member {} removed from group {}", memberUserId, groupId);
    }

    @Transactional
    public List<MemberResponse> approveAllMembers(Long groupId, Long leaderId) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        // Verify leader
        GroupMember leader = memberRepository.findByGroupGroupIdAndUserUserId(groupId, leaderId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this group"));

        if (!"LEADER".equals(leader.getRole())) {
            throw new BadRequestException("Only leader can approve members");
        }

        List<GroupMember> pendingMembers = memberRepository.findByGroupGroupIdAndStatus(groupId, "PENDING");

        if (pendingMembers.isEmpty()) {
            return getGroupMembers(groupId);
        }

        // Check member limit
        long approvedCount = memberRepository.findByGroupGroupIdAndStatus(groupId, "APPROVED").size();
        if (approvedCount + pendingMembers.size() > MAX_GROUP_MEMBERS) {
            throw new BadRequestException("Approving all members would exceed the group limit of " + MAX_GROUP_MEMBERS);
        }

        pendingMembers.forEach(member -> member.setStatus("APPROVED"));
        memberRepository.saveAll(pendingMembers);

        log.info("All pending members approved in group {} by leader {}", groupId, leaderId);
        return getGroupMembers(groupId);
    }

    private GroupResponse mapToResponse(BorrowerGroup group) {
        List<GroupMember> members = memberRepository.findByGroupGroupId(group.getGroupId());

        return GroupResponse.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .formationDate(group.getFormationDate())
                .projectDescription(group.getProjectDescription())
                .createdByUserId(group.getCreatedBy() != null ? group.getCreatedBy().getUserId() : null)
                .leaderName(
                        group.getCreatedBy() != null
                                ? beneficiaryProfileRepository.findByUserUserId(group.getCreatedBy().getUserId())
                                        .map(p -> p.getFullName())
                                        .orElse("Unknown User")
                                : "Unknown")
                .groupScore(group.getGroupScore())
                .isActive(group.getIsActive())
                .memberCount(members.size())
                .maxMembers(MAX_GROUP_MEMBERS)
                .members(members.stream().map(this::mapMemberToResponse).collect(Collectors.toList()))
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private MemberResponse mapMemberToResponse(GroupMember member) {
        return MemberResponse.builder()
                .memberId(member.getMemberId())
                .userId(member.getUser().getUserId())
                .userName(beneficiaryProfileRepository.findByUserUserId(member.getUser().getUserId())
                        .map(p -> p.getFullName())
                        .orElse("Unknown User"))
                .email(member.getUser().getEmail())
                .phoneNumber(member.getUser().getPhoneNumber())
                .role(member.getRole())
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    @Transactional
    public void updateGroupStatus(Long groupId, String status) {
        BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!group.getGroupStatus().equals(status)) {
            group.setGroupStatus(status);

            // If Defaulted, maybe reduce score significantly
            if ("DEFAULTED".equals(status)) {
                group.setGroupScore(group.getGroupScore().subtract(java.math.BigDecimal.valueOf(50)));
            } else if ("AT_RISK".equals(status)) {
                group.setGroupScore(group.getGroupScore().subtract(java.math.BigDecimal.valueOf(10)));
            }

            groupRepository.save(group);
            log.info("Group {} status updated to {}", groupId, status);
        }
    }
}
