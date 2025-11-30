package com.sih.module.notification.service;

import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.notification.entity.Notification;
import com.sih.module.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SmsService smsService;
    private final com.sih.module.auth.service.EmailService emailService;

    @Transactional
    public Notification sendNotification(Long userId, String channel, String templateKey, Map<String, Object> payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .channel(channel)
                .templateKey(templateKey)
                .payload(payload)
                .status("PENDING")
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        String response = null;
        boolean success = false;

        try {
            if ("SMS".equalsIgnoreCase(channel)) {
                String message = (String) payload.get("message");
                if (message == null) {
                    message = "Notification: " + templateKey;
                }
                response = smsService.sendSms(user.getPhoneNumber(), message);
                success = response.startsWith("SUCCESS");
            } else if ("EMAIL".equalsIgnoreCase(channel)) {
                String subject = (String) payload.getOrDefault("subject", "Notification");
                String body = (String) payload.getOrDefault("body", "You have a new notification.");
                emailService.sendEmail(user.getEmail(), subject, body);
                response = "Email sent successfully";
                success = true;
            } else {
                response = "Unsupported channel: " + channel;
                success = false;
            }
        } catch (Exception e) {
            response = "Error: " + e.getMessage();
            success = false;
            log.error("Failed to send notification via {}", channel, e);
        }

        notification.setStatus(success ? "SENT" : "FAILED");
        notification.setProviderResponse(response);
        if (success) {
            notification.setSentAt(java.time.OffsetDateTime.now());
        }

        notification = notificationRepository.save(notification);
        log.info("Notification {} processed via {}. Status: {}", notification.getNotificationId(), channel,
                notification.getStatus());

        return notification;
    }

    public List<Notification> getMyNotifications(Long userId, Boolean isRead) {
        if (isRead != null) {
            return notificationRepository.findByUserUserIdAndIsRead(userId, isRead);
        }
        return notificationRepository.findByUserUserId(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserUserIdAndIsRead(userId, false);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
}
