package com.sih.module.auth.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.common.enums.UserRole;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.dto.AuthResponse;
import com.sih.module.auth.dto.UserSearchCriteria;
import com.sih.module.auth.dto.UserSearchResponse;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.auth.service.UserSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserSearchService userSearchService;

    @GetMapping("/stats")
    // @PreAuthorize("hasRole('ADMIN')") // Uncomment when security is fully configured
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("beneficiaries", userRepository.countByRole(UserRole.BENEFICIARY));
        stats.put("loanOfficers", userRepository.countByRole(UserRole.LOAN_OFFICER));
        stats.put("admins", userRepository.countByRole(UserRole.ADMIN));
        
        return ResponseEntity.ok(ApiResponse.success("Admin stats fetched successfully", stats));
    }

    @GetMapping("/users/search")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> searchUser(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return ResponseEntity.ok(ApiResponse.success("User found", user));
    }

    @PostMapping("/users/role")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUserRole(@RequestParam String email, @RequestParam String role) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        try {
            UserRole newRole = UserRole.valueOf(role.toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("User role updated successfully", user));
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Invalid role: " + role);
        }
    }

    @PostMapping("/users/{userId}/role")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUserRoleById(@PathVariable Long userId, @RequestParam String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        try {
            UserRole newRole = UserRole.valueOf(role.toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("User role updated successfully", user));
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Invalid role: " + role);
        }
    }

    /**
     * Advanced user search with multiple filters
     */
    @PostMapping("/users/search/advanced")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSearchResponse>> advancedSearch(@RequestBody UserSearchCriteria criteria) {
        UserSearchResponse response = userSearchService.advancedSearch(criteria);
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", response));
    }

    /**
     * Block/Unblock user (toggle isBlacklisted status)
     */
    @PostMapping("/users/{userId}/toggle-status")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> toggleUserStatus(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        user.setIsBlacklisted(!user.getIsBlacklisted());
        userRepository.save(user);
        
        String message = user.getIsBlacklisted() ? "User blocked successfully" : "User unblocked successfully";
        return ResponseEntity.ok(ApiResponse.success(message, user));
    }

    /**
     * Block user (set isBlacklisted = true)
     */
    @PostMapping("/users/{userId}/block")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> blockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        user.setIsBlacklisted(true);
        userRepository.save(user);
        
        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", user));
    }

    /**
     * Unblock user (set isBlacklisted = false)
     */
    @PostMapping("/users/{userId}/unblock")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> unblockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        user.setIsBlacklisted(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", user));
    }
}
