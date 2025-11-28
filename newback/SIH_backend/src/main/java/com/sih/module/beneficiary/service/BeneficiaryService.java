
package com.sih.module.beneficiary.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.beneficiary.dto.*;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
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
public class BeneficiaryService {

    private final BeneficiaryProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SupabaseStorageService supabaseStorageService;

    @Transactional
    public ProfileResponse createProfile(Long userId, CreateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (profileRepository.findByUserUserId(userId).isPresent()) {
            throw new BadRequestException("Profile already exists for this user");
        }

        BeneficiaryProfile profile = BeneficiaryProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .casteCategory(request.getCasteCategory())
                .dob(request.getDob())
                .gender(request.getGender())
                .addressLine(request.getAddressLine())
                .district(request.getDistrict())
                .state(request.getState())
                .pincode(request.getPincode())
                .regionType(request.getRegionType())
                .geoLat(request.getGeoLat())
                .geoLong(request.getGeoLong())
                .literacyScore(request.getLiteracyScore() != null ? request.getLiteracyScore() : 0)
                .identityProofType(request.getIdentityProofType())
                .education(request.getEducation())
                .familySize(request.getFamilySize())
                .dependencyCount(request.getDependencyCount())
                .landOwned(request.getLandOwned())
                .incomeSource(request.getIncomeSource())
                .isGraduate(request.getIsGraduate() != null ? request.getIsGraduate() : false)
                .isProfileVerified(true)
                .build();

        profile = profileRepository.save(profile);
        log.info("Profile created for user: {}", userId);

        return mapToResponse(profile);
    }

    @Transactional
    public ProfileResponse createProfileWithFiles(Long userId, CreateProfileWithFilesRequest request,
            org.springframework.web.multipart.MultipartFile casteCertificate,
            org.springframework.web.multipart.MultipartFile identityProof) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (profileRepository.findByUserUserId(userId).isPresent()) {
            throw new BadRequestException("Profile already exists for this user");
        }

        // Create the profile
        BeneficiaryProfile profile = BeneficiaryProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .casteCategory(request.getCasteCategory())
                .dob(request.getDob())
                .gender(request.getGender())
                .addressLine(request.getAddressLine())
                .district(request.getDistrict())
                .state(request.getState())
                .pincode(request.getPincode())
                .regionType(request.getRegionType())
                .geoLat(request.getGeoLat())
                .geoLong(request.getGeoLong())
                .literacyScore(request.getLiteracyScore() != null ? request.getLiteracyScore() : 0)
                .identityProofType(request.getIdentityProofType())
                .education(request.getEducation())
                .familySize(request.getFamilySize())
                .dependencyCount(request.getDependencyCount())
                .landOwned(request.getLandOwned())
                .incomeSource(request.getIncomeSource())
                .isGraduate(request.getIsGraduate() != null ? request.getIsGraduate() : false)
                .isProfileVerified(true)
                .build();

        profile = profileRepository.save(profile);
        log.info("Profile created for user: {}", userId);

        // Upload caste certificate if provided
        if (casteCertificate != null && !casteCertificate.isEmpty()) {
            try {
                String fileUrl = supabaseStorageService.uploadFile(
                        casteCertificate.getBytes(),
                        casteCertificate.getOriginalFilename(),
                        "beneficiaries/caste");
                profile.setCasteCertificateUrl(fileUrl);
                profile.setCertificateStorageType("S3");
                log.info("Caste certificate uploaded for user: {}", userId);
            } catch (Exception e) {
                log.error("Failed to upload caste certificate for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to upload caste certificate");
            }
        }

        // Upload identity proof if provided
        if (identityProof != null && !identityProof.isEmpty()) {
            try {
                String fileUrl = supabaseStorageService.uploadFile(
                        identityProof.getBytes(),
                        identityProof.getOriginalFilename(),
                        "beneficiaries/identity");
                profile.setIdentityProofUrl(fileUrl);
                profile.setIdentityStorageType("S3");
                log.info("Identity proof uploaded for user: {}", userId);
            } catch (Exception e) {
                log.error("Failed to upload identity proof for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to upload identity proof");
            }
        }

        // Save profile with file URLs
        profile = profileRepository.save(profile);

