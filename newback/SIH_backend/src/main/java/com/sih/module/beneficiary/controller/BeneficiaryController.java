package com.sih.module.beneficiary.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.beneficiary.dto.*;
import com.sih.module.beneficiary.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> createProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody CreateProfileRequest request) {
        ProfileResponse response = beneficiaryService.createProfile(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile created successfully", response));
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> createProfileWithFiles(
            @AuthenticationPrincipal Long userId,
            @ModelAttribute CreateProfileWithFilesRequest request,
            @RequestParam(value = "casteCertificate", required = false) MultipartFile casteCertificate,
            @RequestParam(value = "identityProof", required = false) MultipartFile identityProof) {
        try {
            ProfileResponse response = beneficiaryService.createProfileWithFiles(
                    userId, request, casteCertificate, identityProof);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Profile created successfully with files", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create profile: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            @AuthenticationPrincipal Long userId) {
        ProfileResponse response = beneficiaryService.getMyProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody UpdateProfileRequest request) {
        ProfileResponse response = beneficiaryService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PutMapping("/me/with-files")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfileWithFiles(
            @AuthenticationPrincipal Long userId,
            @ModelAttribute UpdateProfileWithFilesRequest request,
            @RequestParam(value = "casteCertificate", required = false) MultipartFile casteCertificate,
            @RequestParam(value = "identityProof", required = false) MultipartFile identityProof) {
        try {
            ProfileResponse response = beneficiaryService.updateProfileWithFiles(
                    userId, request, casteCertificate, identityProof);
            return ResponseEntity.ok(ApiResponse.success("Profile updated successfully with files", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-certificate")
    public ResponseEntity<ApiResponse<String>> uploadCertificate(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            String result = beneficiaryService.uploadCertificate(
                    userId, file.getBytes(), file.getOriginalFilename());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to upload certificate: " + e.getMessage()));
        }
    }

    @GetMapping("/certificate/download")
    public ResponseEntity<byte[]> downloadCertificate(@AuthenticationPrincipal Long userId) {
        byte[] certificate = beneficiaryService.downloadCertificate(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(certificate);
    }

    @PostMapping("/upload-identity")
    public ResponseEntity<ApiResponse<String>> uploadIdentityProof(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            String result = beneficiaryService.uploadIdentityProof(
                    userId, file.getBytes(), file.getOriginalFilename());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to upload identity proof: " + e.getMessage()));
        }
    }

    @GetMapping("/identity/download")
    public ResponseEntity<byte[]> downloadIdentityProof(@AuthenticationPrincipal Long userId) {
        byte[] identityProof = beneficiaryService.downloadIdentityProof(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "identity_proof.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(identityProof);
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> searchProfiles(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String pincode) {
        List<ProfileResponse> profiles = beneficiaryService.searchProfiles(state, district, pincode);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileById(@PathVariable Long id) {
        ProfileResponse response = beneficiaryService.getProfileById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<ProfileResponse>> verifyProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal Long officerId,
            @Valid @RequestBody VerifyRequest request) {
        ProfileResponse response = beneficiaryService.verifyProfile(id, officerId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile verified successfully", response));
    }
}
