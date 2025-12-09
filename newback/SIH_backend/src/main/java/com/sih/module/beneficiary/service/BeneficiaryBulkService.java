package com.sih.module.beneficiary.service;

import com.sih.common.enums.UserRole;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.beneficiary.dto.BeneficiaryDataDTO;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import com.sih.module.partner.dto.BulkUploadResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BeneficiaryBulkService {

    private final UserRepository userRepository;
    private final BeneficiaryProfileRepository beneficiaryProfileRepository;
    private final PasswordEncoder passwordEncoder;
    // TODO: Inject EmailService when ready
    // private final EmailService emailService;

    private static final String DEFAULT_PASSWORD = "basic";

    @Transactional
    public BulkUploadResult bulkCreateOrUpdateBeneficiaries(List<BeneficiaryDataDTO> dataList) {
        BulkUploadResult result = BulkUploadResult.builder()
                .totalRows(dataList.size())
                .usersCreated(0)
                .profilesUpdated(0)
                .failedRows(0)
                .build();

        for (BeneficiaryDataDTO data : dataList) {
            try {
                processRow(data, result);
            } catch (Exception e) {
                result.setFailedRows(result.getFailedRows() + 1);
                result.addError(String.format("Row %d: %s", data.getRowNumber(), e.getMessage()));
                log.error("Error processing row {}: {}", data.getRowNumber(), e.getMessage(), e);
            }
        }

        log.info("Bulk upload completed: {} users created, {} profiles updated, {} failed",
                result.getUsersCreated(), result.getProfilesUpdated(), result.getFailedRows());

        return result;
    }

    private void processRow(BeneficiaryDataDTO data, BulkUploadResult result) {
        // Validate required fields
        if (data.getEmail() == null || data.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (data.getPhone() == null || data.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Phone is required");
        }

        // Check if user exists by email or phone
        User user = userRepository.findByEmail(data.getEmail()).orElse(null);

        if (user == null) {
            user = userRepository.findByPhoneNumber(data.getPhone()).orElse(null);
        }

        boolean isNewUser = (user == null);

        if (isNewUser) {
            // Create new user
            user = createUser(data);
            result.setUsersCreated(result.getUsersCreated() + 1);

            // TODO: Send email notification
            // emailService.sendAccountCreationEmail(data.getEmail(), DEFAULT_PASSWORD);
            log.info("Created new user: {} (email: {}, phone: {})",
                    user.getUserId(), data.getEmail(), data.getPhone());
        }

        // Create or update beneficiary profile
        BeneficiaryProfile profile = beneficiaryProfileRepository.findByUser(user).orElse(null);

        if (profile == null) {
            profile = createProfile(user, data);
            log.info("Created new beneficiary profile for user: {}", user.getUserId());
        } else {
            updateProfile(profile, data);
            log.info("Updated beneficiary profile for user: {}", user.getUserId());
        }

        beneficiaryProfileRepository.save(profile);
        result.setProfilesUpdated(result.getProfilesUpdated() + 1);
    }

    private User createUser(BeneficiaryDataDTO data) {
        User user = User.builder()
                .email(data.getEmail())
                .phoneNumber(data.getPhone())
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(UserRole.BENEFICIARY)
                .isActive(true)
                .isBlacklisted(false)
                .preferredLanguage("en")
                .build();

        return userRepository.save(user);
    }

    private BeneficiaryProfile createProfile(User user, BeneficiaryDataDTO data) {
        BeneficiaryProfile profile = BeneficiaryProfile.builder()
                .user(user)
                .fullName(data.getFullName())
                .casteCategory(data.getCasteCategory())
                .dob(data.getDob())
                .gender(data.getGender())
                .addressLine(data.getAddressLine())
                .district(data.getDistrict())
                .state(data.getState())
                .pincode(data.getPincode())
                .regionType(data.getRegionType())
                .verifiedAnnualIncome(data.getVerifiedAnnualIncome())
                .education(data.getEducation())
                .familySize(data.getFamilySize())
                .dependencyCount(data.getDependencyCount())
                .landOwned(data.getLandOwned())
                .incomeSource(data.getIncomeSource())
                .isGraduate(data.getIsGraduate())
                .isProfileVerified(true)
                .build();

        return profile;
    }

    private void updateProfile(BeneficiaryProfile profile, BeneficiaryDataDTO data) {
        // Only update fields that are currently NULL
        if (profile.getFullName() == null && data.getFullName() != null) {
            profile.setFullName(data.getFullName());
        }
        if (profile.getCasteCategory() == null && data.getCasteCategory() != null) {
            profile.setCasteCategory(data.getCasteCategory());
        }
        if (profile.getDob() == null && data.getDob() != null) {
            profile.setDob(data.getDob());
        }
        if (profile.getGender() == null && data.getGender() != null) {
            profile.setGender(data.getGender());
        }
        if (profile.getAddressLine() == null && data.getAddressLine() != null) {
            profile.setAddressLine(data.getAddressLine());
        }
        if (profile.getDistrict() == null && data.getDistrict() != null) {
            profile.setDistrict(data.getDistrict());
        }
        if (profile.getState() == null && data.getState() != null) {
            profile.setState(data.getState());
        }
        if (profile.getPincode() == null && data.getPincode() != null) {
            profile.setPincode(data.getPincode());
        }
        if (profile.getRegionType() == null && data.getRegionType() != null) {
            profile.setRegionType(data.getRegionType());
        }
        if (profile.getVerifiedAnnualIncome() == null && data.getVerifiedAnnualIncome() != null) {
            profile.setVerifiedAnnualIncome(data.getVerifiedAnnualIncome());
        }
        if (profile.getEducation() == null && data.getEducation() != null) {
            profile.setEducation(data.getEducation());
        }
        if (profile.getFamilySize() == null && data.getFamilySize() != null) {
            profile.setFamilySize(data.getFamilySize());
        }
        if (profile.getIncomeSource() == null && data.getIncomeSource() != null) {
            profile.setIncomeSource(data.getIncomeSource());
        }
    }
}
