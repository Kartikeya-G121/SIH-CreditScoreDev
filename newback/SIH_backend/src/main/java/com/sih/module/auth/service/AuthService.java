package com.sih.module.auth.service;

import com.sih.common.enums.UserRole;
import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.common.security.JwtService;
import com.sih.common.util.TokenUtil;
import com.sih.module.auth.dto.*;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final NotificationService notificationService;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.password-reset.token-expiry-hours:24}")
    private int tokenExpiryHours;

    private static final String OTP_PREFIX = "OTP:";
    private static final long OTP_EXPIRY_MINUTES = 5;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BadRequestException("Phone number already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.BENEFICIARY)
                .isActive(false) // Inactive until OTP verification
                .isBlacklisted(false)
                .preferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "en")
                .build();

        user = userRepository.save(user);

        // Generate and Send OTP
        String otp = generateOtp();
        saveOtp(request.getEmail(), otp);
        saveOtp(request.getPhoneNumber(), otp);

        // Send OTP via SMS
        Map<String, Object> smsPayload = new HashMap<>();
        smsPayload.put("message", "Your OTP for registration is: " + otp + ". Valid for 5 minutes.");
        notificationService.sendNotification(user.getUserId(), "SMS", "REGISTRATION_OTP", smsPayload);

        // Send OTP via Email
        Map<String, Object> emailPayload = new HashMap<>();
        emailPayload.put("subject", "Your Registration OTP");
        emailPayload.put("body", String.format(
                "Hello,\n\n" +
                        "Your OTP for registration is: %s\n\n" +
                        "This OTP is valid for 5 minutes.\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "Income Processing System",
                otp));
        notificationService.sendNotification(user.getUserId(), "EMAIL", "REGISTRATION_OTP", emailPayload);

        // Return partial response indicating OTP sent
        return AuthResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredLanguage(user.getPreferredLanguage())
                .accessToken("OTP_SENT") // Indicator for frontend
                .build();
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user;
        String identifier;
        
        if (request.getEmail() != null) {
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            identifier = request.getEmail();
        } else if (request.getPhoneNumber() != null) {
            user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            identifier = request.getPhoneNumber();
        } else {
            throw new BadRequestException("Email or phone number is required");
        }

        if (user.getIsActive()) {
            throw new BadRequestException("User is already active");
        }

        // Magic OTP for testing
        if ("16052004".equals(request.getOtp())) {
            log.info("Magic OTP used for user: {}", identifier);
        } else {
            // Real OTP verification
            String storedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + identifier);
            if (storedOtp == null || !storedOtp.equals(request.getOtp())) {
                throw new BadRequestException("Invalid or expired OTP");
            }
            // Clear OTP after successful verification
            redisTemplate.delete(OTP_PREFIX + identifier);
        }

        // Activate User
        user.setIsActive(true);
        userRepository.save(user);

        // Send welcome email after activation
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send welcome email: {}", e.getMessage());
        }

        // Generate Tokens
        String accessToken = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredLanguage(user.getPreferredLanguage())
                .expiresIn(jwtService.getExpirationTime())
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private void saveOtp(String identifier, String otp) {
        redisTemplate.opsForValue().set(
                OTP_PREFIX + identifier,
                otp,
                OTP_EXPIRY_MINUTES,
                TimeUnit.MINUTES);
    }

    public void resendOtp(String phoneNumber) {
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsActive()) {
            throw new BadRequestException("User is already active");
        }

        // Generate and Send new OTP
        String otp = generateOtp();
        saveOtp(user.getEmail(), otp);

        // Send OTP via SMS
        Map<String, Object> smsPayload = new HashMap<>();
        smsPayload.put("message", "Your OTP for registration is: " + otp + ". Valid for 5 minutes.");
        notificationService.sendNotification(user.getUserId(), "SMS", "REGISTRATION_OTP", smsPayload);

        // Send OTP via Email
        Map<String, Object> emailPayload = new HashMap<>();
        emailPayload.put("subject", "Your Registration OTP (Resent)");
        emailPayload.put("body", String.format(
                "Hello,\n\n" +
                        "Your OTP for registration is: %s\n\n" +
                        "This OTP is valid for 5 minutes.\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "Income Processing System",
                otp));
        notificationService.sendNotification(user.getUserId(), "EMAIL", "REGISTRATION_OTP", emailPayload);

        log.info("OTP resent to user: {}", phoneNumber);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getUsername())
                .orElseGet(() -> userRepository.findByPhoneNumber(request.getUsername())
                        .orElseThrow(() -> new BadRequestException("Invalid credentials")));

        if (!user.getIsActive()) {
            throw new BadRequestException("Account is inactive. Please verify OTP.");
        }

        if (user.getIsBlacklisted()) {
            throw new BadRequestException("Account is blacklisted");
        }

        if (user.getPasswordHash() == null ||
                !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid credentials");
        }

        // Generate JWT tokens
        String accessToken = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredLanguage(user.getPreferredLanguage())
                .expiresIn(jwtService.getExpirationTime())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        String resetToken = TokenUtil.generateResetToken();
        OffsetDateTime expiry = OffsetDateTime.now().plusHours(tokenExpiryHours);

        user.setResetToken(resetToken);
        user.setResetTokenExpiry(expiry);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        log.info("Password reset token generated for user: {}", user.getEmail());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        log.info("Password reset successful for user: {}", user.getEmail());
    }

    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
        log.info("User logged out, token blacklisted");
    }

    public AuthResponse refreshToken(String refreshToken) {
        // Validate refresh token
        if (!jwtService.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        // Check if it's actually a refresh token
        if (!"refresh".equals(jwtService.getTokenType(refreshToken))) {
            throw new BadRequestException("Invalid token type");
        }

        // Check if token is blacklisted
        if (tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
            throw new BadRequestException("Token has been revoked");
        }

        // Extract user info from refresh token
        Long userId = jwtService.extractUserId(refreshToken);
        String email = jwtService.extractUsername(refreshToken);
        String role = jwtService.extractRole(refreshToken);

        // Get user to verify still active
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.getIsActive()) {
            throw new BadRequestException("Account is inactive");
        }

        // Generate new tokens
        String newAccessToken = jwtService.generateToken(userId, email, role);
        String newRefreshToken = jwtService.generateRefreshToken(userId, email, role);

        // Blacklist old refresh token
        tokenBlacklistService.blacklistToken(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(userId)
                .email(email)
                .role(user.getRole())
                .expiresIn(jwtService.getExpirationTime())
                .build();
    }

    public UserProfileResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
