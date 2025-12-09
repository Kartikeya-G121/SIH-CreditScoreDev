
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

    private static final String STORAGE_TYPE_S3 = "S3";

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
                .aadharNumber(request.getAadharNumber())
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
                .aadharNumber(request.getAadharNumber())
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
                profile.setCertificateStorageType(STORAGE_TYPE_S3);
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
                profile.setIdentityStorageType(STORAGE_TYPE_S3);
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
        if (request.getAadharNumber() != null)
            profile.setAadharNumber(request.getAadharNumber());
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
        if (request.getAadharNumber() != null)
            profile.setAadharNumber(request.getAadharNumber());
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
                profile.setCertificateStorageType(STORAGE_TYPE_S3);
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
                profile.setIdentityStorageType(STORAGE_TYPE_S3);
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
            profile.setCertificateStorageType(STORAGE_TYPE_S3);
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
            profile.setIdentityStorageType(STORAGE_TYPE_S3);
            profile.setIdentityProofBlob(null);

            profileRepository.save(profile);
            log.info("Identity proof uploaded to Supabase for user: {}", userId);

            return "Identity proof uploaded successfully";
        } catch (Exception e) {
            log.error("Failed to upload identity proof for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to upload identity proof. Please try again.");
        }
    }

    public DocumentDownloadDTO downloadCertificate(Long userId) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (STORAGE_TYPE_S3.equals(profile.getCertificateStorageType()) && profile.getCasteCertificateUrl() != null) {
            byte[] data = supabaseStorageService.downloadFile(profile.getCasteCertificateUrl());
            String fileName = extractFileNameFromUrl(profile.getCasteCertificateUrl(), "certificate");
            String contentType = determineContentType(fileName);
            
            return DocumentDownloadDTO.builder()
                    .data(data)
                    .fileName(fileName)
                    .contentType(contentType)
                    .build();
        }

        if (profile.getCertificateBlob() != null) {
            // Fallback for blob storage - default to PDF if unknown, or maybe generic binary
            return DocumentDownloadDTO.builder()
                    .data(profile.getCertificateBlob())
                    .fileName("certificate.pdf") 
                    .contentType("application/pdf")
                    .build();
        }

        throw new ResourceNotFoundException("Certificate not found");
    }

    public DocumentDownloadDTO downloadIdentityProof(Long userId) {
        BeneficiaryProfile profile = profileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (STORAGE_TYPE_S3.equals(profile.getIdentityStorageType()) && profile.getIdentityProofUrl() != null) {
            byte[] data = supabaseStorageService.downloadFile(profile.getIdentityProofUrl());
            String fileName = extractFileNameFromUrl(profile.getIdentityProofUrl(), "identity_proof");
            String contentType = determineContentType(fileName);

            return DocumentDownloadDTO.builder()
                    .data(data)
                    .fileName(fileName)
                    .contentType(contentType)
                    .build();
        }

        if (profile.getIdentityProofBlob() != null) {
             return DocumentDownloadDTO.builder()
                    .data(profile.getIdentityProofBlob())
                    .fileName("identity_proof.pdf")
                    .contentType("application/pdf")
                    .build();
        }

        throw new ResourceNotFoundException("Identity proof not found");
    }

    private String extractFileNameFromUrl(String url, String defaultName) {
        if (url == null || url.isEmpty()) {
            return defaultName;
        }
        try {
            // URL format: .../filename.ext or .../uuid_filename.ext
            int lastSlashIndex = url.lastIndexOf('/');
            if (lastSlashIndex != -1 && lastSlashIndex < url.length() - 1) {
                String rawName = url.substring(lastSlashIndex + 1);
                // Optional: remove UUID prefix if present (assuming UUID_filename format from upload)
                // Implement if needed, otherwise rawName is fine
                return rawName;
            }
        } catch (Exception e) {
            log.warn("Failed to extract filename from URL: {}", url);
        }
        return defaultName;
    }

    private String determineContentType(String fileName) {
        if (fileName == null) return "application/octet-stream";
        String lowerName = fileName.toLowerCase();
        if (lowerName.endsWith(".pdf")) return "application/pdf";
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
        if (lowerName.endsWith(".png")) return "image/png";
        return "application/octet-stream";
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
                .aadharNumber(profile.getAadharNumber())
                .education(profile.getEducation())
                .familySize(profile.getFamilySize())
                .dependencyCount(profile.getDependencyCount())
                .landOwned(profile.getLandOwned())
                .incomeSource(profile.getIncomeSource())
                .isGraduate(profile.getIsGraduate())
                .hasCasteCertificate(profile.getCasteCertificateUrl() != null || profile.getCertificateBlob() != null)
                .hasIdentityProof(profile.getIdentityProofUrl() != null || profile.getIdentityProofBlob() != null)
                .compositeScore(profile.getCompositeScore())
                .scoreTimestamp(profile.getScoreTimestamp())
                .riskBucket(profile.getRiskBucket())
                .incomeBucket(profile.getIncomeBucket())
                .mlExplanations(profile.getMlExplanations())
                .financialAdvice(generateFinancialAdvice(profile))
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private List<String> generateFinancialAdvice(BeneficiaryProfile profile) {
        List<String> advice = new java.util.ArrayList<>();
        if (profile.getCompositeScore() == null) {
            advice.add("Complete a loan application to generate your credit score.");
            return advice;
        }

        // Risk-based Advice
        String risk = profile.getRiskBucket();
        if ("High".equalsIgnoreCase(risk)) {
            advice.add("Focus on clearing existing periodic dues to improve your risk profile.");
            advice.add("Avoid taking multiple loans simultaneously.");
        } else if ("Medium".equalsIgnoreCase(risk)) {
            advice.add("Maintain your current repayment streaks to reach the Low Risk tier.");
        } else {
            advice.add("Excellent! You are eligible for higher loan amounts.");
        }

        // Income-based Advice
        String income = profile.getIncomeBucket();
        if ("Low".equalsIgnoreCase(income)) {
            advice.add("Consider joining a Joint Liability Group (JLG) to improve approval chances.");
            advice.add("Look for government schemes supporting micro-enterprises.");
        } else if ("Medium".equalsIgnoreCase(income)) {
            advice.add("You might be eligible for direct individual loans.");
        }

        if (advice.isEmpty()) {
            advice.add("Maintain consistent financial behavior to keep your score healthy.");
        }

        return advice;
    }
}
