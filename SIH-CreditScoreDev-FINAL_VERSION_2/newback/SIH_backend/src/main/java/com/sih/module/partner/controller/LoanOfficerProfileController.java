package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.partner.entity.LoanOfficer;
import com.sih.module.partner.entity.LoanOfficerProfile;
import com.sih.module.partner.repository.LoanOfficerProfileRepository;
import com.sih.module.partner.repository.LoanOfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/officer/profile")
@RequiredArgsConstructor
public class LoanOfficerProfileController {

    private final LoanOfficerRepository officerRepository;
    private final LoanOfficerProfileRepository profileRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<LoanOfficerProfile>> getProfile(@AuthenticationPrincipal Long userId) {
        LoanOfficer officer = officerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found for user"));
        
        LoanOfficerProfile profile = profileRepository.findByLoanOfficerId(officer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/update")
    @Transactional
    public ResponseEntity<ApiResponse<LoanOfficerProfile>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody LoanOfficerProfile updatedProfile) {
        
        LoanOfficer officer = officerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found for user"));

        LoanOfficerProfile profile = profileRepository.findByLoanOfficerId(officer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
                
        // Update fields
        profile.setFullName(updatedProfile.getFullName());
        profile.setMobileNumber(updatedProfile.getMobileNumber());
        profile.setDesignation(updatedProfile.getDesignation());
        profile.setEmployeeId(updatedProfile.getEmployeeId());
        profile.setOfficeLocation(updatedProfile.getOfficeLocation());
        
        if (updatedProfile.getProfilePhoto() != null) profile.setProfilePhoto(updatedProfile.getProfilePhoto());
        if (updatedProfile.getIdCardPdf() != null) profile.setIdCardPdf(updatedProfile.getIdCardPdf());

        // Check completion logic
        if (profile.getFullName() != null && !profile.getFullName().isEmpty() &&
            profile.getMobileNumber() != null && !profile.getMobileNumber().isEmpty() &&
            profile.getDesignation() != null && !profile.getDesignation().isEmpty()) {
            profile.setProfileCompleted(true);
        }

        profileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }
}
