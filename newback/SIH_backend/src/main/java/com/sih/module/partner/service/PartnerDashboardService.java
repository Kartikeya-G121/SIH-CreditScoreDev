package com.sih.module.partner.service;

import com.sih.common.enums.UserRole;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.partner.entity.ChannelPartner;
import com.sih.module.partner.entity.LoanOfficer;
import com.sih.module.partner.entity.LoanOfficerProfile;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import com.sih.module.partner.repository.LoanOfficerProfileRepository;
import com.sih.module.partner.repository.LoanOfficerRepository;
import com.sih.module.scheme.dto.SchemeRequest;
import com.sih.module.scheme.dto.SchemeResponse;
import com.sih.module.scheme.entity.LoanScheme;
import com.sih.module.scheme.repository.LoanSchemeRepository;
import com.sih.module.scheme.service.SchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerDashboardService {

    private final ChannelPartnerRepository partnerRepository;
    private final LoanSchemeRepository schemeRepository;
    private final SchemeService schemeService; // Reusing mapper logic if possible, or just repo
    private final LoanOfficerRepository officerRepository;
    private final LoanOfficerProfileRepository officerProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Schemes
    @Transactional
    public SchemeResponse createScheme(Long userId, SchemeRequest request) {
        ChannelPartner partner = partnerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found"));

        // Create scheme using existing logic or manually
        // We reuse SchemeService logic if possible, but here we need to link Partner
        // So better to build it here.
        
        LoanScheme scheme = LoanScheme.builder()
                .schemeName(request.getSchemeName())
                .providerName(partner.getOrganizationName()) // Enforce Provider Name
                .channelPartner(partner)
                .loanCategory(request.getLoanCategory())
                .minAmount(request.getMinAmount())
                .maxAmount(request.getMaxAmount())
                .baseInterestRate(request.getBaseInterestRate())
                .minTenureMonths(request.getMinTenureMonths())
                .maxTenureMonths(request.getMaxTenureMonths())
                .isTieredInterest(request.getIsTieredInterest())
                .tierThreshold(request.getTierThreshold())
                .tierInterestRate(request.getTierInterestRate())
                .minAge(request.getMinAge())
                .maxAge(request.getMaxAge())
                .genderAllowed(request.getGenderAllowed())
                .casteCategory(request.getCasteCategory())
                .incomeMax(request.getIncomeMax())
                .maxExistingLoans(request.getMaxExistingLoans())
                .isSubsidy(request.getIsSubsidy())
                .subsidyType(request.getSubsidyType())
                .subsidyPercentage(request.getSubsidyPercentage())
                .gracePeriodDays(request.getGracePeriodDays())
                .penaltyRate(request.getPenaltyRate())
                .emiBounceCharges(request.getEmiBounceCharges())
                .allowPrepayment(request.getAllowPrepayment())
                .prepaymentPenalty(request.getPrepaymentPenalty())
                .isGroupLoanAllowed(request.getIsGroupLoanAllowed())
                .createdBy(partner.getLoginEmail())
                .isActive(true)
                .build();
        
        scheme = schemeRepository.save(scheme);
        
        // Map to Response (Simplified)
        return SchemeResponse.builder()
                .schemeId(scheme.getSchemeId())
                .schemeName(scheme.getSchemeName())
                .providerName(scheme.getProviderName())
                .build();
    }

    // Officers
    @Transactional
    public void createLoanOfficer(Long userId, String officerName, String officerEmail) {
        ChannelPartner partner = partnerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found"));

        if (userRepository.existsByEmail(officerEmail)) {
            throw new IllegalArgumentException("User with email " + officerEmail + " already exists");
        }

        String tempPassword = generateRandomPassword();
        User user = User.builder()
                .email(officerEmail)
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(UserRole.LOAN_OFFICER)
                .isActive(true)
                .isBlacklisted(false)
                .preferredLanguage("en")
                .phoneNumber("N/A-" + UUID.randomUUID())
                .build();
        
        user = userRepository.save(user);

        LoanOfficer officer = LoanOfficer.builder()
                .user(user)
                .channelPartner(partner)
                .name(officerName)
                .email(officerEmail)
                .isActive(true)
                .build();
        
        officer = officerRepository.save(officer);
        
        // Empty Profile
        LoanOfficerProfile profile = LoanOfficerProfile.builder()
                .loanOfficer(officer)
                .fullName(officerName)
                .profileCompleted(false)
                .build();
        officerProfileRepository.save(profile);
        
        // Send email (Mock)
        System.out.println("Loan Officer Created. Temp Pass: " + tempPassword);
    }
    
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[8];
        random.nextBytes(bytes);
        return java.util.Base64.getEncoder().encodeToString(bytes).substring(0, 8);
    }
}
