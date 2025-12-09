package com.sih.module.partner.seeder;

import com.sih.common.enums.UserRole;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.partner.entity.ChannelPartner;
import com.sih.module.partner.entity.ChannelPartnerProfile;
import com.sih.module.partner.repository.ChannelPartnerProfileRepository;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// @Component - Disabled: Using comprehensive SQL seed script instead
@RequiredArgsConstructor
@Slf4j
public class PartnerSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ChannelPartnerRepository partnerRepository;
    private final ChannelPartnerProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String email = "partner@sih.com";
        if (userRepository.findByEmail(email).isPresent()) {
            log.info("Partner user already exists: {}", email);
            return;
        }

        log.info("Seeding sample partner user...");

        // Create User
        User user = User.builder()
                .email(email)
                .phoneNumber("9139812092")
                .passwordHash(passwordEncoder.encode("Partner@123"))
                .role(UserRole.CHANNEL_PARTNER)
                .isActive(true)
                .isBlacklisted(false)
                .preferredLanguage("en")
                .build();

        user = userRepository.save(user);

        // Create Partner
        ChannelPartner partner = ChannelPartner.builder()
                .user(user)
                .loginEmail(email)
                .organizationEmail("org@sih.com")
                .organizationName("Sample Provider Ltd")
                .isActive(true)
                .build();

        partner = partnerRepository.save(partner);

        // Create Profile
        ChannelPartnerProfile profile = ChannelPartnerProfile.builder()
                .channelPartner(partner)
                .contactPersonName("Sample Partner")
                .organizationType("NBFC")
                .profileCompleted(true)
                .build();

        profileRepository.save(profile);

        log.info("Sample channel partner created successfully.");
        log.info("Email: {}", email);
        log.info("Password: Partner@123");
    }
}
