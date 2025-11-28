package com.sih.module.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.password-reset.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private boolean isEmailConfigured() {
        boolean configured = fromEmail != null && !fromEmail.trim().isEmpty();
        if (!configured) {
            log.debug("Email not configured - fromEmail value: '{}' (empty or null)", fromEmail);
        }
        return configured;
    }

    // Diagnostic method to check email configuration
    public String getEmailConfigStatus() {
        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            return "Email NOT configured - spring.mail.username is empty or null. Set SMTP_USERNAME environment variable.";
        }
        return String.format("Email configured - From: %s (host: %s)",
                fromEmail,
                System.getenv("SMTP_HOST") != null ? System.getenv("SMTP_HOST") : "not set");
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (!isEmailConfigured()) {
            log.warn("Email not configured. Skipping password reset email to: {}", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset Request");

            String resetUrl = baseUrl + "/reset-password?token=" + resetToken;
            String emailBody = String.format(
                    "Hello,\n\n" +
                            "You have requested to reset your password. Please click on the link below to reset your password:\n\n"
                            +
                            "%s\n\n" +
                            "This link will expire in 24 hours.\n\n" +
                            "If you did not request this, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "Income Processing System",
                    resetUrl);

            message.setText(emailBody);
            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            // Fail-safe: Log error but don't crash the application
            // Password reset token is still generated and saved
            log.error("Failed to send password reset email to: {} - Error: {}", toEmail, e.getMessage());
            // Don't throw exception - allow user to request reset again or contact support
            // In production, you might want to queue the email for retry
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String name) {
        if (!isEmailConfigured()) {
            log.warn("Email not configured. Skipping welcome email to: {}", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Income Processing System");

            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "Welcome to the Income Processing & Scoring System!\n\n" +
                            "Your account has been successfully created.\n\n" +
                            "Best regards,\n" +
                            "Income Processing System",
                    name);

            message.setText(emailBody);
            mailSender.send(message);
            log.info("Welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            // Fail-safe: Log error but don't prevent user registration
            log.error("Failed to send welcome email to: {} - Error: {}", toEmail, e.getMessage());
            // User registration continues successfully even if email fails
        }
    }

    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        if (!isEmailConfigured()) {
            log.warn("Email not configured. Skipping email to: {}", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to: {} - Error: {}", toEmail, e.getMessage());
        }
    }
}