        return mapToResponse(profile);
    }

    public ProfileResponse getMyProfile(Long userId) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseGet(() -> createEmptyProfile(userId));
        return mapToResponse(profile);
    }

    private BeneficiaryProfile createEmptyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BeneficiaryProfile profile = BeneficiaryProfile.builder()
                .user(user)
                .fullName(user.getEmail().split("@")[0]) // Default name from email
                .isProfileVerified(false)
                .build();

        return profileRepository.save(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (request.getFullName() != null)
            profile.setFullName(request.getFullName());
        if (request.getCasteCategory() != null)
            profile.setCasteCategory(request.getCasteCategory());
        if (request.getDob() != null)
            profile.setDob(request.getDob());
        if (request.getGender() != null)
            profile.setGender(request.getGender());
        if (request.getAddressLine() != null)
            profile.setAddressLine(request.getAddressLine());
        if (request.getDistrict() != null)
            profile.setDistrict(request.getDistrict());
        if (request.getState() != null)
            profile.setState(request.getState());
        if (request.getPincode() != null)
            profile.setPincode(request.getPincode());
        if (request.getRegionType() != null)
            profile.setRegionType(request.getRegionType());
        if (request.getGeoLat() != null)
            profile.setGeoLat(request.getGeoLat());
        if (request.getGeoLong() != null)
            profile.setGeoLong(request.getGeoLong());
        if (request.getLiteracyScore() != null)
            profile.setLiteracyScore(request.getLiteracyScore());
        if (request.getEducation() != null)
            profile.setEducation(request.getEducation());
        if (request.getFamilySize() != null)
            profile.setFamilySize(request.getFamilySize());
        if (request.getDependencyCount() != null)
            profile.setDependencyCount(request.getDependencyCount());
        if (request.getLandOwned() != null)
            profile.setLandOwned(request.getLandOwned());
        if (request.getIncomeSource() != null)
            profile.setIncomeSource(request.getIncomeSource());
        if (request.getIsGraduate() != null)
            profile.setIsGraduate(request.getIsGraduate());

        profile = profileRepository.save(profile);
        log.info("Profile updated for user: {}", userId);

        return mapToResponse(profile);
    }

    @Transactional
    public ProfileResponse updateProfileWithFiles(Long userId, UpdateProfileWithFilesRequest request,
            org.springframework.web.multipart.MultipartFile casteCertificate,
            org.springframework.web.multipart.MultipartFile identityProof) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        // Update basic profile fields
        if (request.getFullName() != null)
            profile.setFullName(request.getFullName());
        if (request.getCasteCategory() != null)
            profile.setCasteCategory(request.getCasteCategory());
        if (request.getDob() != null)
            profile.setDob(request.getDob());
        if (request.getGender() != null)
            profile.setGender(request.getGender());
        if (request.getAddressLine() != null)
            profile.setAddressLine(request.getAddressLine());
        if (request.getDistrict() != null)
            profile.setDistrict(request.getDistrict());
        if (request.getState() != null)
            profile.setState(request.getState());
        if (request.getPincode() != null)
            profile.setPincode(request.getPincode());
        if (request.getRegionType() != null)
            profile.setRegionType(request.getRegionType());
        if (request.getGeoLat() != null)
            profile.setGeoLat(request.getGeoLat());
        if (request.getGeoLong() != null)
            profile.setGeoLong(request.getGeoLong());
        if (request.getLiteracyScore() != null)
            profile.setLiteracyScore(request.getLiteracyScore());
        if (request.getEducation() != null)
            profile.setEducation(request.getEducation());
        if (request.getFamilySize() != null)
            profile.setFamilySize(request.getFamilySize());
        if (request.getDependencyCount() != null)
            profile.setDependencyCount(request.getDependencyCount());
        if (request.getLandOwned() != null)
            profile.setLandOwned(request.getLandOwned());
        if (request.getIncomeSource() != null)
            profile.setIncomeSource(request.getIncomeSource());
        if (request.getIsGraduate() != null)
            profile.setIsGraduate(request.getIsGraduate());
        if (request.getIdentityProofType() != null)
            profile.setIdentityProofType(request.getIdentityProofType());

        // Upload caste certificate if provided
        if (casteCertificate != null && !casteCertificate.isEmpty()) {
            try {
                String fileUrl = supabaseStorageService.uploadFile(
                        casteCertificate.getBytes(),
                        casteCertificate.getOriginalFilename(),
                        "beneficiaries/caste");
                profile.setCasteCertificateUrl(fileUrl);
                profile.setCertificateStorageType("S3");
                profile.setCertificateBlob(null); // Clear blob to save space
                log.info("Caste certificate uploaded for user: {}", userId);
            } catch (Exception e) {
                log.error("Failed to upload caste certificate for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to upload caste certificate");
            }
        }

        // Upload identity proof if provided
        if (identityProof != null && !identityProof.isEmpty()) {
            try {
                String fileUrl = supabaseStorageService.uploadFile(
                        identityProof.getBytes(),
                        identityProof.getOriginalFilename(),
                        "beneficiaries/identity");
                profile.setIdentityProofUrl(fileUrl);
                profile.setIdentityStorageType("S3");
                profile.setIdentityProofBlob(null); // Clear blob to save space
                log.info("Identity proof uploaded for user: {}", userId);
            } catch (Exception e) {
                log.error("Failed to upload identity proof for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to upload identity proof");
            }
        }

        profile = profileRepository.save(profile);
        log.info("Profile updated with files for user: {}", userId);

        return mapToResponse(profile);
    }

    @Transactional
    public ProfileResponse verifyProfile(Long profileId, Long officerId, VerifyRequest request) {
        BeneficiaryProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        profile.setVerifiedAnnualIncome(request.getVerifiedAnnualIncome());
        profile.setIsProfileVerified(true);
        profile.setVerifiedBy(officer);

        profile = profileRepository.save(profile);
        log.info("Profile verified: {} by officer: {}", profileId, officerId);

        return mapToResponse(profile);
    }

    public ProfileResponse getProfileById(Long profileId) {
        BeneficiaryProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return mapToResponse(profile);
    }

    public List<ProfileResponse> searchProfiles(String state, String district, String pincode) {
        List<BeneficiaryProfile> profiles = profileRepository.searchProfiles(state, district, pincode);
        return profiles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public String uploadCertificate(Long userId, byte[] fileData, String fileName) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        try {
            // Upload to Supabase S3 - caste folder
            String fileUrl = supabaseStorageService.uploadFile(fileData, fileName, "beneficiaries/caste");

            // Update profile with URL
            profile.setCasteCertificateUrl(fileUrl);
            profile.setCertificateStorageType("S3");
            profile.setCertificateBlob(null); // Clear blob to save space

            profileRepository.save(profile);
            log.info("Certificate uploaded to Supabase for user: {}", userId);

            return "Certificate uploaded successfully";
        } catch (Exception e) {
            log.error("Failed to upload certificate for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to upload certificate. Please try again.");
        }
    }

    @Transactional
    public String uploadIdentityProof(Long userId, byte[] fileData, String fileName) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        try {
            // Upload to Supabase S3 - identity folder
            String fileUrl = supabaseStorageService.uploadFile(fileData, fileName, "beneficiaries/identity");

            // Update profile with URL
            profile.setIdentityProofUrl(fileUrl);
            profile.setIdentityStorageType("S3");
            profile.setIdentityProofBlob(null);

            profileRepository.save(profile);
            log.info("Identity proof uploaded to Supabase for user: {}", userId);

            return "Identity proof uploaded successfully";
        } catch (Exception e) {
            log.error("Failed to upload identity proof for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to upload identity proof. Please try again.");
        }
    }

    public byte[] downloadCertificate(Long userId) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if ("S3".equals(profile.getCertificateStorageType()) && profile.getCasteCertificateUrl() != null) {
            return supabaseStorageService.downloadFile(profile.getCasteCertificateUrl());
        }

        if (profile.getCertificateBlob() != null) {
            return profile.getCertificateBlob();
        }

        throw new ResourceNotFoundException("Certificate not found");
    }

    public byte[] downloadIdentityProof(Long userId) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if ("S3".equals(profile.getIdentityStorageType()) && profile.getIdentityProofUrl() != null) {
            return supabaseStorageService.downloadFile(profile.getIdentityProofUrl());
        }

        if (profile.getIdentityProofBlob() != null) {
            return profile.getIdentityProofBlob();
        }

        throw new ResourceNotFoundException("Identity proof not found");
    }

    private ProfileResponse mapToResponse(BeneficiaryProfile profile) {
        return ProfileResponse.builder()
                .profileId(profile.getProfileId())
                .userId(profile.getUser().getUserId())
                .fullName(profile.getFullName())
                .casteCategory(profile.getCasteCategory())
                .dob(profile.getDob())
                .gender(profile.getGender())
                .addressLine(profile.getAddressLine())
                .district(profile.getDistrict())
                .state(profile.getState())
                .pincode(profile.getPincode())
                .regionType(profile.getRegionType())
                .geoLat(profile.getGeoLat())
                .geoLong(profile.getGeoLong())
                .literacyScore(profile.getLiteracyScore())
                .verifiedAnnualIncome(profile.getVerifiedAnnualIncome())
                .isProfileVerified(profile.getIsProfileVerified())
                .verifiedBy(profile.getVerifiedBy() != null ? profile.getVerifiedBy().getUserId() : null)
                .casteCertificateUrl(profile.getCasteCertificateUrl())
                .identityProofType(profile.getIdentityProofType())
                .identityProofUrl(profile.getIdentityProofUrl())
                .education(profile.getEducation())
                .familySize(profile.getFamilySize())
                .dependencyCount(profile.getDependencyCount())
                .landOwned(profile.getLandOwned())
                .incomeSource(profile.getIncomeSource())
                .isGraduate(profile.getIsGraduate())
                .hasCasteCertificate(profile.getCasteCertificateUrl() != null || profile.getCertificateBlob() != null)
                .hasIdentityProof(profile.getIdentityProofUrl() != null || profile.getIdentityProofBlob() != null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
