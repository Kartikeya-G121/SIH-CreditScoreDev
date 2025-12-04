    package com.sih.module.group.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.group.dto.*;
import com.sih.module.group.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse response = groupService.createGroup(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Group created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getAllGroups() {
        List<GroupResponse> groups = groupService.getAllGroups();
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getMyGroups(
            @AuthenticationPrincipal Long userId) {
        List<GroupResponse> groups = groupService.getMyGroups(userId);
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupById(@PathVariable Long id) {
        GroupResponse response = groupService.getGroupById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse response = groupService.updateGroup(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> disbandGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        groupService.disbandGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Group disbanded successfully"));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<MemberResponse>> joinGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        MemberResponse response = groupService.joinGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Join request submitted", response));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Object>> leaveGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        groupService.leaveGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Left group successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> getGroupMembers(@PathVariable Long id) {
        List<MemberResponse> members = groupService.getGroupMembers(id);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @PutMapping("/{id}/members/{userId}/approve")
    public ResponseEntity<ApiResponse<MemberResponse>> approveMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal Long leaderId) {
        MemberResponse response = groupService.approveMember(id, userId, leaderId);
        return ResponseEntity.ok(ApiResponse.success("Member approved", response));
    }

    @PutMapping("/{id}/members/approve-all")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> approveAllMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal Long leaderId) {
        List<MemberResponse> response = groupService.approveAllMembers(id, leaderId);
        return ResponseEntity.ok(ApiResponse.success("All pending members approved", response));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Object>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal Long leaderId) {
        groupService.removeMember(id, userId, leaderId);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully"));
    }
}
