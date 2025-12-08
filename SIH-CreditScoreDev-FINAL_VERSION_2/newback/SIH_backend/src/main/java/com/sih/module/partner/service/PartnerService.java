package com.sih.module.partner.service;

import com.sih.common.enums.UserRole;
import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.auth.service.EmailService;
import com.sih.module.partner.dto.PartnerRequestDTO;
import com.sih.module.partner.entity.ChannelPartner;
import com.sih.module.partner.entity.ChannelPartnerProfile;
import com.sih.module.partner.entity.PartnerAccountRequest;
import com.sih.module.partner.repository.ChannelPartnerProfileRepository;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import com.sih.module.partner.repository.PartnerAccountRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerService {

    private final PartnerAccountRequestRepository requestRepository;
    private final ChannelPartnerRepository partnerRepository;
    private final ChannelPartnerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public PartnerAccountRequest createRequest(PartnerRequestDTO dto) {
        if (requestRepository.findByGmailForLogin(dto.getGmailForLogin()).isPresent()) {
            throw new BadRequestException("Request with this Gmail already exists");
        }
        
        PartnerAccountRequest request = PartnerAccountRequest.builder()
                .gmailForLogin(dto.getGmailForLogin())
                .officialOrganizationEmail(dto.getOfficialOrganizationEmail())
                .contactPersonName(dto.getContactPersonName())
                .mobile(dto.getMobile())
                .note(dto.getNote())
                .status("PENDING")
                .build();
        
        return requestRepository.save(request);
    }

    public Page<PartnerAccountRequest> getAllRequests(String status, Pageable pageable) {
        return requestRepository.findByStatus(status != null ? status : "PENDING", pageable);
    }

    @Transactional
    public void approveRequest(Long requestId) {
        PartnerAccountRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException("Request is not in PENDING status");
        }

        // 1. Create User
        if (userRepository.existsByEmail(request.getGmailForLogin())) {
            throw new BadRequestException("User with email " + request.getGmailForLogin() + " already exists");
        }

        String tempPassword = generateRandomPassword();
        User user = User.builder()
                .email(request.getGmailForLogin())
                .phoneNumber(request.getMobile() != null ? request.getMobile() : "N/A-" + UUID.randomUUID().toString()) // Placeholder if empty
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(UserRole.CHANNEL_PARTNER)
                .isActive(true) // Direct activation, no OTP
                .isBlacklisted(false)
                .preferredLanguage("en")
                .build();

        user = userRepository.save(user);

        // 2. Create Channel Partner
        ChannelPartner partner = ChannelPartner.builder()
                .user(user)
                .loginEmail(request.getGmailForLogin())
                .organizationEmail(request.getOfficialOrganizationEmail())
                .isActive(true)
                .build();
        
        partner = partnerRepository.save(partner);

        // 3. Create Empty Profile
        ChannelPartnerProfile profile = ChannelPartnerProfile.builder()
                .channelPartner(partner)
                .contactPersonName(request.getContactPersonName())
                .organizationType("PENDING") // To be filled later
                .profileCompleted(false)
                .build();
        partnerRepository.save(partner); // update linkage if needed
        profileRepository.save(profile);

        // 4. Update Request Status
        request.setStatus("APPROVED");
        requestRepository.save(request);

        // 5. Send Email
        // TODO: Use a proper email template
        // emailService.sendSimpleMessage(request.getGmailForLogin(), "Partner Account Approved", 
        //    "Your account is approved. Use 'Forgot Password' to set your credentials.");
        log.info("Approved Partner Request {}. Temp Pass (Internal Use): {}", requestId, tempPassword);
    }

    @Transactional
    public void rejectRequest(Long requestId) {
        PartnerAccountRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        request.setStatus("REJECTED");
        requestRepository.save(request);
    }

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[10];
        random.nextBytes(bytes);
        return java.util.Base64.getEncoder().encodeToString(bytes).substring(0, 10);
    }

    // Profile Management
    public ChannelPartnerProfile getProfile(Long userId) {
        ChannelPartner partner = partnerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found for user"));
        
        return profileRepository.findByChannelPartnerId(partner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
    }

    @Transactional
    public ChannelPartnerProfile updateProfile(Long userId, ChannelPartnerProfile updatedProfile) {
        ChannelPartner partner = partnerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found for user"));

        ChannelPartnerProfile profile = profileRepository.findByChannelPartnerId(partner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        // Update fields
        profile.setOrganizationType(updatedProfile.getOrganizationType());
        profile.setRegisteredAddress(updatedProfile.getRegisteredAddress());
        profile.setState(updatedProfile.getState());
        profile.setDistrict(updatedProfile.getDistrict());
        profile.setPincode(updatedProfile.getPincode());
        profile.setContactPersonName(updatedProfile.getContactPersonName());
        profile.setContactPhone(updatedProfile.getContactPhone());
        profile.setOrganizationWebsite(updatedProfile.getOrganizationWebsite());
        profile.setSupportEmail(updatedProfile.getSupportEmail());
        
        // Documents (if passed)
        if (updatedProfile.getOrganizationLogo() != null) profile.setOrganizationLogo(updatedProfile.getOrganizationLogo());
        if (updatedProfile.getRegistrationCertificatePdf() != null) profile.setRegistrationCertificatePdf(updatedProfile.getRegistrationCertificatePdf());
        if (updatedProfile.getGstOrPanPdf() != null) profile.setGstOrPanPdf(updatedProfile.getGstOrPanPdf());

        // Check completion logic (simplified)
        if (profile.getOrganizationType() != null && !profile.getOrganizationType().isEmpty() &&
            profile.getRegisteredAddress() != null && !profile.getRegisteredAddress().isEmpty() &&
            profile.getState() != null && !profile.getState().isEmpty()) {
            profile.setProfileCompleted(true);
        }

        return profileRepository.save(profile);
    }
}
